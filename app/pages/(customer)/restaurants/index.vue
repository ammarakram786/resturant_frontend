<script setup lang="ts">
import type { RestaurantSummary } from '~~/shared/types/domain'
import { useRestaurants } from '../../../composables/useRestaurants'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Restaurants',
  description: 'Browse live restaurant data and availability.',
})

const restaurantsApi = useRestaurants()
const filters = reactive({
  q: '',
  date: new Date().toISOString().slice(0, 10),
  time: '19:00',
  guests: 2,
  dining: 'indoor',
})

const { data: restaurants, refresh, status } = await useAsyncData<RestaurantSummary[]>('restaurant-list', () =>
  restaurantsApi.listRestaurants({
    q: filters.q || undefined,
    date: filters.date,
    time: filters.time,
    guests: filters.guests,
    dining: filters.dining,
  }),
)
const restaurantsList = computed(() => restaurants.value ?? [])
const featuredCities = computed(() => Array.from(new Set(restaurantsList.value.map((item) => item.city).filter(Boolean))).slice(0, 4))
const availableNow = computed(() => restaurantsList.value.filter((item) => item.availability?.available).length)

function applyFilters() {
  refresh()
}
</script>

<template>
  <div class="space-y-6">
    <section class="surface-grid">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Browse restaurants
            </h2>
            <p class="text-sm text-muted">
              Search by venue, date, time, party size, and dining style while staying on the shared availability decision path.
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UInput v-model="filters.q" placeholder="Search by restaurant or area" icon="i-lucide-search" />
          <UInput v-model="filters.date" type="date" />
          <UInput v-model="filters.time" type="time" />
          <UInput v-model="filters.guests" type="number" min="1" max="99" />
          <USelect
            v-model="filters.dining"
            :items="[
              { label: 'Indoor', value: 'indoor' },
              { label: 'Outdoor', value: 'outdoor' }
            ]"
            value-key="value"
          />
        </div>
        <div class="mt-4">
          <UButton icon="i-lucide-filter" @click="applyFilters">
            Refresh availability
          </UButton>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-highlighted">
              Discovery snapshot
            </h2>
            <p class="text-sm text-muted">
              Live restaurant data now drives availability, social proof, and downstream booking or event decisions.
            </p>
          </div>
        </template>

        <div class="grid gap-3 text-sm md:grid-cols-2">
          <UCard variant="subtle">
            <p class="text-xs uppercase tracking-wide text-muted">Bookable now</p>
            <p class="mt-2 text-2xl font-semibold text-highlighted">{{ availableNow }}</p>
            <p class="mt-1 text-muted">Restaurants with direct availability for the current search.</p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-xs uppercase tracking-wide text-muted">Cities in results</p>
            <p class="mt-2 text-sm text-muted">
              {{ featuredCities.length ? featuredCities.join(', ') : 'Results will populate once live venues match your search.' }}
            </p>
          </UCard>
        </div>
      </UCard>
    </section>

    <div v-if="status === 'pending'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <USkeleton v-for="item in 3" :key="item" class="h-52 rounded-2xl" />
    </div>

    <div v-else-if="restaurantsList.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <UCard v-for="restaurant in restaurantsList" :key="restaurant.id">
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-semibold text-highlighted">
                  {{ restaurant.name }}
                </h3>
                <p class="text-sm text-muted">
                  {{ restaurant.cuisine || 'Contemporary dining' }} • {{ restaurant.city || 'Karachi' }}
                </p>
              </div>
              <UBadge
                :color="restaurant.availability?.available ? 'success' : restaurant.availability?.waitlist_available ? 'warning' : 'neutral'"
                variant="soft"
              >
                {{ restaurant.availability?.status || 'Browse' }}
              </UBadge>
            </div>
            <p class="text-sm text-muted">
              {{ restaurant.description || 'Restaurant details available on the next screen.' }}
            </p>
            <div class="flex flex-wrap gap-2 text-xs">
              <UBadge v-if="restaurant.rating" color="neutral" variant="soft">
                {{ restaurant.rating }} stars
              </UBadge>
              <UBadge v-if="restaurant.reviews_count" color="neutral" variant="soft">
                {{ restaurant.reviews_count }} reviews
              </UBadge>
              <UBadge v-if="restaurant.photos?.length" color="neutral" variant="soft">
                {{ restaurant.photos.length }} photos
              </UBadge>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <p>
              <span class="text-muted">Address:</span> {{ restaurant.address || 'Address available on detail page' }}
            </p>
            <p>
              <span class="text-muted">Price:</span> {{ restaurant.price_range || '$$' }}
            </p>
            <p>
              <span class="text-muted">Dining:</span> {{ restaurant.dining_type || 'Restaurant service' }}
            </p>
            <p v-if="restaurant.availability?.message" class="text-muted">
              {{ restaurant.availability.message }}
            </p>
          </div>

          <UButton :to="`/restaurants/${restaurant.id}?date=${filters.date}&time=${filters.time}&guests=${filters.guests}`" block icon="i-lucide-arrow-right">
            View details
          </UButton>
        </div>
      </UCard>
    </div>

    <EmptyState
      v-else
      title="No restaurants matched this search"
      description="Try a broader search or adjust your date, time, or guest count."
      icon="i-lucide-store"
    />
  </div>
</template>
