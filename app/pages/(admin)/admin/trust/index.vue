<script setup lang="ts">
import { useAdmin } from '~~/app/composables/useAdmin'
import { useAdminFormat } from '~~/app/composables/useAdminFormat'
import type { AdminCustomerSummary, AdminTrustDetail } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Admin Trust Controls',
  description: 'Customer lookup and manual trust adjustments with audit visibility.',
})

const admin = useAdmin()
const { formatDateTime, statusColor } = useAdminFormat()

const search = ref('')
const selectedCustomerId = ref<number | null>(null)
const trustForm = reactive({
  delta: 0,
  reason: '',
})
const revealForm = reactive({
  reason: '',
})
const saving = ref(false)
const revealing = ref(false)
const message = ref('')
const actionError = ref('')
const revealedPii = ref<{ name?: string, email?: string | null, phone?: string | null } | null>(null)

const { data: customers, pending, error, refresh } = await useAsyncData<AdminCustomerSummary[]>(
  'admin-customers',
  () => admin.getCustomers({ q: search.value || undefined }),
  { watch: [search] },
)

const { data: trustDetail, refresh: refreshTrust } = await useAsyncData<AdminTrustDetail | null>(
  () => `admin-trust-${selectedCustomerId.value ?? 'none'}`,
  () => selectedCustomerId.value ? admin.getCustomerTrust(selectedCustomerId.value) : Promise.resolve(null),
  { watch: [selectedCustomerId] },
)

const selectedCustomer = computed(() =>
  (customers.value ?? []).find((customer) => customer.id === selectedCustomerId.value) ?? null,
)

watchEffect(() => {
  const firstCustomer = customers.value?.[0]
  if (!selectedCustomerId.value && firstCustomer) {
    selectedCustomerId.value = firstCustomer.id
  }
})

const submitAdjustment = async () => {
  if (!selectedCustomerId.value) {
    return
  }

  saving.value = true
  message.value = ''
  actionError.value = ''

  try {
    await admin.adjustCustomerTrust(selectedCustomerId.value, {
      delta: trustForm.delta,
      reason: trustForm.reason,
    })
    trustForm.delta = 0
    trustForm.reason = ''
    message.value = 'Trust score updated.'
    await Promise.all([refresh(), refreshTrust()])
  }
  catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : 'Unable to adjust customer trust.'
  }
  finally {
    saving.value = false
  }
}

const revealPii = async () => {
  if (!selectedCustomerId.value || !revealForm.reason.trim()) {
    actionError.value = 'A reason is required before revealing customer contact details.'
    return
  }

  revealing.value = true
  message.value = ''
  actionError.value = ''

  try {
    const response = await admin.revealCustomerPii(selectedCustomerId.value, { reason: revealForm.reason.trim() })
    revealedPii.value = response.customer
    message.value = 'Customer contact details revealed and audited.'
  }
  catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : 'Unable to reveal customer contact details.'
  }
  finally {
    revealing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-highlighted">
            Customer trust controls
          </h2>
          <p class="text-sm text-muted">
            Search a customer, inspect recent bookings, then apply a reasoned trust adjustment that stays in the audit trail.
          </p>
        </div>
      </template>

      <div class="flex gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name, email, phone, or username"
          class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm"
        >
      </div>
    </UCard>

    <EmptyState
      v-if="error"
      title="Trust queue unavailable"
      :description="error.message"
      icon="i-lucide-badge-check"
    >
      <UButton color="error" variant="soft" @click="refresh()">
        Retry
      </UButton>
    </EmptyState>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-highlighted">
              Customer lookup
            </h2>
            <span class="text-sm text-muted">
              {{ pending ? 'Loading…' : `${customers?.length ?? 0} results` }}
            </span>
          </div>
        </template>

        <div class="space-y-3">
          <button
            v-for="customer in customers ?? []"
            :key="customer.id"
            type="button"
            class="w-full rounded-2xl border px-4 py-4 text-left transition"
            :class="selectedCustomerId === customer.id ? 'border-error-300 bg-error-50/50' : 'border-default bg-white hover:border-error-200'"
            @click="selectedCustomerId = customer.id"
          >
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="font-semibold text-highlighted">
                {{ customer.name }}
              </h3>
              <UBadge :color="statusColor(customer.tier)" variant="soft">
                {{ customer.tier }}
              </UBadge>
              <UBadge :color="customer.trust_score >= 70 ? 'success' : customer.trust_score < 40 ? 'error' : 'warning'" variant="subtle">
                Score {{ customer.trust_score }}
              </UBadge>
            </div>
            <p class="mt-2 text-sm text-muted">
              {{ customer.masked_email || 'No email' }} · {{ customer.masked_phone || 'No phone' }}
            </p>
            <p class="mt-2 text-sm text-muted">
              {{ customer.bookings_total }} bookings
            </p>
          </button>

          <p v-if="!(customers?.length) && !pending" class="text-sm text-muted">
            No customers matched the current search.
          </p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-highlighted">
            Trust detail
          </h2>
        </template>

        <div v-if="trustDetail" class="space-y-4">
          <div class="rounded-2xl border border-default px-4 py-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm text-muted">
                  Customer
                </p>
                <p class="font-semibold text-highlighted">
                  {{ trustDetail.customer.email || `Customer #${trustDetail.customer.id}` }}
                </p>
              </div>
              <UBadge :color="trustDetail.customer.trust_score >= 70 ? 'success' : trustDetail.customer.trust_score < 40 ? 'error' : 'warning'" variant="soft">
                {{ trustDetail.customer.trust_score }}
              </UBadge>
            </div>
            <div v-if="revealedPii" class="mt-3 rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted">
              <p><span class="font-medium text-highlighted">Name:</span> {{ revealedPii.name || 'Unknown' }}</p>
              <p><span class="font-medium text-highlighted">Email:</span> {{ revealedPii.email || 'No email' }}</p>
              <p><span class="font-medium text-highlighted">Phone:</span> {{ revealedPii.phone || 'No phone' }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
              Reveal contact details
            </h3>
            <textarea
              v-model="revealForm.reason"
              rows="3"
              class="w-full rounded-2xl border border-default bg-white px-3 py-2"
              placeholder="Why elevated contact access is needed"
            />
            <UButton color="neutral" variant="soft" :loading="revealing" @click="revealPii">
              Reveal and audit
            </UButton>
          </div>

          <div class="space-y-3">
            <label class="space-y-2 text-sm">
              <span class="text-muted">Adjustment delta</span>
              <input
                v-model.number="trustForm.delta"
                type="number"
                min="-100"
                max="100"
                class="w-full rounded-xl border border-default bg-white px-3 py-2"
              >
            </label>

            <label class="space-y-2 text-sm">
              <span class="text-muted">Reason</span>
              <textarea
                v-model="trustForm.reason"
                rows="4"
                class="w-full rounded-2xl border border-default bg-white px-3 py-2"
                placeholder="Why this manual trust change is needed"
              />
            </label>

            <div class="flex items-center gap-3">
              <UButton color="error" :loading="saving" @click="submitAdjustment">
                Save adjustment
              </UButton>
              <span v-if="message" class="text-sm text-success-600">{{ message }}</span>
              <span v-if="actionError" class="text-sm text-error-600">{{ actionError }}</span>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
              Recent bookings
            </h3>
            <div
              v-for="booking in selectedCustomer?.recent_bookings ?? []"
              :key="booking.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">{{ booking.code }}</p>
                <UBadge :color="statusColor(booking.status)" variant="soft">
                  {{ booking.status }}
                </UBadge>
              </div>
              <p class="mt-2 text-sm text-muted">
                {{ booking.restaurant_name }} · {{ formatDateTime(booking.starts_at) }}
              </p>
            </div>
            <p v-if="!(selectedCustomer?.recent_bookings?.length)" class="text-sm text-muted">
              No recent bookings for this customer.
            </p>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold uppercase tracking-wide text-muted">
              Recent adjustments
            </h3>
            <div
              v-for="adjustment in trustDetail.adjustments"
              :key="adjustment.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <UBadge :color="adjustment.delta >= 0 ? 'success' : 'error'" variant="soft">
                  {{ adjustment.delta >= 0 ? '+' : '' }}{{ adjustment.delta }}
                </UBadge>
                <span class="text-xs text-muted">
                  {{ formatDateTime(adjustment.created_at) }}
                </span>
              </div>
              <p class="mt-2 text-sm text-highlighted">
                {{ adjustment.reason }}
              </p>
              <p class="mt-1 text-xs text-muted">
                By {{ adjustment.actor_email }} · Result {{ adjustment.resulting_score }}
              </p>
            </div>
            <p v-if="!trustDetail.adjustments.length" class="text-sm text-muted">
              No manual adjustments recorded yet.
            </p>
          </div>
        </div>

        <p v-else class="text-sm text-muted">
          Select a customer to inspect trust and adjustment history.
        </p>
      </UCard>
    </div>
  </div>
</template>
