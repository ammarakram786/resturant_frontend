<script setup lang="ts">
import type { BookingAttendanceStatus, BookingRecord, BookingStatus } from '~~/shared/types/domain'
import { useBookings } from '../../../composables/useBookings'
import { useCustomerSession } from '../../../composables/useCustomerSession'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

const route = useRoute()
const bookingsApi = useBookings()
const { data: profile } = await useCustomerSession(`booking-session-${route.params.id}`)

const editForm = reactive({
  date: '',
  time: '',
  people: 2,
  dining_area: '',
  occasion: '',
  occasion_note: '',
  special_request: '',
})
const reviewForm = reactive({
  rating: 5,
  comment: '',
})
const inviteForm = reactive({
  mode: 'contact' as 'contact' | 'user',
  full_name: '',
  email: '',
  phone: '',
  message: '',
  user_id: '' as string | number,
})
const state = reactive({
  savingEdit: false,
  savingReview: false,
  sendingInvite: false,
  transitioning: false,
  markingAttendance: false,
  error: '',
  success: '',
})

const { data: booking, refresh } = await useAsyncData<BookingRecord | null>(`booking-${route.params.id}`, async () => {
  if (!profile.value) {
    return null
  }

  const record = await bookingsApi.getBooking(String(route.params.id))
  editForm.date = record.starts_at.slice(0, 10)
  editForm.time = new Date(record.starts_at).toISOString().slice(11, 16)
  editForm.people = record.people
  editForm.dining_area = record.dining_area ?? ''
  editForm.occasion = record.occasion ?? ''
  editForm.occasion_note = record.occasion_note ?? ''
  editForm.special_request = record.special_request ?? ''
  return record
})

const bookingDetail = computed(() => booking.value)
const canReview = computed(() => bookingDetail.value?.status === 'completed' && !bookingDetail.value.reviewed_at)
const canEdit = computed(() => {
  const status = bookingDetail.value?.status
  return status === 'pending' || status === 'confirmed' || status === 'waitlisted' || status === 'table_ready'
})
const canInvite = computed(() => {
  const status = bookingDetail.value?.status
  return status === 'pending' || status === 'confirmed'
})

const customerTransitions = computed<Array<{ label: string, status: BookingStatus }>>(() => {
  const status = bookingDetail.value?.status
  if (!status) return []
  if (status === 'pending') {
    return [{ label: 'Confirm booking', status: 'confirmed' }]
  }
  return []
})

const attendanceOptions = computed<Array<{ label: string, value: BookingAttendanceStatus }>>(() => {
  const status = bookingDetail.value?.status
  if (status === 'arrived') {
    return [
      { label: 'Mark seated', value: 'seated' },
      { label: 'Mark no-show', value: 'no_show' },
    ]
  }
  if (status === 'seated') {
    return [{ label: 'Mark completed', value: 'completed' }]
  }
  return []
})

useSeoMeta({
  title: computed(() => bookingDetail.value ? `${bookingDetail.value.restaurant.name} booking` : 'Booking detail'),
})

async function saveEdits() {
  if (!bookingDetail.value) {
    return
  }

  state.error = ''
  state.success = ''
  state.savingEdit = true
  try {
    await bookingsApi.updateBooking(bookingDetail.value.id, editForm)
    state.success = 'Booking update submitted.'
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to update the booking.'
  }
  finally {
    state.savingEdit = false
  }
}

async function submitReview() {
  if (!bookingDetail.value) {
    return
  }

  state.error = ''
  state.success = ''
  state.savingReview = true
  try {
    await bookingsApi.submitReview(bookingDetail.value.id, reviewForm)
    state.success = 'Review submitted successfully.'
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to submit the review.'
  }
  finally {
    state.savingReview = false
  }
}

async function runTransition(status: BookingStatus) {
  if (!bookingDetail.value) {
    return
  }

  state.error = ''
  state.success = ''
  state.transitioning = true
  try {
    await bookingsApi.transitionBooking(bookingDetail.value.id, status)
    state.success = `Booking moved to ${status}.`
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to update this booking.'
  }
  finally {
    state.transitioning = false
  }
}

async function recordAttendance(value: BookingAttendanceStatus) {
  if (!bookingDetail.value) {
    return
  }

  state.error = ''
  state.success = ''
  state.markingAttendance = true
  try {
    await bookingsApi.markAttendance(bookingDetail.value.id, value)
    state.success = `Attendance updated to ${value.replace('_', ' ')}.`
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to record attendance.'
  }
  finally {
    state.markingAttendance = false
  }
}

async function sendInvite() {
  if (!bookingDetail.value) {
    return
  }

  state.error = ''
  state.success = ''
  if (inviteForm.mode === 'contact' && !inviteForm.email && !inviteForm.phone) {
    state.error = 'Provide an email or phone number for the invite.'
    return
  }
  if (inviteForm.mode === 'user' && !inviteForm.user_id) {
    state.error = 'Provide the guest user id for the invite.'
    return
  }

  state.sendingInvite = true
  try {
    const result = inviteForm.mode === 'user'
      ? await bookingsApi.inviteGuest(bookingDetail.value.id, {
          user_id: Number(inviteForm.user_id),
          full_name: inviteForm.full_name,
          message: inviteForm.message,
        })
      : await bookingsApi.inviteGuestByContact(bookingDetail.value.id, {
          full_name: inviteForm.full_name,
          email: inviteForm.email,
          phone: inviteForm.phone,
          message: inviteForm.message,
        })

    state.success = result.matched_customer
      ? `Invite delivered to ${result.recipient.full_name || result.recipient.email || result.recipient.phone || 'your guest'}.`
      : 'Invite recorded — they will be notified once they join the platform.'
    Object.assign(inviteForm, { full_name: '', email: '', phone: '', message: '', user_id: '' })
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to send the invite.'
  }
  finally {
    state.sendingInvite = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UButton to="/bookings" color="neutral" variant="ghost" icon="i-lucide-arrow-left">
      Back to bookings
    </UButton>

    <UAlert
      v-if="!profile"
      color="warning"
      variant="soft"
      title="Sign in required"
      description="Authenticate from Discover before opening booking details."
    />

    <div v-else-if="bookingDetail" class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-semibold text-highlighted">{{ bookingDetail.restaurant.name }}</h1>
              <UBadge variant="soft">{{ bookingDetail.status }}</UBadge>
            </div>
            <p class="text-sm text-muted">
              Reservation code {{ bookingDetail.code }} for {{ bookingDetail.people }} guests.
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UCard variant="subtle">
            <p class="text-sm text-muted">Starts at</p>
            <p class="mt-1 font-medium text-highlighted">{{ new Date(bookingDetail.starts_at).toLocaleString() }}</p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-sm text-muted">Ends at</p>
            <p class="mt-1 font-medium text-highlighted">{{ new Date(bookingDetail.ends_at).toLocaleString() }}</p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-sm text-muted">Waitlist</p>
            <p class="mt-1 font-medium text-highlighted">
              {{ bookingDetail.waitlist.enabled ? `Queue #${bookingDetail.waitlist.queue_position ?? 'TBD'}` : 'Not waitlisted' }}
            </p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-sm text-muted">Review state</p>
            <p class="mt-1 font-medium text-highlighted">{{ bookingDetail.reviewed_at ? 'Reviewed' : 'Pending' }}</p>
          </UCard>
        </div>

        <div class="mt-4 space-y-2 text-sm text-muted">
          <p><span class="font-medium text-highlighted">Dining area:</span> {{ bookingDetail.dining_area || 'Not specified' }}</p>
          <p><span class="font-medium text-highlighted">Occasion:</span> {{ bookingDetail.occasion || 'Not specified' }}</p>
          <p><span class="font-medium text-highlighted">Special request:</span> {{ bookingDetail.special_request || 'None' }}</p>
        </div>
      </UCard>

      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-highlighted">Edit booking</h2>
              <p class="text-sm text-muted">
                Customer edits map to `PATCH /bookings/{id}` and may transition the booking to `modification_pending`.
              </p>
            </div>
          </template>

          <div v-if="canEdit" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <UInput v-model="editForm.date" type="date" />
              <UInput v-model="editForm.time" type="time" />
              <UInput v-model="editForm.people" type="number" min="1" max="99" />
              <UInput v-model="editForm.dining_area" placeholder="Dining area" />
            </div>
            <UInput v-model="editForm.occasion" placeholder="Occasion" />
            <UInput v-model="editForm.occasion_note" placeholder="Occasion note" />
            <UTextarea v-model="editForm.special_request" placeholder="Special request" />
            <UButton :loading="state.savingEdit" icon="i-lucide-save" @click="saveEdits">
              Save changes
            </UButton>
          </div>
          <EmptyState
            v-else
            title="Booking edits unavailable"
            description="Completed, cancelled, and no-show bookings cannot be changed from the customer surface."
            icon="i-lucide-pencil-off"
          />
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-highlighted">Leave a review</h2>
              <p class="text-sm text-muted">
                Review submission is enabled for completed bookings that have not been reviewed yet.
              </p>
            </div>
          </template>

          <div v-if="canReview" class="space-y-4">
            <USelect
              v-model="reviewForm.rating"
              :items="[1, 2, 3, 4, 5].map((value) => ({ label: `${value} star${value === 1 ? '' : 's'}`, value }))"
              value-key="value"
              class="w-full"
            />
            <UTextarea v-model="reviewForm.comment" placeholder="Tell the restaurant about the experience" />
            <UButton :loading="state.savingReview" icon="i-lucide-star" @click="submitReview">
              Submit review
            </UButton>
          </div>
          <EmptyState
            v-else
            title="Review not available"
            :description="bookingDetail.reviewed_at ? 'This booking already has a submitted review.' : 'Reviews open after the booking is completed.'"
            icon="i-lucide-message-square-off"
          />
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-highlighted">Invite guests</h2>
              <p class="text-sm text-muted">
                Share this reservation with co-diners by platform user id or contact details.
              </p>
            </div>
          </template>

          <div v-if="canInvite" class="space-y-4">
            <URadioGroup
              v-model="inviteForm.mode"
              variant="card"
              :items="[
                { label: 'By contact details', value: 'contact' },
                { label: 'By platform user id', value: 'user' },
              ]"
              value-key="value"
            />

            <div v-if="inviteForm.mode === 'user'" class="grid gap-4 md:grid-cols-2">
              <UInput v-model="inviteForm.user_id" type="number" min="1" placeholder="Guest user id" />
              <UInput v-model="inviteForm.full_name" placeholder="Guest name (optional)" />
            </div>
            <div v-else class="grid gap-4 md:grid-cols-2">
              <UInput v-model="inviteForm.full_name" placeholder="Guest name (optional)" />
              <UInput v-model="inviteForm.email" type="email" placeholder="Email address" />
            </div>

            <UInput v-if="inviteForm.mode === 'contact'" v-model="inviteForm.phone" placeholder="Phone number" />
            <UTextarea v-model="inviteForm.message" placeholder="Personal message (optional)" />

            <UButton :loading="state.sendingInvite" icon="i-lucide-mail-plus" @click="sendInvite">
              Send invite
            </UButton>
          </div>
          <EmptyState
            v-else
            title="Invites unavailable"
            description="Guest invites are open while the booking is pending or confirmed."
            icon="i-lucide-user-x"
          />
        </UCard>

        <UCard v-if="customerTransitions.length || attendanceOptions.length">
          <template #header>
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-highlighted">Booking actions</h2>
              <p class="text-sm text-muted">
                Status changes allowed for your reservation under the current booking policy.
              </p>
            </div>
          </template>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="transition in customerTransitions"
              :key="transition.status"
              color="primary"
              variant="soft"
              :loading="state.transitioning"
              icon="i-lucide-corner-down-right"
              @click="runTransition(transition.status)"
            >
              {{ transition.label }}
            </UButton>
            <UButton
              v-for="option in attendanceOptions"
              :key="option.value"
              :color="option.value === 'no_show' ? 'error' : 'neutral'"
              variant="soft"
              :loading="state.markingAttendance"
              :icon="option.value === 'no_show' ? 'i-lucide-user-x' : 'i-lucide-check-check'"
              @click="recordAttendance(option.value)"
            >
              {{ option.label }}
            </UButton>
          </div>
        </UCard>

        <UAlert v-if="state.success" color="success" variant="soft" :title="state.success" />
        <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />
      </div>
    </div>
  </div>
</template>
