<script setup lang="ts">
import type { BookingRecord } from '~~/shared/types/domain'
import { useBookings } from '../../../composables/useBookings'
import { useAuthStore } from '../../../stores/auth'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'My Table Reservations',
  description: 'Manage current reservations, track waitlists, and view booking history.',
})

const toast = useToast()
const bookingsApi = useBookings()
const authStore = useAuthStore()

const filter = ref<'active' | 'confirmed' | 'waitlisted' | 'live' | 'cancelled'>('active')
const actionBusyId = ref<number | null>(null)

const { data: bookings, pending, refresh } = await useAsyncData<BookingRecord[]>(
  'my-bookings-list',
  async () => {
    if (!authStore.isAuthenticated) return []
    if (filter.value === 'live') return bookingsApi.listMyWaitlists()
    return bookingsApi.listMyBookings(filter.value)
  },
)

watch(filter, () => {
  refresh()
})

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { color: 'success' as const, label: 'Confirmed', icon: 'i-lucide-check-circle' }
    case 'waitlisted':
      return { color: 'warning' as const, label: 'Waitlisted', icon: 'i-lucide-clock' }
    case 'table_ready':
      return { color: 'primary' as const, label: 'Table Ready', icon: 'i-lucide-bell' }
    case 'completed':
      return { color: 'neutral' as const, label: 'Completed', icon: 'i-lucide-check' }
    case 'cancelled':
      return { color: 'error' as const, label: 'Cancelled', icon: 'i-lucide-x-circle' }
    default:
      return { color: 'neutral' as const, label: status, icon: 'i-lucide-info' }
  }
}

const cancelBooking = async (id: number) => {
  actionBusyId.value = id
  try {
    await bookingsApi.cancelBooking(id)
    toast.add({
      title: 'Booking Cancelled',
      description: 'Your reservation has been cancelled.',
      color: 'neutral',
      icon: 'i-lucide-info',
    })
    await refresh()
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to cancel booking.'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error',
    })
  }
  finally {
    actionBusyId.value = null
  }
}

const convertWaitlist = async (id: number) => {
  actionBusyId.value = id
  try {
    await bookingsApi.convertWaitlist(id)
    toast.add({
      title: 'Waitlist Converted',
      description: 'Your waitlist spot has been converted to a confirmed table.',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    await refresh()
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to convert waitlist.'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error',
    })
  }
  finally {
    actionBusyId.value = null
  }
}

const promoteMe = async (id: number) => {
  actionBusyId.value = id
  try {
    await bookingsApi.promoteNextWaitlist(id)
    toast.add({
      title: 'Promotion Requested',
      description: 'Your waitlist entry was promoted to a confirmed table.',
      color: 'success',
      icon: 'i-lucide-trending-up',
    })
    await refresh()
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to promote this waitlist entry.'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error',
    })
  }
  finally {
    actionBusyId.value = null
  }
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My Table Reservations
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Track active dining reservations, waitlist positions, and past visits
        </p>
      </div>

      <NuxtLink to="/discover">
        <UButton color="primary" variant="solid" icon="i-lucide-plus" class="font-bold">
          New Reservation
        </UButton>
      </NuxtLink>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
      <button
        v-for="tab in [
          { label: 'Active', value: 'active' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Waitlisted', value: 'waitlisted' },
          { label: 'Live Waitlists', value: 'live' },
          { label: 'Cancelled', value: 'cancelled' }
        ]"
        :key="tab.value"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0"
        :class="filter === tab.value ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white bg-slate-900/60'"
        @click="filter = tab.value as typeof filter"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Auth Guard Alert -->
    <div v-if="!authStore.isAuthenticated" class="glass-card rounded-2xl p-8 text-center space-y-4">
      <UIcon name="i-lucide-lock" class="h-10 w-10 text-amber-400 mx-auto" />
      <h3 class="text-lg font-bold text-white">Sign In to View Reservations</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        Log in with your email to access saved bookings, table codes, and real-time status updates.
      </p>
      <NuxtLink to="/login">
        <UButton color="primary" variant="solid" label="Sign In Now" />
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-else-if="pending" class="space-y-4">
      <div v-for="i in 3" :key="i" class="glass-card rounded-2xl p-6 h-32 animate-pulse" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!bookings || bookings.length === 0" class="glass-card rounded-2xl p-12 text-center space-y-3 border border-white/10">
      <UIcon name="i-lucide-calendar-x" class="h-12 w-12 text-slate-500 mx-auto" />
      <h3 class="text-lg font-bold text-white">No {{ filter }} reservations found</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        You don't have any {{ filter }} reservations at the moment. Browse top restaurants and book your table now.
      </p>
    </div>

    <!-- Bookings Cards List -->
    <div v-else class="space-y-4">
      <div
        v-for="b in bookings"
        :key="b.id"
        class="glass-card rounded-2xl p-6 border border-white/10 hover:border-amber-500/30 transition-all space-y-4"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-bold text-white">
                {{ b.restaurant.name }}
              </h3>
              <UBadge
                :color="getStatusBadge(b.status).color"
                variant="soft"
                class="flex items-center gap-1 font-mono text-xs"
              >
                <UIcon :name="getStatusBadge(b.status).icon" class="h-3.5 w-3.5" />
                {{ getStatusBadge(b.status).label }}
              </UBadge>
            </div>
            <p class="text-xs text-slate-400 flex items-center gap-2">
              <span class="font-mono text-amber-400 font-bold">Code: {{ b.code }}</span>
              <span>•</span>
              <span>{{ b.restaurant.city || 'Karachi' }}</span>
            </p>
          </div>

          <!-- Time & Party -->
          <div class="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <div class="text-right">
              <p class="text-xs text-slate-400 font-mono">Date & Time</p>
              <p class="text-xs font-bold text-white font-mono">
                {{ new Date(b.starts_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
            <div class="h-8 w-px bg-white/10" />
            <div>
              <p class="text-xs text-slate-400 font-mono">Party Size</p>
              <p class="text-xs font-bold text-amber-400 font-mono">
                {{ b.people }} {{ b.people === 1 ? 'Guest' : 'Guests' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Special Request / Waitlist Details -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div>
            <span v-if="b.dining_area" class="text-slate-300">Section: <strong class="text-white">{{ b.dining_area }}</strong></span>
            <span v-if="b.special_request" class="ml-3 italic">"{{ b.special_request }}"</span>
          </div>

          <div v-if="b.waitlist?.queue_position" class="font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Waitlist Position: #{{ b.waitlist.queue_position }}
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <UButton
            v-if="b.status === 'waitlisted'"
            color="secondary"
            variant="soft"
            size="sm"
            :loading="actionBusyId === b.id"
            icon="i-lucide-trending-up"
            @click="promoteMe(b.id)"
          >
            Promote Me
          </UButton>

          <UButton
            v-if="b.status === 'waitlisted' || b.status === 'table_ready'"
            color="primary"
            variant="solid"
            size="sm"
            :loading="actionBusyId === b.id"
            icon="i-lucide-check-circle"
            @click="convertWaitlist(b.id)"
          >
            Convert to Table
          </UButton>

          <UButton
            v-if="b.status !== 'cancelled' && b.status !== 'completed'"
            color="error"
            variant="soft"
            size="sm"
            :loading="actionBusyId === b.id"
            icon="i-lucide-x-circle"
            @click="cancelBooking(b.id)"
          >
            Cancel Booking
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
