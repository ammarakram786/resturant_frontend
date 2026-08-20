<script setup lang="ts">
import { useAdmin } from '~~/app/composables/useAdmin'
import { useAdminFormat } from '~~/app/composables/useAdminFormat'
import type { AdminRestaurantDetail } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Restaurant Review',
  description: 'Restaurant detail, KYC control, billing visibility, and chain or offer oversight.',
})

const route = useRoute()
const admin = useAdmin()
const { formatCurrency, formatDate, formatDateTime, statusColor } = useAdminFormat()

const restaurantId = computed(() => Number(route.params.id))
const reviewForm = reactive({
  kyc_status: '',
  lifecycle_status: '',
  note: '',
})
const reviewPending = ref(false)
const reviewMessage = ref('')
const reviewError = ref('')

const { data, pending, error, refresh } = await useAsyncData<AdminRestaurantDetail>(
  () => `admin-restaurant-${restaurantId.value}`,
  () => admin.getRestaurant(restaurantId.value),
)

watchEffect(() => {
  if (!data.value) {
    return
  }

  reviewForm.kyc_status = data.value.kyc.status
  reviewForm.lifecycle_status = data.value.status
  reviewForm.note = data.value.kyc.note ?? ''
})

const submitReview = async () => {
  reviewPending.value = true
  reviewError.value = ''
  reviewMessage.value = ''

  try {
    await admin.reviewRestaurant(restaurantId.value, {
      kyc_status: reviewForm.kyc_status,
      lifecycle_status: reviewForm.lifecycle_status,
      note: reviewForm.note,
    })
    reviewMessage.value = 'Restaurant review updated.'
    await refresh()
  }
  catch (caught) {
    reviewError.value = caught instanceof Error ? caught.message : 'Unable to update the restaurant review.'
  }
  finally {
    reviewPending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UButton to="/admin/restaurants" color="neutral" variant="ghost" icon="i-lucide-arrow-left">
      Back to restaurants
    </UButton>

    <EmptyState
      v-if="error"
      title="Restaurant detail unavailable"
      :description="error.message"
      icon="i-lucide-store"
    >
      <UButton color="error" variant="soft" @click="refresh()">
        Retry
      </UButton>
    </EmptyState>

    <template v-else-if="data">
      <section class="surface-grid">
        <UCard>
          <template #header>
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl font-semibold text-highlighted">
                  {{ data.name }}
                </h1>
                <UBadge :color="statusColor(data.status)" variant="soft">
                  {{ data.status }}
                </UBadge>
                <UBadge :color="statusColor(data.kyc.status)" variant="subtle">
                  KYC {{ data.kyc.status }}
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ data.city || 'No city' }}<span v-if="data.cuisine"> · {{ data.cuisine }}</span><span v-if="data.price_range"> · {{ data.price_range }}</span>
              </p>
            </div>
          </template>

          <div class="space-y-3 text-sm text-muted">
            <p>
              {{ data.description || 'No restaurant description yet.' }}
            </p>
            <p>
              Supports private events: <strong class="text-highlighted">{{ data.supports_private_events ? 'Yes' : 'No' }}</strong>
            </p>
            <p>
              KYC documents on file: <strong class="text-highlighted">{{ data.kyc.documents_count }}</strong>
            </p>
            <p>
              Last review: <strong class="text-highlighted">{{ formatDateTime(data.kyc.reviewed_at) }}</strong>
              <span v-if="data.kyc.reviewed_by"> by {{ data.kyc.reviewed_by }}</span>
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-base font-semibold text-highlighted">
                KYC and lifecycle controls
              </h2>
              <p class="text-sm text-muted">
                Review changes are audited server-side and keep KYC separate from venue lifecycle.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="space-y-2 text-sm">
                <span class="text-muted">KYC status</span>
                <select v-model="reviewForm.kyc_status" class="w-full rounded-xl border border-default bg-white px-3 py-2">
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>

              <label class="space-y-2 text-sm">
                <span class="text-muted">Lifecycle status</span>
                <select v-model="reviewForm.lifecycle_status" class="w-full rounded-xl border border-default bg-white px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending approval</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>

            <label class="space-y-2 text-sm">
              <span class="text-muted">Review note</span>
              <textarea
                v-model="reviewForm.note"
                rows="4"
                class="w-full rounded-2xl border border-default bg-white px-3 py-2"
                placeholder="Why this KYC or lifecycle decision was made"
              />
            </label>

            <div class="flex items-center gap-3">
              <UButton color="error" :loading="reviewPending" @click="submitReview">
                Save review
              </UButton>
              <span v-if="reviewMessage" class="text-sm text-success-600">{{ reviewMessage }}</span>
              <span v-if="reviewError" class="text-sm text-error-600">{{ reviewError }}</span>
            </div>
          </div>
        </UCard>
      </section>

      <UCard v-if="data.weekly_statements.length">
        <template #header>
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-highlighted">
              Weekly statements
            </h2>
            <p class="text-sm text-muted">
              Statement totals provide reporting depth beyond raw invoice rows.
            </p>
          </div>
        </template>

        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="statement in data.weekly_statements"
            :key="statement.id"
            class="rounded-2xl border border-default px-4 py-3"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium text-highlighted">
                {{ formatDate(statement.week_start) }} to {{ formatDate(statement.week_end) }}
              </p>
              <UBadge color="neutral" variant="soft">Statement</UBadge>
            </div>
            <pre class="mt-3 overflow-x-auto rounded-xl bg-gray-950 px-3 py-3 text-xs text-white">{{ JSON.stringify(statement.totals, null, 2) }}</pre>
          </div>
        </div>
      </UCard>

      <section class="surface-grid">
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Chain oversight
            </h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="group in data.groups"
              :key="group.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">
                  {{ group.name }}
                </p>
                <UBadge :color="group.is_primary ? 'success' : 'neutral'" variant="soft">
                  {{ group.is_primary ? 'Primary' : group.role }}
                </UBadge>
              </div>
            </div>
            <p v-if="!data.groups.length" class="text-sm text-muted">
              This restaurant is currently independent.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Offer oversight
            </h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="rule in data.offer_rules"
              :key="rule.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">
                    {{ rule.title }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ rule.offer_type }} · {{ formatDateTime(rule.created_at) }}
                  </p>
                </div>
                <UBadge :color="statusColor(rule.status)" variant="soft">
                  {{ rule.status }}
                </UBadge>
              </div>
            </div>
            <p v-if="!data.offer_rules.length" class="text-sm text-muted">
              No offer rules are configured for this restaurant yet.
            </p>
          </div>
        </UCard>
      </section>

      <section class="surface-grid">
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Billing visibility
            </h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="invoice in data.invoices"
              :key="invoice.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">
                    {{ invoice.invoice_number }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ formatDate(invoice.billing_period_start) }} to {{ formatDate(invoice.billing_period_end) }}
                  </p>
                </div>
                <UBadge :color="statusColor(invoice.status)" variant="soft">
                  {{ invoice.status }}
                </UBadge>
              </div>
              <p class="mt-3 text-sm text-muted">
                Subtotal {{ formatCurrency(invoice.subtotal) }} · Adjustments {{ formatCurrency(invoice.adjustments) }} · Total {{ formatCurrency(invoice.total) }}
              </p>
            </div>
            <p v-if="!data.invoices.length" class="text-sm text-muted">
              No invoices exist for this restaurant yet.
            </p>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Analytics and alerts
            </h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="snapshot in data.analytics_snapshots"
              :key="snapshot.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">
                  {{ snapshot.period }} snapshot
                </p>
                <span class="text-sm text-muted">
                  {{ formatDate(snapshot.snapshot_date) }}
                </span>
              </div>
              <pre class="mt-3 overflow-x-auto rounded-xl bg-gray-950 px-3 py-3 text-xs text-white">{{ JSON.stringify(snapshot.metrics, null, 2) }}</pre>
            </div>

            <div
              v-for="alert in data.alerts"
              :key="`alert-${alert.id}`"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">
                  {{ alert.title }}
                </p>
                <UBadge :color="statusColor(alert.severity)" variant="soft">
                  {{ alert.severity }}
                </UBadge>
              </div>
              <p class="mt-2 text-sm text-muted">
                {{ alert.kind }} · {{ alert.status }} · {{ formatDateTime(alert.created_at) }}
              </p>
            </div>
          </div>
        </UCard>
      </section>
    </template>

    <EmptyState
      v-else-if="pending"
      title="Loading restaurant"
      description="Pulling the admin oversight record."
      icon="i-lucide-loader"
    />
  </div>
</template>
