<script setup lang="ts">
import { useAdmin } from '~~/app/composables/useAdmin'
import { useAdminFormat } from '~~/app/composables/useAdminFormat'
import type { AdminEventRecord } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Admin Audit',
  description: 'Audit and domain event visibility for admin-sensitive actions.',
})

const admin = useAdmin()
const { formatDateTime } = useAdminFormat()

const search = ref('')
const aggregateType = ref('')

const aggregateCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const event of data.value ?? []) {
    counts.set(event.aggregate_type, (counts.get(event.aggregate_type) ?? 0) + 1)
  }
  return Array.from(counts.entries())
})

const { data, error, refresh } = await useAsyncData<AdminEventRecord[]>(
  'admin-audit-events',
  () => admin.getAuditEvents({ q: search.value || undefined, aggregate_type: aggregateType.value || undefined }),
  { watch: [search, aggregateType] },
)
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-highlighted">
            Audit visibility
          </h2>
          <p class="text-sm text-muted">
            Review domain events produced by trust changes, messaging, restaurant review decisions, and other platform activity.
          </p>
        </div>
      </template>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <input
          v-model="search"
          type="text"
          placeholder="Search event name or aggregate"
          class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm"
        >
        <select v-model="aggregateType" class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm">
          <option value="">
            All aggregates
          </option>
          <option value="restaurant">
            restaurant
          </option>
          <option value="thread">
            thread
          </option>
          <option value="booking">
            booking
          </option>
        </select>
      </div>
    </UCard>

    <EmptyState
      v-if="error"
      title="Audit feed unavailable"
      :description="error.message"
      icon="i-lucide-scroll-text"
    >
      <UButton color="error" variant="soft" @click="refresh()">
        Retry
      </UButton>
    </EmptyState>

    <UCard v-else>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-highlighted">
            Event feed
          </h2>
          <span class="text-sm text-muted">
            {{ data?.length ?? 0 }} events
          </span>
        </div>
      </template>

      <div class="space-y-3">
        <div v-if="aggregateCounts.length" class="grid gap-3 md:grid-cols-3">
          <UCard v-for="[name, total] in aggregateCounts" :key="name" variant="subtle">
            <p class="text-xs uppercase tracking-wide text-muted">{{ name }}</p>
            <p class="mt-2 text-2xl font-semibold text-highlighted">{{ total }}</p>
          </UCard>
        </div>

        <div
          v-for="event in data ?? []"
          :key="event.id"
          class="rounded-2xl border border-default px-4 py-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="neutral" variant="soft">
              {{ event.aggregate_type }}
            </UBadge>
            <UBadge color="error" variant="subtle">
              {{ event.event_name }}
            </UBadge>
            <span class="text-xs text-muted">
              #{{ event.aggregate_id }} · {{ formatDateTime(event.created_at) }}
            </span>
          </div>
          <p v-if="event.audience?.length" class="mt-2 text-xs text-muted">
            Audience: {{ event.audience.map((item) => `${String(item.kind || 'target')}#${String(item.id || '')}`).join(', ') }}
          </p>
          <pre class="mt-3 overflow-x-auto rounded-xl bg-gray-950 px-3 py-3 text-xs text-white">{{ JSON.stringify(event.payload, null, 2) }}</pre>
        </div>

        <p v-if="!(data?.length)" class="text-sm text-muted">
          No events matched the current filters.
        </p>
      </div>
    </UCard>
  </div>
</template>
