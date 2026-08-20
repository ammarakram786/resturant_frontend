<script setup lang="ts">
import type { PrivateEventRecord, RestaurantDetail, RestaurantSummary } from '~~/shared/types/domain'
import { useCustomerSession } from '../../../composables/useCustomerSession'
import { usePrivateEvents } from '../../../composables/usePrivateEvents'
import { useRestaurants } from '../../../composables/useRestaurants'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Private Events',
  description: 'Customer private event enquiries and quote responses.',
})

const privateEventsApi = usePrivateEvents()
const restaurantsApi = useRestaurants()
const route = useRoute()
const { data: profile } = await useCustomerSession('customer-private-events-session')
const enquiryForm = reactive({
  restaurant_id: Number(route.query.restaurant || 0),
  event_type: '',
  guest_count: 25,
  requested_starts_at: '',
  requested_ends_at: '',
  section_key: '',
  customer_name: '',
  contact_phone: '',
  notes: '',
})
const state = reactive({
  creating: false,
  respondingId: 0,
  success: '',
  error: '',
})

watchEffect(() => {
  if (!profile.value) {
    return
  }

  enquiryForm.customer_name ||= profile.value.name
  enquiryForm.contact_phone ||= profile.value.phone ?? ''
})

const { data: restaurants } = await useAsyncData<RestaurantSummary[]>('private-event-restaurants', async () => {
  return restaurantsApi.listRestaurants()
})

const { data: selectedRestaurant } = await useAsyncData<RestaurantDetail | null>(
  'private-event-selected-restaurant',
  async () => {
    if (!enquiryForm.restaurant_id) {
      return null
    }
    return restaurantsApi.getRestaurant(enquiryForm.restaurant_id)
  },
  { watch: [() => enquiryForm.restaurant_id] },
)

const availableSections = computed(() =>
  (selectedRestaurant.value?.sections ?? []).filter((section) => section.private_event_enabled !== false),
)

const { data: events, refresh } = await useAsyncData<PrivateEventRecord[]>('customer-private-events', async () => {
  if (!profile.value) {
    return []
  }

  return privateEventsApi.listPrivateEvents()
})

async function createEnquiry() {
  if (!enquiryForm.restaurant_id) {
    state.error = 'Choose a restaurant before submitting the enquiry.'
    return
  }

  state.creating = true
  state.success = ''
  state.error = ''
  try {
    await restaurantsApi.createPrivateEvent(enquiryForm.restaurant_id, enquiryForm)
    state.success = 'Private event enquiry submitted.'
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to submit the enquiry.'
  }
  finally {
    state.creating = false
  }
}

async function respond(eventId: number, action: 'accept' | 'cancel') {
  state.respondingId = eventId
  state.success = ''
  state.error = ''
  try {
    if (action === 'accept') {
      await privateEventsApi.acceptPrivateEvent(eventId)
      state.success = 'Private event accepted.'
    }
    else {
      await privateEventsApi.cancelPrivateEvent(eventId)
      state.success = 'Private event cancelled.'
    }
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : `Unable to ${action} this event.`
  }
  finally {
    state.respondingId = 0
  }
}
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="!profile"
      color="warning"
      variant="soft"
      title="Sign in required"
      description="Authenticate from Discover before managing private events."
    />

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <UCard>
          <template #header>
            <div class="space-y-1">
              <h1 class="text-xl font-semibold text-highlighted">Create an enquiry</h1>
              <p class="text-sm text-muted">
                Choose a venue, section, and time window using the same event-space inventory the operator sees.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <USelect
              v-model="enquiryForm.restaurant_id"
              :items="(restaurants ?? []).map((restaurant) => ({ label: restaurant.name, value: restaurant.id }))"
              value-key="value"
            />
            <div class="grid gap-4 md:grid-cols-2">
              <UInput v-model="enquiryForm.event_type" placeholder="Event type" />
              <UInput v-model="enquiryForm.guest_count" type="number" min="1" />
              <UInput v-model="enquiryForm.requested_starts_at" type="datetime-local" />
              <UInput v-model="enquiryForm.requested_ends_at" type="datetime-local" />
              <USelect
                v-model="enquiryForm.section_key"
                :items="[
                  { label: 'Flexible section', value: '' },
                  ...availableSections.map((section) => ({
                    label: `${section.name}${section.capacity ? ` • ${section.capacity} guests` : ''}`,
                    value: section.key,
                  })),
                ]"
                value-key="value"
              />
              <UInput v-model="enquiryForm.contact_phone" placeholder="Contact phone" />
            </div>
            <div v-if="availableSections.length" class="grid gap-3 md:grid-cols-2">
              <UCard v-for="section in availableSections.slice(0, 4)" :key="section.key" variant="subtle">
                <p class="font-medium text-highlighted">{{ section.name }}</p>
                <p class="mt-1 text-sm text-muted">
                  {{ section.capacity ? `${section.capacity} guest capacity` : 'Capacity shared on request' }}
                </p>
              </UCard>
            </div>
            <UInput v-model="enquiryForm.customer_name" placeholder="Customer name" />
            <UTextarea v-model="enquiryForm.notes" placeholder="Notes for the venue" />
            <UButton icon="i-lucide-party-popper" :loading="state.creating" @click="createEnquiry">
              Submit enquiry
            </UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-xl font-semibold text-highlighted">My private events</h2>
              <p class="text-sm text-muted">
                Accepted, quoted, and cancelled states remain visible with quote totals and history context.
              </p>
            </div>
          </template>

          <div v-if="events?.length" class="space-y-4">
            <UCard v-for="event in events" :key="event.id" variant="subtle">
              <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-medium text-highlighted">{{ event.event_type || 'Private event' }}</p>
                    <UBadge variant="soft">{{ event.status }}</UBadge>
                  </div>
                  <p class="text-sm text-muted">
                    {{ new Date(event.requested_starts_at).toLocaleString() }} to
                    {{ new Date(event.requested_ends_at).toLocaleString() }}
                  </p>
                  <p class="text-sm text-muted">
                    Guests: {{ event.guest_count }} • Section: {{ event.section_key || 'Flexible' }}
                  </p>
                  <p class="text-sm text-muted">Quoted total: {{ event.quoted_total || '0.00' }}</p>
                  <p v-if="event.latest_message" class="text-sm text-muted">{{ event.latest_message }}</p>
                  <div v-if="event.status_history?.length" class="flex flex-wrap gap-2 pt-1">
                    <UBadge
                      v-for="(entry, index) in event.status_history.slice(-4)"
                      :key="`${event.id}-${index}`"
                      color="neutral"
                      variant="soft"
                    >
                      {{ String(entry.status || 'updated') }}
                    </UBadge>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-if="event.status === 'quoted'"
                    color="primary"
                    variant="soft"
                    :loading="state.respondingId === event.id"
                    @click="respond(event.id, 'accept')"
                  >
                    Accept quote
                  </UButton>
                  <UButton
                    v-if="event.status !== 'cancelled' && event.status !== 'declined'"
                    color="neutral"
                    variant="soft"
                    :loading="state.respondingId === event.id"
                    @click="respond(event.id, 'cancel')"
                  >
                    Cancel
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
          <EmptyState
            v-else
            title="No private events yet"
            description="Submit an enquiry to start a quote-driven private event journey."
            icon="i-lucide-party-popper"
          />
        </UCard>
      </div>

      <UAlert v-if="state.success" color="success" variant="soft" :title="state.success" />
      <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />
    </template>
  </div>
</template>
