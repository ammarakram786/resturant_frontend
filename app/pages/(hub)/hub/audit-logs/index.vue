<script setup lang="ts">
import type { HubAuditEvent } from '~~/shared/types/hub'

definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'Hub Audit Logs',
  description: 'Immutable platform audit trail across modules and resources.',
})

const hub = useHub()
const { formatDateTime } = useAdminFormat()

const action = ref('')
const moduleName = ref('')
const resourceType = ref('')
const actorId = ref('')
const page = ref(1)

const query = computed(() => ({
  action: action.value || undefined,
  module_name: moduleName.value || undefined,
  resource_type: resourceType.value || undefined,
  actor_id: actorId.value ? Number(actorId.value) : undefined,
  ordering: '-created_at',
  page: page.value,
}))

const { data, pending, error, refresh } = await useAsyncData(
  'hub-audit-logs',
  () => hub.listAuditEvents(query.value).catch(() => ({ items: [] as HubAuditEvent[], meta: {} as Record<string, unknown> })),
  { watch: [query] },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => (data.value?.meta?.pagination as { total?: number } | undefined)?.total ?? items.value.length)

const selected = ref<HubAuditEvent | null>(null)

const payloadPreview = (event: HubAuditEvent) => {
  if (!event.payload)
    return ''
  try {
    return JSON.stringify(event.payload)
  }
  catch {
    return String(event.payload)
  }
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Audit Logs</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">{{ total }}</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">Every privileged action across the platform, in order</p>
      </div>

      <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
        Refresh
      </UButton>
    </div>

    <div class="glass-card rounded-2xl p-4 border border-white/10 grid gap-3 sm:grid-cols-12">
      <div class="sm:col-span-4 relative">
        <UIcon name="i-lucide-zap" class="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input v-model="action" type="text" placeholder="Action (e.g. booking.accept)" class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      </div>
      <div class="sm:col-span-3">
        <input v-model="moduleName" type="text" placeholder="Module" class="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      </div>
      <div class="sm:col-span-3">
        <input v-model="resourceType" type="text" placeholder="Resource Type" class="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      </div>
      <div class="sm:col-span-2">
        <input v-model="actorId" type="number" placeholder="Actor ID" class="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
      </div>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load audit logs" :description="error.message" />

    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <ul v-if="items.length" class="divide-y divide-white/5">
        <li
          v-for="event in items"
          :key="event.id"
          class="px-4 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer"
          @click="selected = event"
        >
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2 min-w-0">
              <UBadge color="neutral" variant="subtle" size="xs" class="font-mono shrink-0">{{ event.id }}</UBadge>
              <span class="text-xs font-bold text-white font-mono truncate">{{ event.action }}</span>
            </div>
            <div class="flex items-center gap-3 text-[10px] font-mono text-slate-500 shrink-0">
              <span v-if="event.actor_email">{{ event.actor_email }}</span>
              <span>{{ formatDateTime(event.created_at) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span v-if="event.module_name" class="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">{{ event.module_name }}</span>
            <span v-if="event.resource_type" class="font-mono">{{ event.resource_type }}<template v-if="event.resource_id">#{{ event.resource_id }}</template></span>
          </div>
        </li>
      </ul>
      <div v-else-if="pending" class="px-4 py-8 text-center text-slate-400 animate-pulse">Loading audit trail...</div>
      <div v-else class="px-4 py-12 text-center text-slate-400">
        <UIcon name="i-lucide-history" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
        <p class="font-bold text-white">No audit events found</p>
        <p class="text-[11px]">Try clearing the filters.</p>
      </div>
    </div>

    <UModal :open="!!selected" title="Audit Event Detail" @update:open="selected = null">
      <template #body>
        <div v-if="selected" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div><span class="block text-slate-400">Action</span><span class="font-mono text-white break-all">{{ selected.action }}</span></div>
            <div><span class="block text-slate-400">Created</span><span class="font-mono text-white">{{ formatDateTime(selected.created_at) }}</span></div>
            <div><span class="block text-slate-400">Actor</span><span class="font-mono text-white">{{ selected.actor_email || selected.actor_id || 'system' }}</span></div>
            <div><span class="block text-slate-400">IP</span><span class="font-mono text-white">{{ selected.ip_address || '—' }}</span></div>
            <div><span class="block text-slate-400">Module</span><span class="font-mono text-white">{{ selected.module_name || '—' }}</span></div>
            <div><span class="block text-slate-400">Resource</span><span class="font-mono text-white">{{ selected.resource_type ? `${selected.resource_type}#${selected.resource_id ?? '?'}` : '—' }}</span></div>
          </div>
          <div v-if="payloadPreview(selected)">
            <span class="block text-slate-400 mb-1">Payload</span>
            <pre class="bg-slate-950 border border-white/10 rounded-lg p-3 overflow-x-auto text-[11px] text-emerald-300 font-mono max-h-60 overflow-y-auto">{{ payloadPreview(selected) }}</pre>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
