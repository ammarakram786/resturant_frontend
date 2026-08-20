<script setup lang="ts">
import type { RestaurantSummary } from '~~/shared/types/domain'
import { useRestaurants } from '../../../composables/useRestaurants'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Discover Luxury Restaurants',
  description: 'Find, reserve, and experience elite fine dining venues.',
})

const { listRestaurants } = useRestaurants()

const searchQuery = ref('')
const selectedGuests = ref(2)
const selectedCuisine = ref('all')

const cuisineOptions = [
  { label: 'All Cuisines', value: 'all' },
  { label: 'Pakistani / Continental', value: 'Pakistani' },
  { label: 'Italian & Mediterranean', value: 'Italian' },
  { label: 'Japanese & Asian Fusion', value: 'Japanese' },
  { label: 'Steakhouse & Grill', value: 'Steakhouse' },
]

const { data: restaurants, pending, error } = await useAsyncData<RestaurantSummary[]>(
  'discover-restaurants',
  () => listRestaurants({ guests: selectedGuests.value }),
)

const filteredRestaurants = computed(() => {
  if (!restaurants.value) return []
  return restaurants.value.filter((r) => {
    const matchesSearch = searchQuery.value
      ? r.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        r.cuisine?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        r.city?.toLowerCase().includes(searchQuery.value.toLowerCase())
      : true

    const matchesCuisine = selectedCuisine.value === 'all'
      ? true
      : r.cuisine?.toLowerCase().includes(selectedCuisine.value.toLowerCase())

    return matchesSearch && matchesCuisine
  })
})
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Hero Banner with Glassmorphism Search -->
    <div class="relative rounded-3xl overflow-hidden border border-white/10 glass-card p-8 md:p-12 text-center md:text-left">
      <div class="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div class="relative z-10 max-w-3xl space-y-4">
        <UBadge color="primary" variant="soft" class="px-3 py-1 font-mono uppercase text-xs tracking-wider">
          Premium Dining Reservations
        </UBadge>
        <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Reserve Exceptional <span class="gold-gradient-text">Culinary Experiences</span>
        </h1>
        <p class="text-slate-400 text-sm md:text-base max-w-2xl">
          Instantly check live table availability, explore chef menus, reserve private sections, and earn loyalty points across handpicked venues.
        </p>

        <!-- Search Bar -->
        <div class="pt-4 grid gap-3 sm:grid-cols-12 bg-slate-950/80 p-3 rounded-2xl border border-white/10 shadow-2xl">
          <div class="sm:col-span-6 relative">
            <UIcon name="i-lucide-search" class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by restaurant, cuisine, or city..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
          </div>

          <div class="sm:col-span-3">
            <USelect
              v-model="selectedCuisine"
              :items="cuisineOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <div class="sm:col-span-3">
            <div class="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5">
              <UIcon name="i-lucide-users" class="h-4 w-4 text-amber-400 shrink-0" />
              <span class="text-xs text-slate-400">Guests:</span>
              <input
                v-model.number="selectedGuests"
                type="number"
                min="1"
                max="20"
                class="w-12 bg-transparent text-sm text-white font-bold text-center focus:outline-none"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Restaurant Catalog Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">
            Featured Restaurants
          </h2>
          <p class="text-xs text-slate-400">
            Showing {{ filteredRestaurants.length }} verified dining venues
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="glass-card rounded-2xl p-5 space-y-4 animate-pulse">
          <div class="h-44 bg-slate-800 rounded-xl" />
          <div class="h-5 bg-slate-800 rounded w-3/4" />
          <div class="h-4 bg-slate-800 rounded w-1/2" />
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        title="Unable to load restaurants"
        :description="error.message"
        icon="i-lucide-alert-triangle"
      />

      <!-- Empty State -->
      <div v-else-if="filteredRestaurants.length === 0" class="glass-card rounded-2xl p-12 text-center space-y-3">
        <UIcon name="i-lucide-store-off" class="h-12 w-12 text-slate-500 mx-auto" />
        <h3 class="text-lg font-bold text-white">No Restaurants Found</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          We couldn't find any dining options matching your criteria. Try adjusting your search query or filters.
        </p>
      </div>

      <!-- Restaurant Cards Grid -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          class="glass-card rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 group flex flex-col"
        >
          <!-- Thumbnail Image -->
          <div class="relative h-48 bg-slate-800 overflow-hidden">
            <img
              :src="restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'"
              :alt="restaurant.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

            <div class="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs font-semibold text-amber-400">
              <UIcon name="i-lucide-star" class="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{{ restaurant.rating || '4.8' }}</span>
              <span class="text-slate-400 font-normal">({{ restaurant.reviews_count || 120 }})</span>
            </div>

            <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs font-mono text-emerald-400">
              {{ restaurant.price_range || '$$$' }}
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
              <span class="flex items-center gap-1 font-medium">
                <UIcon name="i-lucide-map-pin" class="h-3.5 w-3.5 text-amber-400" />
                {{ restaurant.city || 'Karachi' }}
              </span>
              <span class="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono text-[10px] uppercase">
                {{ restaurant.dining_type || 'Fine Dining' }}
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {{ restaurant.name }}
              </h3>
              <p class="text-xs text-slate-400 line-clamp-2 mt-1">
                {{ restaurant.description || `${restaurant.cuisine || 'Luxury'} dining destination featuring curated seasonal menus.` }}
              </p>
            </div>

            <!-- Available Slots Badge -->
            <div v-if="restaurant.availability?.available_times?.length" class="space-y-1.5">
              <p class="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                Available Slots Today:
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="slot in restaurant.availability.available_times.slice(0, 4)"
                  :key="slot"
                  class="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono"
                >
                  {{ slot }}
                </span>
                <span v-if="restaurant.availability.available_times.length > 4" class="text-xs text-slate-500 self-center">
                  +{{ restaurant.availability.available_times.length - 4 }} more
                </span>
              </div>
            </div>

            <!-- Action Button -->
            <div class="pt-2 border-t border-white/5 flex items-center justify-between">
              <span class="text-xs text-slate-400">
                {{ restaurant.cuisine || 'International' }}
              </span>

              <NuxtLink :to="`/restaurants/${restaurant.id}`">
                <UButton
                  color="primary"
                  variant="solid"
                  size="sm"
                  icon="i-lucide-calendar-plus"
                  class="font-semibold"
                >
                  Reserve Table
                </UButton>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
