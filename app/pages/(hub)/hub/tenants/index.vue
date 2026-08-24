<script setup lang="ts">
import type { HubTenant, HubTenantPayload, TenantStatus } from '~~/shared/types/hub'

definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'Tenant Management',
  description: 'Create and manage restaurant tenants across the platform.',
})

const hub = useHub()
const toast = useToast()

const search = ref('')
const city = ref('')
const status = ref('')
const page = ref(1)

const query = computed(() => ({
  q: search.value || undefined,
  city: city.value || undefined,
  status: status.value || undefined,
  page: page.value,
}))

const { data, pending, error, refresh } = await useAsyncData(
  'hub-tenants',
  () => hub.listTenants(query.value).catch(() => ({ items: [] as HubTenant[], meta: {} as Record<string, unknown> })),
  { watch: [query] },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => (data.value?.meta?.pagination as { total?: number } | undefined)?.total ?? items.value.length)

const showModal = ref(false)
const editing = ref<HubTenant | null>(null)
const busy = ref(false)
const form = reactive<HubTenantPayload>({
  name: '',
  slug: '',
  status: 'draft',
  city: '',
  cuisine: '',
  price_range: '',
  supports_private_events: false,
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, {
    name: '',
    slug: '',
    status: 'draft',
    city: '',
    cuisine: '',
    price_range: '',
    supports_private_events: false,
  })
  showModal.value = true
}

const openEdit = (tenant: HubTenant) => {
  editing.value = tenant
  Object.assign(form, {
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    city: tenant.city ?? '',
    cuisine: tenant.cuisine ?? '',
    price_range: tenant.price_range ?? '',
    supports_private_events: tenant.supports_private_events,
  })
  showModal.value = true
}

const submit = async () => {
  busy.value = true
  try {
    if (editing.value) {
      await hub.updateTenant(editing.value.id, form)
      toast.add({ title: 'Tenant updated', description: form.name, color: 'success' })
    }
    else {
      await hub.createTenant(form)
      toast.add({ title: 'Tenant created', description: form.name, color: 'success' })
    }
    showModal.value = false
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: err instanceof Error ? err.message : 'Unable to save the tenant.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const remove = async (tenant: HubTenant) => {
  busy.value = true
  try {
    await hub.deleteTenant(tenant.id)
    toast.add({ title: 'Tenant deleted', description: tenant.name, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: err instanceof Error ? err.message : 'Unable to delete the tenant.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const statusTone = (value: TenantStatus | string) =>
  value === 'active'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : value === 'pending_approval'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : value === 'suspended'
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Tenants</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">{{ total }}</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">Onboard and govern restaurant tenants platform-wide</p>
      </div>

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton color="secondary" size="sm" icon="i-lucide-plus" @click="openCreate()">
          New Tenant
        </UButton>
      </div>
    </div>

    <div class="glass-card rounded-2xl p-4 border border-white/10 grid gap-3 sm:grid-cols-12">
      <div class="sm:col-span-5 relative">
        <UIcon name="i-lucide-search" class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search tenants..."
          class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
      </div>
      <div class="sm:col-span-3">
        <input
          v-model="city"
          type="text"
          placeholder="City"
          class="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
      </div>
      <div class="sm:col-span-4">
        <select
          v-model="status"
          class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load tenants" :description="error.message" />

    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950/80 border-b border-white/10">
            <tr>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Tenant</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Cuisine & City</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Status</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Bookings</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Events</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-if="pending">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400 animate-pulse">Loading tenants...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                <UIcon name="i-lucide-store" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p class="font-bold text-white">No tenants found</p>
                <p class="text-[11px]">Adjust filters or create a new tenant.</p>
              </td>
            </tr>
            <tr v-for="tenant in items" :key="tenant.id" class="hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3.5">
                <div class="font-bold text-white text-sm">{{ tenant.name }}</div>
                <div class="text-[11px] text-slate-400 font-mono">{{ tenant.slug }}</div>
              </td>
              <td class="px-4 py-3.5 text-slate-300">
                <div>{{ tenant.cuisine || '—' }}</div>
                <div class="text-[11px] text-slate-400">{{ tenant.city || '—' }}</div>
              </td>
              <td class="px-4 py-3.5">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold border" :class="statusTone(tenant.status)">
                  {{ tenant.status }}
                </span>
              </td>
              <td class="px-4 py-3.5 font-bold font-mono text-amber-400">{{ tenant.booking_count }}</td>
              <td class="px-4 py-3.5">
                <UBadge :color="tenant.supports_private_events ? 'secondary' : 'neutral'" variant="subtle" size="xs">
                  {{ tenant.supports_private_events ? 'Supported' : 'No' }}
                </UBadge>
              </td>
              <td class="px-4 py-3.5 text-right space-x-1.5">
                <UButton color="neutral" variant="soft" size="xs" icon="i-lucide-pencil" @click="openEdit(tenant)">
                  Edit
                </UButton>
                <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" @click="remove(tenant)">
                  Delete
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal v-model:open="showModal" :title="editing ? `Edit ${editing.name}` : 'New Tenant'">
      <template #body>
        <form class="grid gap-3" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Name *</span>
              <input v-model="form.name" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Slug *</span>
              <input v-model="form.slug" required pattern="[-a-zA-Z0-9_]+" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Status</span>
              <select v-model="form.status" class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>City</span>
              <input v-model="form.city" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Cuisine</span>
              <input v-model="form.cuisine" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Price Range</span>
              <input v-model="form.price_range" placeholder="e.g. $$$" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <label class="flex items-center gap-2 text-xs text-slate-300">
            <input v-model="form.supports_private_events" type="checkbox" class="rounded bg-slate-950 border-white/10">
            Supports private events
          </label>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" size="sm" @click="showModal = false">
            Cancel
          </UButton>
          <UButton color="secondary" size="sm" :loading="busy" @click="submit">
            {{ editing ? 'Save Changes' : 'Create Tenant' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
