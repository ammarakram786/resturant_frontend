<script setup lang="ts">
import type { OperatorBookingRecord, RestaurantAnalyticsOverview } from '~~/shared/types/domain'
import { usePartner } from '../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Operator Dashboard',
  description: 'Manage live booking queue, guest seating, alerts, and venue metrics.',
})

const partner = usePartner()

const { data: overview, pending, refresh, error } = await useAsyncData('partner-dashboard-overview', async () => {
  const [analytics, bookings, threads, notifications, pickupOrders, privateEvents, guests] = await Promise.all([
    partner.getAnalyticsOverview().catch(() => null),
    partner.listBookings().catch(() => ({ items: [] })),
    partner.listThreads('open').catch(() => ({ items: [] })),
    partner.listNotifications().catch(() => ({ items: [] })),
    partner.listPickupOrders().catch(() => ({ items: [] })),
    partner.listPrivateEvents().catch(() => []),
    partner.listGuests().catch(() => []),
  ])

  return {
    analytics,
    bookings: bookings.items || [],
    threads: threads.items || [],
    notifications: notifications.items || [],
    pickupOrders: pickupOrders.items || [],
    privateEvents: privateEvents || [],
    guests: guests || [],
  }
})

const analytics = computed<RestaurantAnalyticsOverview | null>(() => overview.value?.analytics ?? null)
const bookings = computed<OperatorBookingRecord[]>(() => overview.value?.bookings ?? [])
const threads = computed(() => overview.value?.threads ?? [])
const notifications = computed(() => overview.value?.notifications ?? [])

const liveQueue = computed(() => bookings.value.slice(0, 6))

const kpiCards = computed(() => [
  {
    label: 'Total Bookings',
    value: analytics.value?.bookings_total ?? bookings.value.length,
    hint: 'Live reservations in service pipeline',
    icon: 'i-lucide-calendar-range',
    color: 'amber',
  },
  {
    label: 'Pending Modifications',
    value: analytics.value?.pending_modifications ?? 0,
    hint: 'Guest change requests pending review',
    icon: 'i-lucide-clock',
    color: 'rose',
  },
  {
    label: 'Open Messaging Threads',
    value: threads.value.length,
    hint: 'Unread guest inquiries',
    icon: 'i-lucide-messages-square',
    color: 'indigo',
  },
  {
    label: 'System Alerts',
    value: notifications.value.filter((n) => !n.is_read).length,
    hint: 'Actionable operational alerts',
    icon: 'i-lucide-bell-ring',
    color: 'emerald',
  },
])
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Operator Command Center</span>
          <UBadge color="warning" variant="soft" class="font-mono text-xs">Live</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Real-time table reservations, guest arrivals, waitlists, and POS integration
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
        <NuxtLink to="/partner/bookings">
          <UButton color="warning" variant="solid" size="sm" icon="i-lucide-table-properties" class="font-bold text-slate-950">
            Open Data Grid
          </UButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Error Alert -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Unable to load dashboard data"
      :description="error.message"
    />

    <!-- KPI Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="glass-card rounded-2xl p-5 border border-white/10 flex items-start justify-between group hover:border-amber-500/30 transition-all"
      >
        <div class="space-y-1">
          <p class="text-xs uppercase font-mono tracking-wider text-slate-400">
            {{ kpi.label }}
          </p>
          <p class="text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
            {{ kpi.value }}
          </p>
          <p class="text-[11px] text-slate-400">
            {{ kpi.hint }}
          </p>
        </div>
        <div class="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-amber-400">
          <UIcon :name="kpi.icon" class="h-6 w-6" />
        </div>
      </div>
    </div>

    <!-- 2 Column Layout: Live Queue & Operations -->
    <div class="grid gap-8 lg:grid-cols-12">
      <!-- Live Queue (7 Cols) -->
      <div class="lg:col-span-7 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <UIcon name="i-lucide-list-ordered" class="h-5 w-5 text-amber-400" />
            Today's Booking Queue
          </h2>
          <NuxtLink to="/partner/bookings" class="text-xs text-amber-400 font-semibold hover:underline">
            View All →
          </NuxtLink>
        </div>

        <div v-if="liveQueue.length" class="space-y-3">
          <div
            v-for="b in liveQueue"
            :key="b.id"
            class="glass-card rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-base">{{ b.customer?.name || 'Guest' }}</span>
                <UBadge
                  :color="b.status === 'confirmed' ? 'success' : b.status === 'waitlisted' ? 'warning' : 'neutral'"
                  variant="soft"
                  size="sm"
                >
                  {{ b.status }}
                </UBadge>
              </div>
              <p class="text-xs text-slate-400 font-mono">
                Code: <strong class="text-amber-400">{{ b.code }}</strong> • {{ b.people }} guests • {{ b.dining_area || 'Main Dining' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <NuxtLink to="/partner/bookings">
                <UButton color="neutral" variant="soft" size="xs" icon="i-lucide-external-link">
                  Manage
                </UButton>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-else class="glass-card rounded-2xl p-8 text-center space-y-2 border border-white/10">
          <UIcon name="i-lucide-calendar-check" class="h-8 w-8 text-slate-500 mx-auto" />
          <p class="text-sm font-bold text-white">No active queue items</p>
          <p class="text-xs text-slate-400">Bookings for today will appear here as guests arrive or make reservations.</p>
        </div>
      </div>

      <!-- Quick Operations Shortcuts (5 Cols) -->
      <div class="lg:col-span-5 space-y-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <UIcon name="i-lucide-sliders" class="h-5 w-5 text-amber-400" />
          Operator Workspace
        </h2>

        <div class="glass-card rounded-2xl p-5 space-y-3 border border-white/10">
          <NuxtLink to="/partner/bookings" class="block">
            <div class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-table-properties" class="h-5 w-5 text-amber-400" />
                <div>
                  <p class="text-sm font-bold text-white group-hover:text-amber-400">Reservation Data Grid</p>
                  <p class="text-xs text-slate-400">Filter, search, approve modifications</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-slate-500 group-hover:text-amber-400" />
            </div>
          </NuxtLink>

          <NuxtLink to="/partner/waitlist" class="block">
            <div class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-list-ordered" class="h-5 w-5 text-amber-400" />
                <div>
                  <p class="text-sm font-bold text-white group-hover:text-amber-400">Live Waitlist Manager</p>
                  <p class="text-xs text-slate-400">Notify guests & seat ready tables</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-slate-500 group-hover:text-amber-400" />
            </div>
          </NuxtLink>

          <NuxtLink to="/partner/messages" class="block">
            <div class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-messages-square" class="h-5 w-5 text-amber-400" />
                <div>
                  <p class="text-sm font-bold text-white group-hover:text-amber-400">Guest Messaging</p>
                  <p class="text-xs text-slate-400">Direct inquiries & support threads</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-slate-500 group-hover:text-amber-400" />
            </div>
          </NuxtLink>

          <NuxtLink to="/partner/operations" class="block">
            <div class="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-store" class="h-5 w-5 text-amber-400" />
                <div>
                  <p class="text-sm font-bold text-white group-hover:text-amber-400">Venue & POS Settings</p>
                  <p class="text-xs text-slate-400">Floor sections, seating capacity & POS connection</p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-slate-500 group-hover:text-amber-400" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
