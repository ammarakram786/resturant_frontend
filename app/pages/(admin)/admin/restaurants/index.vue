<script setup lang="ts">
import type { AdminRestaurantSummary } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Restaurant Approvals & Oversight',
  description: 'Manage restaurant onboarding, KYC reviews, and platform status.',
})

const route = useRoute()
const router = useRouter()
const admin = useAdmin()
const toast = useToast()

const search = ref(String(route.query.q ?? ''))
const status = ref(String(route.query.status ?? ''))
const kycStatus = ref(String(route.query.kyc_status ?? ''))
const actionBusyId = ref<number | null>(null)

const query = computed(() => ({
  q: search.value || undefined,
  status: status.value || undefined,
  kyc_status: kycStatus.value || undefined,
}))

const { data, pending, error, refresh } = await useAsyncData<AdminRestaurantSummary[]>(
  'admin-restaurants-list',
  () => admin.getRestaurants(query.value).catch(() => []),
  { watch: [query] },
)

const applyFilters = async () => {
  await router.replace({
    query: {
      q: search.value || undefined,
      status: status.value || undefined,
      kyc_status: kycStatus.value || undefined,
    },
  })
  await refresh()
}

const updateRestaurantStatus = async (id: number, newStatus: string) => {
  actionBusyId.value = id
  try {
    await admin.reviewRestaurant(id, { status: newStatus })
    toast.add({
      title: 'Restaurant Status Updated',
      description: `Restaurant #${id} set to ${newStatus}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    await refresh()
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed'
    toast.add({
      title: 'Action Failed',
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
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Restaurant Oversight & KYC</span>
          <UBadge color="error" variant="soft" class="font-mono text-xs">Admin</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Review onboarding submissions, verify KYC docs, and manage venue lifecycle status
        </p>
      </div>

      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="i-lucide-refresh-cw"
        :loading="pending"
        @click="refresh()"
      >
        Refresh Queue
      </UButton>
    </div>

    <!-- Filters Bar -->
    <div class="glass-card rounded-2xl p-4 border border-white/10 grid gap-3 sm:grid-cols-12">
      <div class="sm:col-span-6 relative">
        <UIcon name="i-lucide-search" class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by restaurant name, city, or cuisine..."
          class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          @keyup.enter="applyFilters"
        >
      </div>

      <div class="sm:col-span-3">
        <select
          v-model="status"
          class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          @change="applyFilters"
        >
          <option value="">All Lifecycles</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div class="sm:col-span-3">
        <select
          v-model="kycStatus"
          class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          @change="applyFilters"
        >
          <option value="">All KYC Statuses</option>
          <option value="pending">KYC Pending</option>
          <option value="submitted">KYC Submitted</option>
          <option value="approved">KYC Approved</option>
          <option value="rejected">KYC Rejected</option>
        </select>
      </div>
    </div>

    <!-- Error state -->
    <UAlert v-if="error" color="error" variant="soft" title="Unable to fetch restaurants" :description="error.message" />

    <!-- Table Grid -->
    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950/80 border-b border-white/10">
            <tr>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Restaurant</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Cuisine & City</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Lifecycle</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">KYC</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Bookings</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px] text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-white/5">
            <tr v-if="pending" class="animate-pulse">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400">Loading restaurants queue...</td>
            </tr>

            <tr v-else-if="!data || data.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                <UIcon name="i-lucide-store" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p class="font-bold text-white">No Restaurants Found</p>
                <p class="text-[11px]">Try clearing your search or status filter.</p>
              </td>
            </tr>

            <tr v-for="r in data" :key="r.id" class="hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3.5">
                <div class="font-bold text-white text-sm">{{ r.name }}</div>
                <div class="text-[11px] text-slate-400 font-mono">{{ r.slug }}</div>
              </td>

              <td class="px-4 py-3.5 text-slate-300">
                <div>{{ r.cuisine || 'Continental' }}</div>
                <div class="text-[11px] text-slate-400 font-mono">{{ r.city || 'Karachi' }}</div>
              </td>

              <td class="px-4 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold border"
                  :class="r.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : r.status === 'pending_approval' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'"
                >
                  {{ r.status }}
                </span>
              </td>

              <td class="px-4 py-3.5">
                <span class="text-xs font-mono text-slate-300">
                  {{ r.kyc?.status || 'pending' }} ({{ r.kyc?.documents_count || 0 }} docs)
                </span>
              </td>

              <td class="px-4 py-3.5 font-bold font-mono text-amber-400">
                {{ r.booking_count }}
              </td>

              <td class="px-4 py-3.5 text-right space-x-1.5">
                <UButton
                  v-if="r.status !== 'active'"
                  color="success"
                  variant="solid"
                  size="xs"
                  :loading="actionBusyId === r.id"
                  icon="i-lucide-check"
                  @click="updateRestaurantStatus(r.id, 'active')"
                >
                  Approve
                </UButton>

                <UButton
                  v-if="r.status === 'active'"
                  color="error"
                  variant="soft"
                  size="xs"
                  :loading="actionBusyId === r.id"
                  icon="i-lucide-ban"
                  @click="updateRestaurantStatus(r.id, 'suspended')"
                >
                  Suspend
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
