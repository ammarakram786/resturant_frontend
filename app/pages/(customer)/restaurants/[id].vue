<script setup lang="ts">
import type { RestaurantDetail } from '~~/shared/types/domain'
import { useBookings } from '../../../composables/useBookings'
import { useRestaurants } from '../../../composables/useRestaurants'
import { useAuthStore } from '../../../stores/auth'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const restaurantsApi = useRestaurants()
const bookingsApi = useBookings()
const authStore = useAuthStore()

const form = reactive({
  date: (route.query.date as string) || new Date().toISOString().slice(0, 10),
  time: (route.query.time as string) || '19:00',
  people: Number(route.query.guests || 2),
  dining_area: 'Indoor Main Dining',
  special_request: '',
  waitlist: false,
})

const isBooking = ref(false)
const selectedMenuCategory = ref<string>('all')

const { data: restaurant, pending, refresh } = await useAsyncData<RestaurantDetail | null>(
  `restaurant-detail-${route.params.id}`,
  () => restaurantsApi.getRestaurant(String(route.params.id), {
    date: form.date,
    time: form.time,
    guests: form.people,
  }),
)

useSeoMeta({
  title: computed(() => restaurant.value?.name ? `${restaurant.value.name} | Fine Dining` : 'Restaurant Detail'),
  description: computed(() => restaurant.value?.description || 'Reserve table & explore luxury menu.'),
})

const availability = computed(() => restaurant.value?.availability)

const selectSlot = (slotTime: string) => {
  form.time = slotTime
}

const submitBooking = async () => {
  if (!authStore.isAuthenticated) {
    toast.add({
      title: 'Authentication Required',
      description: 'Please sign in to complete your table reservation.',
      color: 'warning',
      icon: 'i-lucide-lock',
    })
    router.push('/login')
    return
  }

  isBooking.value = true
  try {
    const booking = await bookingsApi.createBooking({
      restaurant_id: Number(route.params.id),
      date: form.date,
      time: form.time,
      people: form.people,
      dining_area: form.dining_area,
      special_request: form.special_request,
      waitlist: form.waitlist,
    })

    toast.add({
      title: booking.status === 'waitlisted' ? 'Joined Waitlist' : 'Reservation Confirmed!',
      description: `Reference Code: ${booking.code} for ${booking.people} guests on ${booking.starts_at}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    router.push('/bookings')
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to complete reservation.'
    toast.add({
      title: 'Reservation Failed',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
  finally {
    isBooking.value = false
  }
}
</script>

<template>
  <div class="space-y-8 pb-16">
    <!-- Back Button -->
    <div class="flex items-center justify-between">
      <NuxtLink to="/discover">
        <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left">
          Back to Discover
        </UButton>
      </NuxtLink>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="pending" class="glass-card rounded-3xl p-8 animate-pulse space-y-6">
      <div class="h-64 bg-slate-800 rounded-2xl" />
      <div class="h-8 bg-slate-800 rounded w-1/3" />
      <div class="h-4 bg-slate-800 rounded w-2/3" />
    </div>

    <template v-else-if="restaurant">
      <!-- Venue Hero Header -->
      <div class="relative rounded-3xl overflow-hidden glass-card border border-white/10">
        <div class="relative h-72 sm:h-96 bg-slate-900">
          <img
            :src="restaurant.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'"
            :alt="restaurant.name"
            class="w-full h-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <!-- Floating Badges -->
          <div class="absolute top-6 left-6 flex flex-wrap gap-2">
            <span class="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <UIcon name="i-lucide-star" class="h-3.5 w-3.5 fill-amber-400" />
              {{ restaurant.rating || '4.9' }} ({{ restaurant.reviews_count || 240 }} reviews)
            </span>
            <span class="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs font-mono text-emerald-400">
              {{ restaurant.price_range || '$$$$' }}
            </span>
          </div>

          <!-- Venue Title & Address -->
          <div class="absolute bottom-6 left-6 right-6 space-y-2">
            <div class="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 tracking-wider">
              <span>{{ restaurant.cuisine || 'Fine Dining' }}</span>
              <span>•</span>
              <span>{{ restaurant.city || 'Karachi' }}</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {{ restaurant.name }}
            </h1>
            <p class="text-sm text-slate-300 max-w-2xl">
              {{ restaurant.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Main 2-Column Grid -->
      <div class="grid gap-8 lg:grid-cols-12">
        <!-- Left Column: Details & Menus (7 Cols) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Overview Cards -->
          <div class="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <UIcon name="i-lucide-info" class="h-5 w-5 text-amber-400" />
              Venue Overview
            </h3>

            <div class="grid gap-4 sm:grid-cols-2 text-xs text-slate-300">
              <div class="flex items-start gap-2.5 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p class="font-semibold text-white">Address</p>
                  <p class="text-slate-400 mt-0.5">{{ restaurant.address || 'Central Boulevard, Clifton, Karachi' }}</p>
                </div>
              </div>

              <div class="flex items-start gap-2.5 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                <UIcon name="i-lucide-clock" class="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p class="font-semibold text-white">Operating Hours</p>
                  <p class="text-slate-400 mt-0.5">12:00 PM – 11:30 PM Daily</p>
                </div>
              </div>
            </div>

            <!-- Facilities -->
            <div v-if="restaurant.facilities?.length" class="space-y-2 pt-2">
              <p class="text-xs uppercase tracking-wider font-mono text-slate-400">Amenities & Amenities:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="fac in restaurant.facilities"
                  :key="fac"
                  class="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-white/10 text-xs text-slate-300"
                >
                  {{ fac }}
                </span>
              </div>
            </div>
          </div>

          <!-- Section Layouts -->
          <div v-if="restaurant.sections?.length" class="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <UIcon name="i-lucide-layers" class="h-5 w-5 text-amber-400" />
              Available Seating Areas
            </h3>

            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="sec in restaurant.sections"
                :key="sec.key"
                class="p-4 rounded-xl border border-white/10 bg-slate-950/60 flex items-center justify-between"
              >
                <div>
                  <p class="text-sm font-bold text-white">{{ sec.name }}</p>
                  <p class="text-xs text-slate-400">Capacity up to {{ sec.capacity || 8 }} guests</p>
                </div>
                <UBadge v-if="sec.private_event_enabled" color="warning" variant="soft" size="sm">
                  Private Events
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Menus Showcase -->
          <div v-if="restaurant.menus?.length" class="glass-card rounded-2xl p-6 space-y-4 border border-white/10">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <UIcon name="i-lucide-utensils" class="h-5 w-5 text-amber-400" />
                Culinary Menu Preview
              </h3>
            </div>

            <div class="space-y-4">
              <div v-for="menu in restaurant.menus" :key="menu.name" class="space-y-3">
                <h4 class="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-1">
                  {{ menu.name || menu.title }}
                </h4>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    v-for="item in (menu.items || menu.categories?.flatMap(c => c.items || []) || []).slice(0, 6)"
                    :key="item.name"
                    class="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p class="text-xs font-semibold text-white">{{ item.name }}</p>
                      <p v-if="item.description" class="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {{ item.description }}
                      </p>
                    </div>
                    <span class="text-xs font-mono text-amber-400 font-bold shrink-0">
                      {{ item.price ? `PKR ${item.price}` : 'Market' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Interactive Booking Widget (5 Cols) -->
        <div class="lg:col-span-5 space-y-6">
          <div class="glass-card rounded-3xl p-6 space-y-6 border border-amber-500/30 shadow-2xl sticky top-24">
            <div class="border-b border-white/10 pb-4">
              <h3 class="text-xl font-extrabold text-white flex items-center gap-2">
                <UIcon name="i-lucide-calendar-check-2" class="h-6 w-6 text-amber-400" />
                Reserve a Table
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                Instant confirmation powered by live restaurant contract
              </p>
            </div>

            <!-- Booking Inputs Form -->
            <div class="space-y-4">
              <!-- Date Picker -->
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Reservation Date</label>
                <input
                  v-model="form.date"
                  type="date"
                  class="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  @change="refresh"
                >
              </div>

              <!-- Guests Count -->
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Number of Guests</label>
                <div class="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl p-1.5">
                  <button
                    type="button"
                    class="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition-colors"
                    @click="form.people = Math.max(1, form.people - 1)"
                  >
                    -
                  </button>
                  <span class="flex-1 text-center font-bold text-white text-base">
                    {{ form.people }} {{ form.people === 1 ? 'Guest' : 'Guests' }}
                  </span>
                  <button
                    type="button"
                    class="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition-colors"
                    @click="form.people = Math.min(12, form.people + 1)"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Available Slot Picker -->
              <div v-if="availability?.available_times?.length" class="space-y-2">
                <label class="block text-xs font-semibold uppercase text-slate-300">Select Available Slot</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="slot in availability.available_times"
                    :key="slot"
                    type="button"
                    class="py-2 px-3 rounded-xl border text-xs font-mono font-semibold transition-all"
                    :class="form.time === slot ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-bold' : 'bg-slate-950 border-white/10 text-slate-300 hover:border-white/30'"
                    @click="selectSlot(slot)"
                  >
                    {{ slot }}
                  </button>
                </div>
              </div>

              <!-- Dining Area Selection -->
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Dining Area Preference</label>
                <select
                  v-model="form.dining_area"
                  class="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Indoor Main Dining">Indoor Main Dining</option>
                  <option value="Rooftop Terrace">Rooftop Terrace</option>
                  <option value="Chef's Lounge">Chef's Lounge</option>
                  <option value="Private VIP Room">Private VIP Room</option>
                </select>
              </div>

              <!-- Special Request -->
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-300 mb-1.5">Special Requests</label>
                <textarea
                  v-model="form.special_request"
                  rows="2"
                  placeholder="Anniversary, dietary restrictions, quiet table..."
                  class="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <!-- Action Button -->
            <UButton
              color="primary"
              variant="solid"
              block
              size="lg"
              :loading="isBooking"
              icon="i-lucide-check-square"
              class="py-3 font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300"
              @click="submitBooking"
            >
              Confirm Reservation
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
