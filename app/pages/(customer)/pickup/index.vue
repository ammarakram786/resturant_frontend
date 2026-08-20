<script setup lang="ts">
import type { PickupOrderRecord, RestaurantDetail, RestaurantMenuItem, RestaurantSummary } from '~~/shared/types/domain'
import { useCustomerSession } from '../../../composables/useCustomerSession'
import { usePickupOrders } from '../../../composables/usePickupOrders'
import { useRestaurants } from '../../../composables/useRestaurants'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Pickup',
  description: 'Customer pickup checkout and order history.',
})

const pickupApi = usePickupOrders()
const restaurantsApi = useRestaurants()
const route = useRoute()
const { data: profile } = await useCustomerSession('customer-pickup-session')
const orderForm = reactive({
  restaurant_id: Number(route.query.restaurant || 0),
  scheduled_for: '',
  notes: '',
  item_name: '',
  selected_item_key: '',
  quantity: 1,
  unit_price: '0.00',
  options_csv: '',
})
const state = reactive({
  submitting: false,
  success: '',
  error: '',
})

const { data: restaurants } = await useAsyncData<RestaurantSummary[]>('pickup-restaurants', async () => {
  return restaurantsApi.listRestaurants()
})

const { data: restaurantDetail } = await useAsyncData<RestaurantDetail | null>(
  'pickup-selected-restaurant-detail',
  async () => {
    if (!orderForm.restaurant_id) {
      return null
    }
    return restaurantsApi.getRestaurant(orderForm.restaurant_id)
  },
  { watch: [() => orderForm.restaurant_id] },
)

const menuItems = computed<RestaurantMenuItem[]>(() =>
  (restaurantDetail.value?.menus ?? []).flatMap((menu) => [
    ...(menu.items ?? []),
    ...((menu.categories ?? []).flatMap((category) => category.items ?? [])),
  ]),
)

watch(() => orderForm.selected_item_key, (value) => {
  const matched = menuItems.value.find((item) => String(item.id ?? item.name) === value)
  if (!matched) {
    return
  }
  orderForm.item_name = matched.name
  orderForm.unit_price = String(matched.price ?? '0.00')
  orderForm.options_csv = (matched.options ?? [])
    .map((option) => String(option.name ?? option.label ?? option.value ?? ''))
    .filter(Boolean)
    .join(', ')
})

const { data: orders, refresh } = await useAsyncData<PickupOrderRecord[]>('customer-pickup-orders', async () => {
  if (!profile.value) {
    return []
  }

  return pickupApi.listPickupOrders()
})

async function createPickupOrder() {
  if (!orderForm.restaurant_id) {
    state.error = 'Choose a restaurant before placing the pickup order.'
    return
  }

  state.submitting = true
  state.success = ''
  state.error = ''
  try {
    await pickupApi.createPickupOrder(orderForm.restaurant_id, {
      scheduled_for: orderForm.scheduled_for ? new Date(orderForm.scheduled_for).toISOString() : undefined,
      notes: orderForm.notes,
      items: [
        {
          name: orderForm.item_name,
          quantity: orderForm.quantity,
          unit_price: orderForm.unit_price,
          options: orderForm.options_csv
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((name) => ({ name })),
        },
      ],
    })
    orderForm.item_name = ''
    orderForm.quantity = 1
    orderForm.unit_price = '0.00'
    orderForm.options_csv = ''
    orderForm.notes = ''
    state.success = 'Pickup order created.'
    await refresh()
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to create the pickup order.'
  }
  finally {
    state.submitting = false
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
      description="Authenticate from Discover before placing pickup orders."
    />

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <UCard>
          <template #header>
            <div class="space-y-1">
              <h1 class="text-xl font-semibold text-highlighted">Pickup checkout</h1>
              <p class="text-sm text-muted">
                Build a takeaway order from live restaurant menu data and keep the option snapshot attached to the order.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <USelect
              v-model="orderForm.restaurant_id"
              :items="(restaurants ?? []).map((restaurant) => ({ label: restaurant.name, value: restaurant.id }))"
              value-key="value"
            />
            <USelect
              v-if="menuItems.length"
              v-model="orderForm.selected_item_key"
              :items="menuItems.map((item) => ({ label: `${item.name}${item.price ? ` • PKR ${item.price}` : ''}`, value: String(item.id ?? item.name) }))"
              value-key="value"
              placeholder="Choose a menu item"
            />
            <div class="grid gap-4 md:grid-cols-2">
              <UInput v-model="orderForm.scheduled_for" type="datetime-local" />
              <UInput v-model="orderForm.item_name" placeholder="Menu item name" />
              <UInput v-model="orderForm.quantity" type="number" min="1" />
              <UInput v-model="orderForm.unit_price" placeholder="Unit price" />
            </div>
            <UInput v-model="orderForm.options_csv" placeholder="Options, comma separated" />
            <UTextarea v-model="orderForm.notes" placeholder="Pickup notes" />
            <div v-if="restaurantDetail?.menus?.length" class="grid gap-3 md:grid-cols-2">
              <UCard
                v-for="menu in restaurantDetail.menus.slice(0, 2)"
                :key="menu.id ?? menu.name"
                variant="subtle"
              >
                <p class="font-medium text-highlighted">{{ menu.name || menu.title || 'Menu' }}</p>
                <p class="mt-1 text-sm text-muted">
                  {{ (menu.items?.length ?? 0) + ((menu.categories ?? []).reduce((total, category) => total + (category.items?.length ?? 0), 0)) }} items available
                </p>
              </UCard>
            </div>
            <UButton icon="i-lucide-shopping-bag" :loading="state.submitting" @click="createPickupOrder">
              Place pickup order
            </UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-xl font-semibold text-highlighted">Pickup history</h2>
              <p class="text-sm text-muted">
                Recent pickup orders are exposed back to the customer web through a narrow read endpoint.
              </p>
            </div>
          </template>

          <div v-if="orders?.length" class="space-y-4">
            <UCard v-for="order in orders" :key="order.id" variant="subtle">
              <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-medium text-highlighted">{{ order.restaurant?.name || `Restaurant #${order.restaurant_id}` }}</p>
                    <UBadge variant="soft">{{ order.status }}</UBadge>
                    <UBadge color="neutral" variant="soft">{{ order.payment_status }}</UBadge>
                  </div>
                  <p class="text-sm text-muted">
                    {{ order.code }} • {{ order.scheduled_for ? new Date(order.scheduled_for).toLocaleString() : 'ASAP' }}
                  </p>
                  <p class="text-sm text-muted">Subtotal: {{ order.subtotal }}</p>
                  <ul class="space-y-1 text-sm text-muted">
                    <li v-for="item in order.items" :key="item.id">
                      {{ item.quantity }} x {{ item.name }} ({{ item.subtotal }})
                    </li>
                  </ul>
                </div>
              </div>
            </UCard>
          </div>
          <EmptyState
            v-else
            title="No pickup orders yet"
            description="Place a takeaway order here to validate the pickup checkout flow."
            icon="i-lucide-shopping-bag"
          />
        </UCard>
      </div>

      <UAlert v-if="state.success" color="success" variant="soft" :title="state.success" />
      <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />
    </template>
  </div>
</template>
