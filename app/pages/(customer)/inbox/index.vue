<script setup lang="ts">
import type { ThreadRecord } from '~~/shared/types/domain'
import { useCustomerSession } from '../../../composables/useCustomerSession'
import { useMessaging } from '../../../composables/useMessaging'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Inbox',
  description: 'Customer messaging threads, replies, and concierge escalation.',
})

const messagingApi = useMessaging()
const route = useRoute()
const { data: profile } = await useCustomerSession('customer-inbox-session')
const threadForm = reactive({
  kind: 'direct' as 'support' | 'booking' | 'direct',
  restaurant_id: route.query.restaurant ? Number(route.query.restaurant) : undefined,
  booking_id: undefined as number | undefined,
  inquiry_kind: '',
})
const composeForm = reactive({
  body: '',
})
const state = reactive({
  loadingThreadId: 0,
  creatingThread: false,
  sendingMessage: false,
  escalating: false,
  error: '',
})

const { data: threads, refresh: refreshThreads } = await useAsyncData<ThreadRecord[]>('customer-threads', async () => {
  if (!profile.value) {
    return []
  }

  return messagingApi.listThreads()
})

const threadList = computed(() => threads.value ?? [])
const selectedThreadId = ref<number | null>(null)

watchEffect(() => {
  const firstThread = threadList.value[0]
  if (!selectedThreadId.value && firstThread) {
    selectedThreadId.value = firstThread.id
  }
})

const { data: selectedThread, refresh: refreshSelectedThread } = await useAsyncData(
  'customer-thread-detail',
  async () => {
    if (!profile.value || !selectedThreadId.value) {
      return null
    }

    const detail = await messagingApi.getThread(selectedThreadId.value)
    await messagingApi.markThreadRead(selectedThreadId.value)
    return detail
  },
  {
    watch: [selectedThreadId],
  },
)

async function createThread() {
  state.creatingThread = true
  state.error = ''
  try {
    const thread = await messagingApi.createThread(threadForm)
    selectedThreadId.value = thread.id
    await Promise.all([refreshThreads(), refreshSelectedThread()])
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to create the thread.'
  }
  finally {
    state.creatingThread = false
  }
}

async function sendMessage() {
  if (!selectedThreadId.value || !composeForm.body.trim()) {
    return
  }

  state.sendingMessage = true
  state.error = ''
  try {
    await messagingApi.sendMessage(selectedThreadId.value, { body: composeForm.body })
    composeForm.body = ''
    await Promise.all([refreshThreads(), refreshSelectedThread()])
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to send the message.'
  }
  finally {
    state.sendingMessage = false
  }
}

async function escalateConcierge() {
  state.escalating = true
  state.error = ''
  try {
    const thread = await messagingApi.escalateConcierge({ ai_session_id: `web-${Date.now()}` })
    selectedThreadId.value = thread.id
    await Promise.all([refreshThreads(), refreshSelectedThread()])
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to escalate concierge.'
  }
  finally {
    state.escalating = false
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
      description="Authenticate from Discover before opening your inbox."
    />

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <UCard>
          <template #header>
            <div class="space-y-1">
              <h1 class="text-xl font-semibold text-highlighted">Threads</h1>
              <p class="text-sm text-muted">
                Customer threads keep `kind` and `inquiry_kind` explicit while preserving unread semantics.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid gap-3 md:grid-cols-2">
              <USelect
                v-model="threadForm.kind"
                :items="[
                  { label: 'Direct inquiry', value: 'direct' },
                  { label: 'Support', value: 'support' },
                  { label: 'Booking thread', value: 'booking' }
                ]"
                value-key="value"
              />
              <UInput v-model="threadForm.inquiry_kind" placeholder="Inquiry kind (optional)" />
              <UInput v-model="threadForm.restaurant_id" type="number" placeholder="Restaurant ID (optional)" />
              <UInput v-model="threadForm.booking_id" type="number" placeholder="Booking ID (optional)" />
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton icon="i-lucide-plus" :loading="state.creatingThread" @click="createThread">
                Start thread
              </UButton>
              <UButton color="neutral" variant="soft" icon="i-lucide-bot-message-square" :loading="state.escalating" @click="escalateConcierge">
                Escalate concierge
              </UButton>
            </div>

            <div class="space-y-3">
              <button
                v-for="thread in threadList"
                :key="thread.id"
                type="button"
                class="w-full rounded-2xl border border-default p-4 text-left transition hover:border-primary"
                :class="{ 'border-primary bg-primary/5': selectedThreadId === thread.id }"
                @click="selectedThreadId = thread.id"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-medium text-highlighted">
                      {{ thread.restaurant?.name || `Thread #${thread.id}` }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ thread.kind }}<span v-if="thread.inquiry_kind"> • {{ thread.inquiry_kind }}</span>
                    </p>
                  </div>
                  <UBadge v-if="thread.unread_count" color="warning" variant="soft">
                    {{ thread.unread_count }}
                  </UBadge>
                </div>
                <p class="mt-2 text-sm text-muted">
                  {{ thread.last_message?.body || 'No message preview yet.' }}
                </p>
              </button>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h2 class="text-xl font-semibold text-highlighted">Conversation</h2>
              <p class="text-sm text-muted">
                Message sends use the canonical thread message mutation with idempotency support.
              </p>
            </div>
          </template>

          <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />

          <div v-if="selectedThread" class="space-y-4">
            <div class="space-y-3">
              <UCard v-for="message in selectedThread.messages" :key="message.id" variant="subtle">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-medium text-highlighted">
                    {{ message.sender_name || message.sender_type }}
                  </p>
                  <p class="text-xs text-muted">{{ new Date(message.created_at).toLocaleString() }}</p>
                </div>
                <p class="mt-2 text-sm text-muted">{{ message.body || 'Attachment-only message' }}</p>
              </UCard>
            </div>

            <UTextarea v-model="composeForm.body" placeholder="Reply to this thread" />
            <UButton icon="i-lucide-send" :loading="state.sendingMessage" @click="sendMessage">
              Send message
            </UButton>
          </div>

          <EmptyState
            v-else
            title="Select a thread"
            description="Open an existing conversation or start a new one to view message history."
            icon="i-lucide-message-square-text"
          />
        </UCard>
      </div>
    </template>
  </div>
</template>
