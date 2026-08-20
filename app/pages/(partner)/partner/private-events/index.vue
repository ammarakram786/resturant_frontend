<script setup lang="ts">
import type { PrivateEventRecord, RestaurantSectionRecord } from '~~/shared/types/domain'
import { usePartner } from '../../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Partner Private Events',
  description: 'Operator private-event pipeline, sections, quoting, and event follow-up.',
})

const partner = usePartner()
const selectedEventId = ref<number | null>(null)
const actionState = reactive({
  busyAction: '',
  busyEventId: 0,
  error: '',
  success: '',
})

const { data: baseData, refresh } = await useAsyncData('partner-private-events', async () => {
  const [events, calendar, layout] = await Promise.all([
    partner.listPrivateEvents(),
    partner.getPrivateEventCalendar(),
    partner.listSections(),
  ])
  return { events, calendar, layout }
})

const events = computed<PrivateEventRecord[]>(() => baseData.value?.events ?? [])
const calendar = computed(() => baseData.value?.calendar ?? [])
const sections = computed<RestaurantSectionRecord[]>(() =>
  baseData.value?.layout?.floors.flatMap((floor) =>
    floor.sections.map((section) => ({
      key: section.key,
      name: section.name,
      capacity: Number(section.capacity ?? 0),
      private_event_enabled: section.private_event_enabled !== false,
    })),
  ) ?? [],
)

watch(events, (items) => {
  if (!items.length) {
    selectedEventId.value = null
    return
  }
  const [firstEvent] = items
  if (!selectedEventId.value || !items.some((event) => event.id === selectedEventId.value)) {
    selectedEventId.value = firstEvent?.id ?? null
  }
}, { immediate: true })

const selectedEvent = computed(() =>
  events.value.find((event) => event.id === selectedEventId.value) ?? null,
)

const quoteForm = reactive({
  operator_notes: '',
  line_label: '',
  line_quantity: 1,
  line_unit_price: '0',
  line_notes: '',
})

watch(selectedEvent, (value) => {
  quoteForm.operator_notes = value?.operator_notes || ''
}, { immediate: true })

const messageDraft = ref('')
const sectionForm = reactive<RestaurantSectionRecord>({
  key: '',
  name: '',
  capacity: 0,
  private_event_enabled: true,
})

async function submitQuote(event: PrivateEventRecord) {
  actionState.busyAction = 'quote'
  actionState.busyEventId = event.id
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.quotePrivateEvent(event.id, {
      operator_notes: quoteForm.operator_notes,
      lines: [
        {
          label: quoteForm.line_label || 'Venue hire',
          quantity: quoteForm.line_quantity,
          unit_price: quoteForm.line_unit_price,
          notes: quoteForm.line_notes,
        },
      ],
    })
    actionState.success = `Quote updated for event #${event.id}.`
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to quote this event.'
  }
  finally {
    actionState.busyAction = ''
    actionState.busyEventId = 0
  }
}

async function confirmEvent(event: PrivateEventRecord) {
  actionState.busyAction = 'confirm'
  actionState.busyEventId = event.id
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.confirmPrivateEvent(event.id)
    actionState.success = `Event #${event.id} confirmed.`
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to confirm this event.'
  }
  finally {
    actionState.busyAction = ''
    actionState.busyEventId = 0
  }
}

async function declineEvent(event: PrivateEventRecord) {
  actionState.busyAction = 'decline'
  actionState.busyEventId = event.id
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.declinePrivateEvent(event.id)
    actionState.success = `Event #${event.id} declined.`
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to decline this event.'
  }
  finally {
    actionState.busyAction = ''
    actionState.busyEventId = 0
  }
}

async function sendMessage(event: PrivateEventRecord) {
  if (!messageDraft.value.trim()) {
    return
  }

  actionState.busyAction = 'message'
  actionState.busyEventId = event.id
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.messagePrivateEvent(event.id, messageDraft.value.trim())
    actionState.success = `Message sent for event #${event.id}.`
    messageDraft.value = ''
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to message this event.'
  }
  finally {
    actionState.busyAction = ''
    actionState.busyEventId = 0
  }
}

async function createSection() {
  actionState.busyAction = 'section'
  actionState.busyEventId = 0
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.createSection({
      key: sectionForm.key || `section-${Date.now()}`,
      name: sectionForm.name,
      capacity: Number(sectionForm.capacity),
      private_event_enabled: sectionForm.private_event_enabled,
    })
    actionState.success = `Section ${sectionForm.name || sectionForm.key} created.`
    sectionForm.key = ''
    sectionForm.name = ''
    sectionForm.capacity = 0
    sectionForm.private_event_enabled = true
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to create the section.'
  }
  finally {
    actionState.busyAction = ''
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <UAlert v-if="actionState.error" color="error" variant="soft" :title="actionState.error" />
    <UAlert v-else-if="actionState.success" color="success" variant="soft" :title="actionState.success" />

    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Private-event pipeline
              </h2>
              <p class="text-sm text-muted">
                Enquiries, quotes, and confirmations aligned to the current backend contract.
              </p>
            </div>
            <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" @click="refresh()">
              Refresh
            </UButton>
          </div>
        </template>

        <div class="space-y-3">
          <UCard
            v-for="event in events"
            :key="event.id"
            :variant="selectedEventId === event.id ? 'outline' : 'subtle'"
            class="cursor-pointer"
            @click="selectedEventId = event.id"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">
                    {{ event.customer_name || `Customer #${event.customer_id}` }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ event.event_type || 'Private event enquiry' }}
                  </p>
                </div>
                <UBadge
                  :color="event.status === 'confirmed' ? 'success' : event.status === 'declined' || event.status === 'cancelled' ? 'error' : 'warning'"
                  variant="soft"
                >
                  {{ event.status }}
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ formatDateTime(event.requested_starts_at) }} • {{ event.guest_count }} guests
              </p>
              <p class="text-sm text-muted">
                {{ event.section_key || 'No section assigned' }} • {{ event.contact_phone_masked || 'Masked phone unavailable' }}
              </p>
            </div>
          </UCard>

          <EmptyState
            v-if="!events.length"
            title="No private-event enquiries yet"
            description="When guests submit private-event requests, they will appear here for quoting and follow-up."
            icon="i-lucide-party-popper"
          />
        </div>
      </UCard>

      <UCard v-if="selectedEvent">
        <template #header>
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-highlighted">
              {{ selectedEvent.customer_name || `Customer #${selectedEvent.customer_id}` }}
            </h3>
            <p class="text-sm text-muted">
              {{ formatDateTime(selectedEvent.requested_starts_at) }} to {{ formatDateTime(selectedEvent.requested_ends_at) }}
            </p>
          </div>
        </template>

        <div class="space-y-5">
          <div class="grid gap-3 md:grid-cols-2">
            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">
                Event details
              </p>
              <p class="mt-2 text-sm text-muted">
                Status: {{ selectedEvent.status }}
              </p>
              <p class="text-sm text-muted">
                Section: {{ selectedEvent.section_key || 'Unassigned' }}
              </p>
              <p class="text-sm text-muted">
                Contact: {{ selectedEvent.contact_phone_masked || 'Masked phone unavailable' }}
              </p>
              <p class="text-sm text-muted">
                Notes: {{ selectedEvent.notes || 'No guest notes' }}
              </p>
            </UCard>

            <UCard variant="subtle">
              <p class="text-xs uppercase tracking-wide text-muted">
                Actions
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <UButton
                  color="success"
                  variant="soft"
                  :loading="actionState.busyEventId === selectedEvent.id && actionState.busyAction === 'confirm'"
                  @click="confirmEvent(selectedEvent)"
                >
                  Confirm
                </UButton>
                <UButton
                  color="error"
                  variant="soft"
                  :loading="actionState.busyEventId === selectedEvent.id && actionState.busyAction === 'decline'"
                  @click="declineEvent(selectedEvent)"
                >
                  Decline
                </UButton>
              </div>
            </UCard>
          </div>

          <div class="grid gap-6 xl:grid-cols-2">
            <UCard>
              <template #header>
                <div class="space-y-1">
                  <h4 class="font-semibold text-highlighted">
                    Quote builder
                  </h4>
                  <p class="text-sm text-muted">
                    Practical phase-one quoting with operator notes and line items.
                  </p>
                </div>
              </template>

              <div class="space-y-3">
                <UInput v-model="quoteForm.line_label" placeholder="Line item label" />
                <div class="grid gap-3 md:grid-cols-2">
                  <UInput v-model="quoteForm.line_quantity" type="number" placeholder="Quantity" />
                  <UInput v-model="quoteForm.line_unit_price" type="number" placeholder="Unit price" />
                </div>
                <UInput v-model="quoteForm.line_notes" placeholder="Line notes" />
                <UTextarea v-model="quoteForm.operator_notes" :rows="4" placeholder="Operator notes for the quote..." />
                <div class="flex justify-end">
                  <UButton
                    color="primary"
                    :loading="actionState.busyEventId === selectedEvent.id && actionState.busyAction === 'quote'"
                    @click="submitQuote(selectedEvent)"
                  >
                    Save quote
                  </UButton>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <div class="space-y-1">
                  <h4 class="font-semibold text-highlighted">
                    Follow-up message
                  </h4>
                  <p class="text-sm text-muted">
                    Send the latest operator update tied to this enquiry.
                  </p>
                </div>
              </template>

              <div class="space-y-3">
                <p class="text-sm text-muted">
                  Latest: {{ selectedEvent.latest_message || 'No operator follow-up sent yet.' }}
                </p>
                <UTextarea v-model="messageDraft" :rows="4" placeholder="Share next steps, questions, or venue guidance..." />
                <div class="flex justify-end">
                  <UButton
                    color="neutral"
                    :loading="actionState.busyEventId === selectedEvent.id && actionState.busyAction === 'message'"
                    @click="sendMessage(selectedEvent)"
                  >
                    Send message
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>

          <UCard v-if="selectedEvent.quote_lines.length" variant="subtle">
            <template #header>
              <h4 class="font-semibold text-highlighted">
                Current quote
              </h4>
            </template>

            <div class="space-y-2 text-sm">
              <div v-for="line in selectedEvent.quote_lines" :key="line.id" class="flex items-center justify-between gap-3">
                <p class="text-muted">
                  {{ line.quantity }} x {{ line.label }}
                </p>
                <p class="font-medium text-highlighted">
                  PKR {{ line.subtotal }}
                </p>
              </div>
              <p class="pt-2 text-right font-semibold text-highlighted">
                Total: PKR {{ selectedEvent.quoted_total }}
              </p>
            </div>
          </UCard>
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Section inventory
            </h2>
            <p class="text-sm text-muted">
              Event-space sections used by the private-event contract.
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <div v-for="section in sections" :key="section.key" class="rounded-xl border border-default p-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium text-highlighted">
                {{ section.name }}
              </p>
              <UBadge :color="section.private_event_enabled ? 'success' : 'neutral'" variant="soft">
                {{ section.private_event_enabled ? 'Enabled' : 'Disabled' }}
              </UBadge>
            </div>
            <p class="text-muted">
              {{ section.key }} • Capacity {{ section.capacity }}
            </p>
          </div>

          <EmptyState
            v-if="!sections.length"
            title="No sections configured"
            description="Create sections below so private-event enquiries can be matched to venue inventory."
            icon="i-lucide-map"
          />
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Calendar and new section
            </h2>
            <p class="text-sm text-muted">
              Quick conflict view plus section creation for operator setup.
            </p>
          </div>
        </template>

        <div class="space-y-5">
          <div class="space-y-2">
            <p class="text-sm font-medium text-highlighted">
              Upcoming holds
            </p>
            <div v-for="item in calendar.slice(0, 5)" :key="item.id" class="rounded-xl border border-default p-3 text-sm">
              <p class="font-medium text-highlighted">
                {{ item.section_key || 'Unassigned section' }}
              </p>
              <p class="text-muted">
                {{ formatDateTime(item.requested_starts_at) }} • {{ item.guest_count }} guests • {{ item.status }}
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-sm font-medium text-highlighted">
              Add section
            </p>
            <UInput v-model="sectionForm.key" placeholder="Section key" />
            <UInput v-model="sectionForm.name" placeholder="Section name" />
            <UInput v-model="sectionForm.capacity" type="number" placeholder="Capacity" />
            <UCheckbox v-model="sectionForm.private_event_enabled" label="Private events enabled" />
            <div class="flex justify-end">
              <UButton
                color="primary"
                :loading="actionState.busyAction === 'section'"
                @click="createSection"
              >
                Create section
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
