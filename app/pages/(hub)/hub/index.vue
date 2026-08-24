<script setup lang="ts">
definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'Hub Platform Overview',
  description: 'Multi-tenant management, RBAC, platform modules, invoicing, and audit trails.',
})

const hub = useHub()
const { getStatus } = useSystemStatus()
const { formatDateTime } = useAdminFormat()

const { data: platformStatus } = await useAsyncData('hub-platform-status', async () => {
  try {
    return await getStatus()
  }
  catch {
    return null
  }
})

const { data, pending, error, refresh } = await useAsyncData('hub-overview', async () => {
  const [tenants, users, roles, modules, invoices, auditEvents] = await Promise.all([
    hub.listTenants({ page_size: 1 }).catch(() => ({ items: [], meta: {} })),
    hub.listUsers({ page_size: 1 }).catch(() => ({ items: [], meta: {} })),
    hub.listRoles({ page_size: 1 }).catch(() => ({ items: [], meta: {} })),
    hub.listModules({ page_size: 100 }).catch(() => ({ items: [], meta: {} })),
    hub.listInvoices({ page_size: 5 }).catch(() => ({ items: [], meta: {} })),
    hub.listAuditEvents({ page_size: 6, ordering: '-created_at' }).catch(() => ({ items: [], meta: {} })),
  ])

  const pagination = (meta: Record<string, unknown>) =>
    (meta.pagination as { total?: number } | undefined)?.total ?? null

  return {
    tenantCount: pagination(tenants.meta),
    userCount: pagination(users.meta),
    roleCount: pagination(roles.meta),
    activeModules: modules.items.filter(m => m.is_active).length,
    totalModules: modules.items.length,
    recentInvoices: invoices.items,
    recentEvents: auditEvents.items,
  }
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Hub Platform Ops</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">Hub</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Centralized multi-tenant governance across restaurants, users, roles, and billing
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
        Refresh
      </UButton>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load hub overview" :description="error.message" />

    <div
      v-if="platformStatus"
      class="glass-card rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-slate-400"
    >
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        API {{ platformStatus.api }}
      </span>
      <span>v{{ platformStatus.version }}</span>
      <span>phase: <strong class="text-indigo-300">{{ platformStatus.phase }}</strong></span>
      <span>payments: {{ platformStatus.payments }}</span>
      <span>push: {{ platformStatus.realtime.push_enabled ? platformStatus.realtime.push_provider : 'off' }}</span>
      <span>booking poll: {{ platformStatus.realtime.booking_poll_interval_seconds }}s</span>
    </div>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="glass-card rounded-2xl border border-white/10 p-5 animate-pulse h-28" />
    </div>

    <div v-else-if="data" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink to="/hub/tenants" class="glass-card rounded-2xl border border-white/10 p-5 hover:border-indigo-400/40 transition-colors">
        <div class="flex items-center justify-between">
          <UIcon name="i-lucide-store" class="h-5 w-5 text-indigo-300" />
          <span class="text-[10px] uppercase font-mono text-slate-500">Tenants</span>
        </div>
        <p class="text-3xl font-extrabold text-white mt-3">{{ data.tenantCount ?? '—' }}</p>
      </NuxtLink>

      <NuxtLink to="/hub/users" class="glass-card rounded-2xl border border-white/10 p-5 hover:border-indigo-400/40 transition-colors">
        <div class="flex items-center justify-between">
          <UIcon name="i-lucide-users-round" class="h-5 w-5 text-indigo-300" />
          <span class="text-[10px] uppercase font-mono text-slate-500">Users</span>
        </div>
        <p class="text-3xl font-extrabold text-white mt-3">{{ data.userCount ?? '—' }}</p>
      </NuxtLink>

      <NuxtLink to="/hub/roles" class="glass-card rounded-2xl border border-white/10 p-5 hover:border-indigo-400/40 transition-colors">
        <div class="flex items-center justify-between">
          <UIcon name="i-lucide-key-round" class="h-5 w-5 text-indigo-300" />
          <span class="text-[10px] uppercase font-mono text-slate-500">Roles</span>
        </div>
        <p class="text-3xl font-extrabold text-white mt-3">{{ data.roleCount ?? '—' }}</p>
      </NuxtLink>

      <NuxtLink to="/hub/modules" class="glass-card rounded-2xl border border-white/10 p-5 hover:border-indigo-400/40 transition-colors">
        <div class="flex items-center justify-between">
          <UIcon name="i-lucide-blocks" class="h-5 w-5 text-indigo-300" />
          <span class="text-[10px] uppercase font-mono text-slate-500">Modules Active</span>
        </div>
        <p class="text-3xl font-extrabold text-white mt-3">
          {{ data.activeModules }}<span class="text-sm text-slate-400">/{{ data.totalModules }}</span>
        </p>
      </NuxtLink>
    </div>

    <div v-if="data" class="grid gap-4 lg:grid-cols-2">
      <div class="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <UIcon name="i-lucide-receipt-text" class="h-4 w-4 text-indigo-300" />
            Latest Invoices
          </h2>
          <NuxtLink to="/hub/billing" class="text-[11px] text-indigo-300 hover:text-indigo-200">View all</NuxtLink>
        </div>
        <ul v-if="data.recentInvoices.length" class="divide-y divide-white/5">
          <li v-for="invoice in data.recentInvoices" :key="invoice.id" class="px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold text-white font-mono">{{ invoice.invoice_number }}</p>
              <p class="text-[11px] text-slate-400">{{ invoice.restaurant_name }}</p>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-amber-400 font-mono">{{ invoice.total || '—' }}</p>
              <p class="text-[10px] uppercase font-mono text-slate-500">{{ invoice.status || 'draft' }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="px-4 py-8 text-center text-xs text-slate-400">No invoices recorded yet.</p>
      </div>

      <div class="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <UIcon name="i-lucide-history" class="h-4 w-4 text-indigo-300" />
            Recent Audit Events
          </h2>
          <NuxtLink to="/hub/audit-logs" class="text-[11px] text-indigo-300 hover:text-indigo-200">View all</NuxtLink>
        </div>
        <ul v-if="data.recentEvents.length" class="divide-y divide-white/5">
          <li v-for="event in data.recentEvents" :key="event.id" class="px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-bold text-white font-mono truncate">{{ event.action }}</p>
              <p class="text-[10px] text-slate-500 shrink-0">{{ formatDateTime(event.created_at) }}</p>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              {{ event.module_name || 'system' }}<span v-if="event.actor_email"> • {{ event.actor_email }}</span>
            </p>
          </li>
        </ul>
        <p v-else class="px-4 py-8 text-center text-xs text-slate-400">No audit events yet.</p>
      </div>
    </div>
  </div>
</template>
