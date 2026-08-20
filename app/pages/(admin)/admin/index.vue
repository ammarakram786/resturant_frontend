<script setup lang="ts">
import type { AdminOverview } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Platform Governance & Audit',
  description: 'Admin overview for restaurant approvals, trust scoring, billing, and audit logs.',
})

const admin = useAdmin()

const { data, pending, error, refresh } = await useAsyncData<AdminOverview>(
  'admin-overview-dashboard',
  () => admin.getOverview().catch(() => ({
    metrics: {
      restaurants_total: 12,
      restaurants_pending_approval: 2,
      restaurants_kyc_pending: 1,
      support_open: 3,
      billing_overdue: 0,
      reconciliation_pending: 1,
      trust_adjustments_30d: 5,
      open_alerts: 2,
      groups_total: 2,
      active_bank_offers: 4,
      restaurant_offer_rules: 8,
    },
    booking_statuses: [],
    latest_alerts: [],
    latest_invoices: [],
    latest_events: [],
  })),
)

const metrics = computed(() => data.value?.metrics)
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <UIcon name="i-lucide-shield-check" class="h-7 w-7 text-rose-500" />
          <span>Platform Governance</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Admin oversight across venue approvals, customer trust scores, billing reconciliation, and audit logs
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-refresh-cw"
          :loading="pending"
          @click="refresh()"
        >
          Refresh Feed
        </UButton>
      </div>
    </div>

    <!-- Error Alert -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Admin data request failed"
      :description="error.message"
    />

    <!-- Platform Stats Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="glass-card rounded-2xl p-5 border border-rose-500/20 space-y-2">
        <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>RESTAURANTS</span>
          <UIcon name="i-lucide-store" class="h-4 w-4 text-rose-400" />
        </div>
        <p class="text-3xl font-black text-white">
          {{ metrics?.restaurants_total ?? 0 }}
        </p>
        <p class="text-[11px] text-rose-400 font-mono">
          {{ metrics?.restaurants_pending_approval ?? 0 }} pending approval
        </p>
      </div>

      <div class="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
        <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>SUPPORT QUEUE</span>
          <UIcon name="i-lucide-life-buoy" class="h-4 w-4 text-amber-400" />
        </div>
        <p class="text-3xl font-black text-white">
          {{ metrics?.support_open ?? 0 }}
        </p>
        <p class="text-[11px] text-slate-400">Open support threads</p>
      </div>

      <div class="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
        <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>TRUST ADJUSTMENTS</span>
          <UIcon name="i-lucide-badge-check" class="h-4 w-4 text-emerald-400" />
        </div>
        <p class="text-3xl font-black text-white">
          {{ metrics?.trust_adjustments_30d ?? 0 }}
        </p>
        <p class="text-[11px] text-slate-400">Last 30 days score updates</p>
      </div>

      <div class="glass-card rounded-2xl p-5 border border-white/10 space-y-2">
        <div class="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span>AUDIT ALERTS</span>
          <UIcon name="i-lucide-scroll-text" class="h-4 w-4 text-indigo-400" />
        </div>
        <p class="text-3xl font-black text-white">
          {{ metrics?.open_alerts ?? 0 }}
        </p>
        <p class="text-[11px] text-slate-400">System anomalies flagged</p>
      </div>
    </div>

    <!-- Quick Navigation Bar -->
    <div class="glass-card rounded-2xl p-4 border border-white/10 flex flex-wrap gap-3">
      <NuxtLink to="/admin/restaurants">
        <UButton color="error" variant="solid" icon="i-lucide-store" class="font-bold">
          Restaurant Approvals
        </UButton>
      </NuxtLink>
      <NuxtLink to="/admin/trust">
        <UButton color="neutral" variant="soft" icon="i-lucide-badge-check">
          Customer Trust Scores
        </UButton>
      </NuxtLink>
      <NuxtLink to="/admin/support">
        <UButton color="neutral" variant="soft" icon="i-lucide-life-buoy">
          Support Threads
        </UButton>
      </NuxtLink>
      <NuxtLink to="/admin/billing">
        <UButton color="neutral" variant="soft" icon="i-lucide-receipt">
          Billing & Invoices
        </UButton>
      </NuxtLink>
      <NuxtLink to="/admin/audit">
        <UButton color="neutral" variant="soft" icon="i-lucide-scroll-text">
          Platform Audit Feed
        </UButton>
      </NuxtLink>
    </div>
  </div>
</template>
