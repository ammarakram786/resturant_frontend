<script setup lang="ts">
import type { HubUser, HubUserPayload } from '~~/shared/types/hub'

definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'Hub User Management',
  description: 'Manage platform users, roles, and restaurant assignments.',
})

const hub = useHub()
const toast = useToast()

const search = ref('')
const role = ref('')
const isActive = ref('')
const page = ref(1)

const query = computed(() => ({
  q: search.value || undefined,
  role: role.value || undefined,
  is_active: isActive.value === '' ? undefined : isActive.value === 'true',
  page: page.value,
}))

const { data, pending, error, refresh } = await useAsyncData(
  'hub-users',
  () => hub.listUsers(query.value).catch(() => ({ items: [] as HubUser[], meta: {} as Record<string, unknown> })),
  { watch: [query] },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => (data.value?.meta?.pagination as { total?: number } | undefined)?.total ?? items.value.length)

const roles = ['customer', 'owner', 'restaurant', 'manager', 'staff', 'cashier', 'waiter', 'admin']

const showModal = ref(false)
const editing = ref<HubUser | null>(null)
const busy = ref(false)
const form = reactive<HubUserPayload>({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'customer',
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, { username: '', email: '', first_name: '', last_name: '', phone: '', role: 'customer' })
  showModal.value = true
}

const openEdit = (user: HubUser) => {
  editing.value = user
  Object.assign(form, {
    username: user.username,
    email: user.email ?? '',
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    phone: user.phone ?? '',
    role: user.role ?? 'customer',
  })
  showModal.value = true
}

const submit = async () => {
  busy.value = true
  try {
    if (editing.value) {
      await hub.updateHubUser(editing.value.id, form)
      toast.add({ title: 'User updated', description: form.username, color: 'success' })
    }
    else {
      await hub.createHubUser(form)
      toast.add({ title: 'User created', description: form.username, color: 'success' })
    }
    showModal.value = false
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: err instanceof Error ? err.message : 'Unable to save the user.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const remove = async (user: HubUser) => {
  busy.value = true
  try {
    await hub.deleteHubUser(user.id)
    toast.add({ title: 'User deleted', description: user.username, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: err instanceof Error ? err.message : 'Unable to delete the user.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Users</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">{{ total }}</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">Central directory of platform users and their assignments</p>
      </div>

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton color="secondary" size="sm" icon="i-lucide-plus" @click="openCreate()">
          New User
        </UButton>
      </div>
    </div>

    <div class="glass-card rounded-2xl p-4 border border-white/10 grid gap-3 sm:grid-cols-12">
      <div class="sm:col-span-6 relative">
        <UIcon name="i-lucide-search" class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by username or email..."
          class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
      </div>
      <div class="sm:col-span-3">
        <select v-model="role" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Roles</option>
          <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="sm:col-span-3">
        <select v-model="isActive" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Any Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load users" :description="error.message" />

    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950/80 border-b border-white/10">
            <tr>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">User</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Contact</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Role</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Trust</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Restaurant</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-if="pending">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400 animate-pulse">Loading users...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                <UIcon name="i-lucide-users-round" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p class="font-bold text-white">No users found</p>
                <p class="text-[11px]">Adjust filters or create a new user.</p>
              </td>
            </tr>
            <tr v-for="user in items" :key="user.id" class="hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3.5">
                <div class="font-bold text-white text-sm">{{ user.full_name || user.username }}</div>
                <div class="text-[11px] text-slate-400 font-mono">@{{ user.username }}</div>
              </td>
              <td class="px-4 py-3.5 text-slate-300">
                <div>{{ user.email || '—' }}</div>
                <div class="text-[11px] text-slate-400">{{ user.phone || '—' }}<span v-if="user.is_phone_verified"> ✓</span></div>
              </td>
              <td class="px-4 py-3.5">
                <UBadge color="secondary" variant="subtle" size="xs" class="uppercase">{{ user.role || 'customer' }}</UBadge>
              </td>
              <td class="px-4 py-3.5 font-mono text-amber-400">{{ user.trust_score ?? '—' }}</td>
              <td class="px-4 py-3.5 font-mono text-slate-300">{{ user.primary_restaurant ? `#${user.primary_restaurant}` : '—' }}</td>
              <td class="px-4 py-3.5 text-right space-x-1.5">
                <UButton color="neutral" variant="soft" size="xs" icon="i-lucide-pencil" @click="openEdit(user)">
                  Edit
                </UButton>
                <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" @click="remove(user)">
                  Delete
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal v-model:open="showModal" :title="editing ? `Edit @${editing.username}` : 'New User'">
      <template #body>
        <form class="grid gap-3" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Username *</span>
              <input v-model="form.username" required pattern="[\w.@+-]+" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Role</span>
              <select v-model="form.role" class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>First Name</span>
              <input v-model="form.first_name" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Last Name</span>
              <input v-model="form.last_name" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Email</span>
              <input v-model="form.email" type="email" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Phone</span>
              <input v-model="form.phone" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" size="sm" @click="showModal = false">
            Cancel
          </UButton>
          <UButton color="secondary" size="sm" :loading="busy" @click="submit">
            {{ editing ? 'Save Changes' : 'Create User' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
