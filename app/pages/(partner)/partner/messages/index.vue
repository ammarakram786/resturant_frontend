<script setup lang="ts">
import type { ThreadDetail, ThreadRecord } from '~~/shared/types/domain'
import { usePartner } from '../../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Partner Messages',
  description: 'Operator inbox for booking and support threads.',
})

const partner = usePartner()
const statusFilter = ref<'open' | 'closed'>('open')
const selectedThreadId = ref<number | null>(null)
const draftMessage = ref('')
const actionState = reactive({
  sending: false,
  error: '',
})

const { data: threadResponse, pending, refresh } = await useAsyncData(
  'partner-threads',
  () => partner.listThreads(statusFilter.value),
  { default: () => ({ items: [], meta: {} }) },
)

const threads = computed<ThreadRecord[]>(() => threadResponse.value?.items ?? [])

watch(threads, (items) => {
  if (!items.length) {
    selectedThreadId.value = null
    return
  }
  const [firstThread] = items
  if (!selectedThreadId.value || !items.some((thread) => thread.id === selectedThreadId.value)) {
    selectedThreadId.value = firstThread?.id ?? null
  }
}, { immediate: true })

watch(statusFilter, () => {
  refresh()
})

const { data: threadDetail, refresh: refreshThreadDetail } = await useAsyncData<ThreadDetail | null>(
  'partner-thread-detail',
  async () => {
    if (!selectedThreadId.value) {
      return null
    }
    const response = await partner.getThread(selectedThreadId.value)
    return response.data
  },
  {
    watch: [selectedThreadId],
    default: () => null,
  },
)

watch(threadDetail, async (value) => {
  if (value?.thread.id && value.thread.unread_count > 0) {
    await partner.markThreadRead(value.thread.id)
    await refresh()
  }
})

async function sendMessage() {
  if (!selectedThreadId.value || !draftMessage.value.trim()) {
    return
  }

  actionState.sending = true
  actionState.error = ''

  try {
    await partner.sendThreadMessage(selectedThreadId.value, { body: draftMessage.value.trim() })
    draftMessage.value = ''
    await Promise.all([refresh(), refreshThreadDetail()])
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to send the message.'
  }
  finally {
    actionState.sending = false
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'No activity yet'
  }
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-highlighted">
              Operator inbox
            </h2>
            <p class="text-sm text-muted">
              Booking and support threads with unread tracking and idempotent sends.
            </p>
          </div>
          <div class="flex gap-3">
            <USelect
              v-model="statusFilter"
              :items="[
                { label: 'Open', value: 'open' },
                { label: 'Closed', value: 'closed' }
              ]"
              value-key="value"
              class="w-36"
            />
            <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
              Refresh
            </UButton>
          </div>
        </div>
      </template>

      <div class="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div class="space-y-3">
          <UCard
            v-for="thread in threads"
            :key="thread.id"
            :variant="selectedThreadId === thread.id ? 'outline' : 'subtle'"
            class="cursor-pointer"
            @click="selectedThreadId = thread.id"
          >
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">
                    {{ thread.customer?.first_name || `Customer #${thread.customer_user_id}` }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ thread.kind }}<span v-if="thread.booking_id"> • Booking #{{ thread.booking_id }}</span>
                  </p>
                </div>
                <UBadge :color="thread.unread_count ? 'warning' : 'neutral'" variant="soft">
                  {{ thread.unread_count }} unread
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ thread.last_message?.body || 'No preview available yet.' }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDateTime(thread.last_message_at) }}
              </p>
            </div>
          </UCard>

          <EmptyState
            v-if="!threads.length"
            title="No threads for this filter"
            description="Start a booking thread from the bookings page or wait for customer outreach."
            icon="i-lucide-messages-square"
          />
        </div>

        <UCard v-if="threadDetail">
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                {{ threadDetail.thread.customer?.first_name || `Customer #${threadDetail.thread.customer_user_id}` }}
              </h3>
              <p class="text-sm text-muted">
                {{ threadDetail.thread.customer?.masked_phone || 'Masked phone unavailable' }}
                <span v-if="threadDetail.thread.booking_id"> • Booking #{{ threadDetail.thread.booking_id }}</span>
              </p>
            </div>
          </template>

          <UAlert v-if="actionState.error" color="error" variant="soft" :title="actionState.error" />

          <div class="space-y-4">
            <div class="max-h-[28rem] space-y-3 overflow-auto pr-1">
              <UCard
                v-for="message in [...threadDetail.messages].reverse()"
                :key="message.id"
                :variant="message.sender_type === 'restaurant' ? 'solid' : 'subtle'"
                :class="message.sender_type === 'restaurant' ? 'bg-warning-50' : ''"
              >
                <div class="space-y-1">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium text-highlighted">
                      {{ message.sender_name || message.sender_type }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ formatDateTime(message.created_at) }}
                    </p>
                  </div>
                  <p class="text-sm text-muted">
                    {{ message.body || 'Attachment-only message' }}
                  </p>
                </div>
              </UCard>
            </div>

            <div class="space-y-3">
              <UTextarea
                v-model="draftMessage"
                :rows="4"
                placeholder="Write an update for the guest..."
              />
              <div class="flex justify-end">
                <UButton color="primary" :loading="actionState.sending" @click="sendMessage">
                  Send message
                </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>
  </div>
</template>
