<script setup lang="ts">
import type { OperatorBookingRecord } from '~~/shared/types/domain'
import { useBookings } from '../../../../composables/useBookings'
import { usePartner } from '../../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Partner Waitlist',
  description: 'Operator waitlist board for table-ready, arrival, and seating workflows.',
})

const toast = useToast()
const partner = usePartner()
const bookingsApi = useBookings()
const actionState = reactive({
  busyBookingId: 0,
  busyAction: '',
  error: '',
})
const promotingId = ref(0)

const { data, pending, refresh } = await useAsyncData('partner-waitlist', async () => {
  const [waitlisted, tableReady] = await Promise.all([
    partner.listBookings('waitlisted'),
    partner.listBookings('table_ready'),
  ])

  return [...waitlisted.items, ...tableReady.items].sort((left, right) => {
    const leftQueue = left.waitlist.queue_position ?? Number.MAX_SAFE_INTEGER
    const rightQueue = right.waitlist.queue_position ?? Number.MAX_SAFE_INTEGER
    return leftQueue - rightQueue
  })
})

const queue = computed<OperatorBookingRecord[]>(() => data.value ?? [])

async function runAction(booking: OperatorBookingRecord, action: 'table-ready' | 'arrived' | 'waitlist-seat' | 'no-show') {
  actionState.busyBookingId = booking.id
  actionState.busyAction = action
  actionState.error = ''

  try {
    await partner.transitionBooking(booking.id, action)
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to update the waitlist entry.'
  }
  finally {
    actionState.busyBookingId = 0
    actionState.busyAction = ''
  }
}

async function promoteEntry(booking: OperatorBookingRecord) {
  promotingId.value = booking.id
  actionState.error = ''
  try {
    await bookingsApi.promoteNextWaitlist(booking.id)
    toast.add({
      title: 'Waitlist Promoted',
      description: `${booking.customer.name || `Booking #${booking.id}`} is now confirmed.`,
      color: 'success',
      icon: 'i-lucide-trending-up',
    })
    await refresh()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to promote this waitlist entry.'
  }
  finally {
    promotingId.value = 0
  }
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Waitlist board
            </h2>
            <p class="text-sm text-muted">
              Booking-backed queue management with table-ready, arrival, seating, and no-show actions.
            </p>
          </div>
          <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
            Refresh
          </UButton>
        </div>
      </template>

      <UAlert v-if="actionState.error" color="error" variant="soft" :title="actionState.error" />

      <div v-if="queue.length" class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard v-for="booking in queue" :key="booking.id" variant="subtle">
          <div class="space-y-4">
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium text-highlighted">
                  {{ booking.customer.name }}
                </p>
                <UBadge :color="booking.status === 'table_ready' ? 'primary' : 'warning'" variant="soft">
                  {{ booking.status }}
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ formatDateTime(booking.starts_at) }} • {{ booking.people }} guests
              </p>
              <p class="text-sm text-muted">
                Queue #{{ booking.waitlist.queue_position || 'N/A' }} • {{ booking.waitlist.estimated_wait_minutes || 0 }} min
              </p>
              <p class="text-sm text-muted">
                {{ booking.customer.masked_phone || 'Masked guest phone unavailable' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-if="booking.status === 'waitlisted'"
                color="secondary"
                variant="soft"
                icon="i-lucide-trending-up"
                :loading="promotingId === booking.id"
                @click="promoteEntry(booking)"
              >
                Promote now
              </UButton>
              <UButton
                v-if="booking.status === 'waitlisted'"
                color="primary"
                variant="soft"
                :loading="actionState.busyBookingId === booking.id && actionState.busyAction === 'table-ready'"
                @click="runAction(booking, 'table-ready')"
              >
                Send table-ready
              </UButton>
              <UButton
                v-if="booking.status === 'table_ready'"
                color="neutral"
                variant="soft"
                :loading="actionState.busyBookingId === booking.id && actionState.busyAction === 'arrived'"
                @click="runAction(booking, 'arrived')"
              >
                Mark arrived
              </UButton>
              <UButton
                v-if="booking.status === 'table_ready'"
                color="success"
                variant="soft"
                :loading="actionState.busyBookingId === booking.id && actionState.busyAction === 'waitlist-seat'"
                @click="runAction(booking, 'waitlist-seat')"
              >
                Seat guest
              </UButton>
              <UButton
                color="error"
                variant="soft"
                :loading="actionState.busyBookingId === booking.id && actionState.busyAction === 'no-show'"
                @click="runAction(booking, 'no-show')"
              >
                Mark no-show
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <EmptyState
        v-else
        title="No active waitlist entries"
        description="When reservations are moved to the waitlist, the queue will appear here with table-ready and seating actions."
        icon="i-lucide-list-ordered"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-highlighted">
            Queue guardrails
          </h2>
          <p class="text-sm text-muted">
            These rules keep the waitlist aligned with the documented booking-backed contract.
          </p>
        </div>
      </template>

      <ul class="space-y-3 text-sm text-muted">
        <li>Waitlist entries stay booking-backed, not a separate standalone resource.</li>
        <li>Queue position and estimated wait are shown from the booking payload rather than a frontend-only model.</li>
        <li>Operator actions call the documented booking transition endpoints, so status rules stay server-enforced.</li>
      </ul>
    </UCard>
  </div>
</template>
