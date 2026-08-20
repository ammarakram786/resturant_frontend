<script setup lang="ts">
import type {
  PickupOrderRecord,
  PickupOrderStatus,
  PosConnectionRecord,
  RestaurantAnalyticsOverview,
  RestaurantGuestSummary,
  RestaurantLayoutSnapshot,
  RestaurantSectionRecord,
} from '~~/shared/types/domain'
import { usePartner } from '../../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Partner Operations',
  description: 'Operator POS configuration, pickup handling, and guest/analytics snapshots.',
})

const partner = usePartner()
const pickupStatusFilter = ref('')
const actionState = reactive({
  savingPos: false,
  pickupOrderId: 0,
  pickupStatus: '',
  sectionKey: '',
  error: '',
  success: '',
})

const { data: overview, refresh: refreshOverview } = await useAsyncData('partner-operations-overview', async () => {
  const [analytics, guests] = await Promise.all([
    partner.getAnalyticsOverview(),
    partner.listGuests(),
  ])
  return { analytics, guests }
})

const { data: posConnection, refresh: refreshPosConnection } = await useAsyncData<PosConnectionRecord | null>(
  'partner-pos-connection',
  () => partner.getPosConnection(),
  { default: () => null },
)

const { data: layout, refresh: refreshLayout } = await useAsyncData<RestaurantLayoutSnapshot | null>(
  'partner-restaurant-layout',
  () => partner.listSections(),
  { default: () => null },
)

const posForm = reactive({
  provider: '',
  external_location_id: '',
  credentials_api_key: '',
  credentials_terminal_id: '',
  is_active: false,
  sync_orders: true,
  sync_menu: true,
  sync_spend: false,
})

watch(posConnection, (value) => {
  if (!value) {
    return
  }
  posForm.provider = value.provider
  posForm.external_location_id = value.external_location_id || ''
  posForm.is_active = value.is_active
  posForm.sync_orders = value.sync_orders
  posForm.sync_menu = value.sync_menu
  posForm.sync_spend = value.sync_spend
}, { immediate: true })

const { data: pickupResponse, pending: pickupPending, refresh: refreshPickupOrders } = await useAsyncData(
  'partner-pickup-orders',
  () => partner.listPickupOrders(pickupStatusFilter.value),
  { default: () => ({ items: [], meta: {} }) },
)

watch(pickupStatusFilter, () => {
  refreshPickupOrders()
})

const pickupOrders = computed<PickupOrderRecord[]>(() => pickupResponse.value?.items ?? [])
const analytics = computed<RestaurantAnalyticsOverview | null>(() => overview.value?.analytics ?? null)
const guests = computed<RestaurantGuestSummary[]>(() => overview.value?.guests ?? [])
const sectionRecords = computed<RestaurantSectionRecord[]>(() =>
  layout.value?.floors.flatMap((floor) =>
    floor.sections.map((section) => ({
      key: section.key,
      name: section.name,
      capacity: Number(section.capacity ?? 0),
      private_event_enabled: section.private_event_enabled !== false,
    })),
  ) ?? [],
)

async function savePosConnection() {
  actionState.savingPos = true
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.updatePosConnection({
      provider: posForm.provider,
      external_location_id: posForm.external_location_id,
      credentials: {
        api_key: posForm.credentials_api_key,
        terminal_id: posForm.credentials_terminal_id,
      },
      is_active: posForm.is_active,
      sync_orders: posForm.sync_orders,
      sync_menu: posForm.sync_menu,
      sync_spend: posForm.sync_spend,
    })
    actionState.success = 'POS connection updated.'
    posForm.credentials_api_key = ''
    posForm.credentials_terminal_id = ''
    await refreshPosConnection()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to update the POS connection.'
  }
  finally {
    actionState.savingPos = false
  }
}

async function updatePickupStatus(order: PickupOrderRecord, status: PickupOrderStatus) {
  actionState.pickupOrderId = order.id
  actionState.pickupStatus = status
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.updatePickupOrderStatus(order.id, status)
    actionState.success = `Pickup order ${order.code} updated to ${status}.`
    await refreshPickupOrders()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to update pickup status.'
  }
  finally {
    actionState.pickupOrderId = 0
    actionState.pickupStatus = ''
  }
}

async function toggleSection(section: RestaurantSectionRecord) {
  actionState.sectionKey = section.key
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.updateSection(section.key, {
      private_event_enabled: !section.private_event_enabled,
    })
    actionState.success = `Updated section ${section.name}.`
    await refreshLayout()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to update the section.'
  }
  finally {
    actionState.sectionKey = ''
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Immediate pickup'
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <UAlert v-if="actionState.error" color="error" variant="soft" :title="actionState.error" />
    <UAlert v-else-if="actionState.success" color="success" variant="soft" :title="actionState.success" />

    <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              POS connection
            </h2>
            <p class="text-sm text-muted">
              Write-only credentials, location mapping, and sync controls for operator POS readiness.
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <UInput v-model="posForm.provider" placeholder="Provider" />
            <UInput v-model="posForm.external_location_id" placeholder="External location ID" />
            <UInput v-model="posForm.credentials_api_key" placeholder="API key (write-only)" />
            <UInput v-model="posForm.credentials_terminal_id" placeholder="Terminal ID (write-only)" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UCheckbox v-model="posForm.is_active" label="POS active" />
            <UCheckbox v-model="posForm.sync_orders" label="Sync pickup orders" />
            <UCheckbox v-model="posForm.sync_menu" label="Sync menu" />
            <UCheckbox v-model="posForm.sync_spend" label="Sync spend analytics" />
          </div>

          <UAlert
            color="neutral"
            variant="soft"
            title="Masked credentials"
            :description="`Stored keys stay write-only. Current backend mask: ${Object.keys(posConnection?.credentials_masked || {}).join(', ') || 'none yet'}`"
          />

          <div class="flex justify-end">
            <UButton color="primary" :loading="actionState.savingPos" @click="savePosConnection">
              Save POS connection
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Operational snapshot
            </h2>
            <p class="text-sm text-muted">
              Derived analytics and repeat-guest memory for daily shift management.
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid gap-3 md:grid-cols-3">
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">
                Total bookings
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ analytics?.bookings_total ?? 0 }}
              </p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">
                Pending modifications
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ analytics?.pending_modifications ?? 0 }}
              </p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">
                Known guests
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ guests.length }}
              </p>
            </UCard>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-highlighted">
              Top repeat guests
            </p>
            <div class="space-y-2">
              <div v-for="guest in guests.slice(0, 5)" :key="guest.user_id" class="rounded-xl border border-default p-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-medium text-highlighted">
                    {{ guest.name }}
                  </p>
                  <UBadge color="neutral" variant="soft">
                    {{ guest.visits }} visits
                  </UBadge>
                </div>
                <p class="text-muted">
                  Last status: {{ guest.last_status }} • Trust {{ guest.trust_score }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Floor and table readiness
            </h2>
            <p class="text-sm text-muted">
              Layout, table count, and seating capacity pulled from the operator section inventory.
            </p>
          </div>
        </template>

        <div v-if="layout" class="space-y-4">
          <div class="grid gap-3 md:grid-cols-4">
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">Floors</p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">{{ layout.summary.floors }}</p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">Sections</p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">{{ layout.summary.sections }}</p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">Tables</p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">{{ layout.summary.tables }}</p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">Seats</p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">{{ layout.summary.seats }}</p>
            </UCard>
          </div>

          <div class="space-y-3">
            <div v-for="floor in layout.floors" :key="floor.key" class="rounded-2xl border border-default p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">{{ floor.name }}</p>
                <UBadge color="neutral" variant="soft">{{ floor.sections.length }} sections</UBadge>
              </div>
              <div class="mt-3 grid gap-3 md:grid-cols-2">
                <UCard v-for="section in floor.sections" :key="section.key" variant="subtle">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <p class="font-medium text-highlighted">{{ section.name }}</p>
                      <UBadge :color="section.private_event_enabled ? 'success' : 'neutral'" variant="soft">
                        {{ section.private_event_enabled ? 'Events on' : 'Events off' }}
                      </UBadge>
                    </div>
                    <p class="text-sm text-muted">
                      {{ section.capacity ?? 0 }} seats • {{ section.tables?.length ?? 0 }} tables
                    </p>
                  </div>
                </UCard>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Event-space controls
            </h2>
            <p class="text-sm text-muted">
              Toggle which sections stay available for private-event quoting and operations.
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <div v-for="section in sectionRecords" :key="section.key" class="rounded-2xl border border-default p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="font-medium text-highlighted">{{ section.name }}</p>
                <p class="text-sm text-muted">{{ section.key }} • Capacity {{ section.capacity }}</p>
              </div>
              <UButton
                color="neutral"
                variant="soft"
                :loading="actionState.sectionKey === section.key"
                @click="toggleSection(section)"
              >
                {{ section.private_event_enabled ? 'Disable private events' : 'Enable private events' }}
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-highlighted">
              Pickup operations
            </h2>
            <p class="text-sm text-muted">
              Operator-side pickup queue with narrow backend status updates for partner web consumption.
            </p>
          </div>
          <div class="flex gap-3">
            <USelect
              v-model="pickupStatusFilter"
              :items="[
                { label: 'All statuses', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Accepted', value: 'accepted' },
                { label: 'Preparing', value: 'preparing' },
                { label: 'Ready', value: 'ready' },
                { label: 'Collected', value: 'collected' },
                { label: 'Cancelled', value: 'cancelled' }
              ]"
              value-key="value"
              class="w-44"
            />
            <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="pickupPending" @click="refreshPickupOrders()">
              Refresh
            </UButton>
          </div>
        </div>
      </template>

      <div v-if="pickupOrders.length" class="grid gap-4 xl:grid-cols-2">
        <UCard v-for="order in pickupOrders" :key="order.id" variant="subtle">
          <div class="space-y-4">
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">
                  {{ order.code }}
                </p>
                <UBadge :color="order.status === 'ready' || order.status === 'collected' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'" variant="soft">
                  {{ order.status }}
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ order.customer.name }} • {{ order.customer.masked_phone }}
              </p>
              <p class="text-sm text-muted">
                {{ formatDateTime(order.scheduled_for) }} • PKR {{ order.subtotal }}
              </p>
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-highlighted">
                Items
              </p>
              <ul class="space-y-1 text-sm text-muted">
                <li v-for="item in order.items" :key="item.id">
                  {{ item.quantity }} x {{ item.name }} - PKR {{ item.subtotal }}
                </li>
              </ul>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="status in ['accepted', 'preparing', 'ready', 'collected', 'cancelled']"
                :key="status"
                color="primary"
                variant="soft"
                :disabled="order.status === status"
                :loading="actionState.pickupOrderId === order.id && actionState.pickupStatus === status"
                @click="updatePickupStatus(order, status as PickupOrderStatus)"
              >
                {{ status }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <EmptyState
        v-else
        title="No pickup orders yet"
        description="When takeaway orders are created for this restaurant, they will appear here for operator handling."
        icon="i-lucide-shopping-bag"
      />
    </UCard>
  </div>
</template>
