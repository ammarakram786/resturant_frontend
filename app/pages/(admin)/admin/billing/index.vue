<script setup lang="ts">
import { useAdmin } from '~~/app/composables/useAdmin'
import { useAdminFormat } from '~~/app/composables/useAdminFormat'
import type { AdminBillingOverview } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Admin Billing',
  description: 'Billing, statements, reconciliation backlog, and invoice visibility.',
})

const admin = useAdmin()
const { formatCurrency, formatDate, statusColor } = useAdminFormat()

const search = ref('')
const status = ref('')

const { data, pending, error, refresh } = await useAsyncData<AdminBillingOverview>(
  'admin-billing',
  () => admin.getBilling({ q: search.value || undefined, status: status.value || undefined }),
  { watch: [search, status] },
)
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-highlighted">
            Billing visibility
          </h2>
          <p class="text-sm text-muted">
            Track invoice status, reconciliation backlog, and weekly statement coverage without leaving the admin shell.
          </p>
        </div>
      </template>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        <input
          v-model="search"
          type="text"
          placeholder="Search by invoice or restaurant"
          class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm"
        >
        <select v-model="status" class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm">
          <option value="">
            All statuses
          </option>
          <option value="draft">
            Draft
          </option>
          <option value="issued">
            Issued
          </option>
          <option value="paid">
            Paid
          </option>
          <option value="overdue">
            Overdue
          </option>
        </select>
      </div>
    </UCard>

    <EmptyState
      v-if="error"
      title="Billing unavailable"
      :description="error.message"
      icon="i-lucide-receipt"
    >
      <UButton color="error" variant="soft" @click="refresh()">
        Retry
      </UButton>
    </EmptyState>

    <template v-else-if="data">
      <section class="surface-grid">
        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Summary
            </h2>
          </template>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-default px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-muted">
                Invoice count
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ pending ? '...' : data.summary.invoice_count }}
              </p>
            </div>
            <div class="rounded-2xl border border-default px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-muted">
                Overdue
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ pending ? '...' : data.summary.overdue_count }}
              </p>
            </div>
            <div class="rounded-2xl border border-default px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-muted">
                Reconciliation pending
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ pending ? '...' : data.summary.reconciliation_pending }}
              </p>
            </div>
            <div class="rounded-2xl border border-default px-4 py-3">
              <p class="text-xs uppercase tracking-wide text-muted">
                Total amount
              </p>
              <p class="mt-2 text-2xl font-semibold text-highlighted">
                {{ formatCurrency(data.summary.total_amount) }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-base font-semibold text-highlighted">
              Status mix
            </h2>
          </template>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between rounded-2xl border border-default px-4 py-3">
              <span class="text-muted">Issued</span>
              <span class="font-medium text-highlighted">{{ data.summary.issued_count }}</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-default px-4 py-3">
              <span class="text-muted">Paid</span>
              <span class="font-medium text-highlighted">{{ data.summary.paid_count }}</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-default px-4 py-3">
              <span class="text-muted">Weekly statements</span>
              <span class="font-medium text-highlighted">{{ data.summary.statement_count }}</span>
            </div>
          </div>
        </UCard>
      </section>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-highlighted">
              Invoice queue
            </h2>
            <span class="text-sm text-muted">
              {{ data.invoices.length }} invoices
            </span>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="invoice in data.invoices"
            :key="invoice.id"
            class="rounded-2xl border border-default px-4 py-4"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-semibold text-highlighted">
                    {{ invoice.invoice_number }}
                  </h3>
                  <UBadge :color="statusColor(invoice.status)" variant="soft">
                    {{ invoice.status }}
                  </UBadge>
                </div>
                <p class="text-sm text-muted">
                  {{ invoice.restaurant_name }} · {{ formatDate(invoice.billing_period_start) }} to {{ formatDate(invoice.billing_period_end) }}
                </p>
              </div>

              <div class="space-y-2 text-sm text-muted lg:text-right">
                <p>Total {{ formatCurrency(invoice.total) }}</p>
                <p>Adjustments {{ formatCurrency(invoice.adjustments) }}</p>
                <p>{{ invoice.reconciliations_count }} reconciliations</p>
              </div>
            </div>
          </div>

          <p v-if="!data.invoices.length" class="text-sm text-muted">
            No invoices matched the current filters.
          </p>
        </div>
      </UCard>
    </template>
  </div>
</template>
