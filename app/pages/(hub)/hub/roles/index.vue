<script setup lang="ts">
import type { HubRole, HubRolePayload, HubRoleTypeScope } from '~~/shared/types/hub'

definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'RBAC Role Management',
  description: 'Define system, chain, restaurant, and guest roles with permissions.',
})

const hub = useHub()
const toast = useToast()

const search = ref('')

const { data, pending, error, refresh } = await useAsyncData(
  'hub-roles',
  () => hub.listRoles({ q: search.value || undefined }).catch(() => ({ items: [] as HubRole[], meta: {} })),
  { watch: [search] },
)

const items = computed(() => data.value?.items ?? [])

const roleScopes: Array<{ label: string, value: HubRoleTypeScope }> = [
  { label: 'System Global', value: 'system' },
  { label: 'Chain Level', value: 'chain' },
  { label: 'Restaurant Level', value: 'restaurant' },
  { label: 'Guest Level', value: 'guest' },
]

const showModal = ref(false)
const editing = ref<HubRole | null>(null)
const busy = ref(false)
const form = reactive<HubRolePayload>({
  name: '',
  code: '',
  role_type: 'restaurant',
  description: '',
  permissions: [],
  is_active: true,
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', code: '', role_type: 'restaurant', description: '', permissions: [], is_active: true })
  showModal.value = true
}

const openEdit = (role: HubRole) => {
  editing.value = role
  Object.assign(form, {
    name: role.name,
    code: role.code,
    role_type: role.role_type ?? 'restaurant',
    description: role.description ?? '',
    permissions: Array.isArray(role.permissions) ? role.permissions as string[] : [],
    is_active: role.is_active,
  })
  showModal.value = true
}

const submit = async () => {
  busy.value = true
  try {
    if (editing.value) {
      await hub.updateRole(editing.value.id, form)
      toast.add({ title: 'Role updated', description: form.name, color: 'success' })
    }
    else {
      await hub.createRole(form)
      toast.add({ title: 'Role created', description: form.name, color: 'success' })
    }
    showModal.value = false
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: err instanceof Error ? err.message : 'Unable to save the role.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const remove = async (role: HubRole) => {
  busy.value = true
  try {
    await hub.deleteRole(role.id)
    toast.add({ title: 'Role deleted', description: role.name, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: err instanceof Error ? err.message : 'Unable to delete the role.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const toggleActive = async (role: HubRole) => {
  busy.value = true
  try {
    await hub.updateRole(role.id, { is_active: !role.is_active })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Update failed',
      description: err instanceof Error ? err.message : 'Unable to update the role.',
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
          <span>Roles & Permissions</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">{{ items.length }}</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">RBAC scopes from system-wide down to guest-level access</p>
      </div>

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton color="secondary" size="sm" icon="i-lucide-plus" @click="openCreate()">
          New Role
        </UButton>
      </div>
    </div>

    <div class="glass-card rounded-2xl p-4 border border-white/10 relative">
      <UIcon name="i-lucide-search" class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Search roles by name or code..."
        class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load roles" :description="error.message" />

    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950/80 border-b border-white/10">
            <tr>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Role</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Code</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Scope</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Permissions</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Active</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-if="pending">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400 animate-pulse">Loading roles...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                <UIcon name="i-lucide-key-round" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p class="font-bold text-white">No roles found</p>
                <p class="text-[11px]">Create the first RBAC role.</p>
              </td>
            </tr>
            <tr v-for="role in items" :key="role.id" class="hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3.5">
                <div class="font-bold text-white text-sm">{{ role.name }}</div>
                <div v-if="role.description" class="text-[11px] text-slate-400 line-clamp-1">{{ role.description }}</div>
              </td>
              <td class="px-4 py-3.5 font-mono text-indigo-300">{{ role.code }}</td>
              <td class="px-4 py-3.5">
                <UBadge :color="role.role_type === 'system' ? 'warning' : role.role_type === 'chain' ? 'secondary' : 'neutral'" variant="subtle" size="xs" class="uppercase">
                  {{ role.role_type || '—' }}
                </UBadge>
              </td>
              <td class="px-4 py-3.5 font-mono text-slate-300">{{ Array.isArray(role.permissions) ? role.permissions.length : 0 }}</td>
              <td class="px-4 py-3.5">
                <button
                  type="button"
                  class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
                  :class="role.is_active ? 'bg-emerald-500/80' : 'bg-slate-700'"
                  @click="toggleActive(role)"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5"
                    :class="role.is_active ? 'translate-x-4 ml-0.5' : 'ml-0.5'"
                  />
                </button>
              </td>
              <td class="px-4 py-3.5 text-right space-x-1.5">
                <UButton color="neutral" variant="soft" size="xs" icon="i-lucide-pencil" @click="openEdit(role)">
                  Edit
                </UButton>
                <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" @click="remove(role)">
                  Delete
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal v-model:open="showModal" :title="editing ? `Edit ${editing.name}` : 'New Role'">
      <template #body>
        <form class="grid gap-3" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Name *</span>
              <input v-model="form.name" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Code *</span>
              <input v-model="form.code" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <label class="text-xs text-slate-300 space-y-1">
            <span>Scope</span>
            <select v-model="form.role_type" class="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option v-for="scope in roleScopes" :key="scope.value" :value="scope.value">{{ scope.label }}</option>
            </select>
          </label>
          <label class="text-xs text-slate-300 space-y-1">
            <span>Description</span>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>
          <label class="text-xs text-slate-300 space-y-1">
            <span>Permissions (comma-separated codenames)</span>
            <input
              :value="(form.permissions ?? []).join(', ')"
              placeholder="e.g. bookings.view, bookings.accept"
              class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @input="form.permissions = ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean)"
            >
          </label>
          <label class="flex items-center gap-2 text-xs text-slate-300">
            <input v-model="form.is_active" type="checkbox" class="rounded bg-slate-950 border-white/10">
            Active
          </label>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" size="sm" @click="showModal = false">
            Cancel
          </UButton>
          <UButton color="secondary" size="sm" :loading="busy" @click="submit">
            {{ editing ? 'Save Changes' : 'Create Role' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
