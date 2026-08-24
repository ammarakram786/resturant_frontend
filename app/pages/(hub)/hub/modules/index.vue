<script setup lang="ts">
import type { HubModule, HubModulePayload } from '~~/shared/types/hub'

definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'Platform Modules',
  description: 'Enable, disable, and configure the platform feature modules.',
})

const hub = useHub()
const toast = useToast()
const { formatDateTime } = useAdminFormat()

const { data, pending, error, refresh } = await useAsyncData(
  'hub-modules',
  () => hub.listModules({}).catch(() => ({ items: [] as HubModule[], meta: {} })),
)

const items = computed(() => data.value?.items ?? [])

const showModal = ref(false)
const editing = ref<HubModule | null>(null)
const busy = ref(false)
const form = reactive<HubModulePayload>({
  name: '',
  slug: '',
  description: '',
  is_active: true,
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, { name: '', slug: '', description: '', is_active: true })
  showModal.value = true
}

const openEdit = (module: HubModule) => {
  editing.value = module
  Object.assign(form, {
    name: module.name,
    slug: module.slug,
    description: module.description ?? '',
    is_active: module.is_active,
  })
  showModal.value = true
}

const submit = async () => {
  busy.value = true
  try {
    if (editing.value) {
      await hub.updateModule(editing.value.id, form)
      toast.add({ title: 'Module updated', description: form.name, color: 'success' })
    }
    else {
      await hub.createModule(form)
      toast.add({ title: 'Module created', description: form.name, color: 'success' })
    }
    showModal.value = false
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: err instanceof Error ? err.message : 'Unable to save the module.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const toggleActive = async (module: HubModule) => {
  try {
    await hub.updateModule(module.id, { is_active: !module.is_active })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Update failed',
      description: err instanceof Error ? err.message : 'Unable to toggle the module.',
      color: 'error',
    })
  }
}

const remove = async (module: HubModule) => {
  busy.value = true
  try {
    await hub.deleteModule(module.id)
    toast.add({ title: 'Module deleted', description: module.name, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: err instanceof Error ? err.message : 'Unable to delete the module.',
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
          <span>Modules</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">{{ items.length }}</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">Toggle platform capabilities on or off per deployment</p>
      </div>

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton color="secondary" size="sm" icon="i-lucide-plus" @click="openCreate()">
          New Module
        </UButton>
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load modules" :description="error.message" />

    <div v-if="pending && !items.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="glass-card rounded-2xl border border-white/10 p-5 animate-pulse h-32" />
    </div>

    <div v-else-if="!items.length" class="glass-card rounded-2xl border border-white/10 p-12 text-center">
      <UIcon name="i-lucide-blocks" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
      <p class="font-bold text-white">No modules registered</p>
      <p class="text-[11px] text-slate-400">Create the first platform module.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="module in items"
        :key="module.id"
        class="glass-card rounded-2xl border p-5 transition-colors"
        :class="module.is_active ? 'border-emerald-500/30' : 'border-white/10'"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-white truncate">{{ module.name }}</h3>
            <p class="text-[11px] text-slate-400 font-mono">{{ module.slug }}</p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
            :class="module.is_active ? 'bg-emerald-500/80' : 'bg-slate-700'"
            @click="toggleActive(module)"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5"
              :class="module.is_active ? 'translate-x-4 ml-0.5' : 'ml-0.5'"
            />
          </button>
        </div>

        <p class="text-xs text-slate-400 mt-3 line-clamp-2 min-h-[2rem]">
          {{ module.description || 'No description provided.' }}
        </p>

        <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <span class="text-[10px] font-mono text-slate-500">Since {{ formatDateTime(module.created_at) }}</span>
          <div class="space-x-1.5">
            <UButton color="neutral" variant="soft" size="xs" icon="i-lucide-pencil" @click="openEdit(module)">
              Edit
            </UButton>
            <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" @click="remove(module)">
              Delete
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal" :title="editing ? `Edit ${editing.name}` : 'New Module'">
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
          <label class="text-xs text-slate-300 space-y-1">
            <span>Description</span>
            <textarea v-model="form.description" rows="3" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
            {{ editing ? 'Save Changes' : 'Create Module' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
