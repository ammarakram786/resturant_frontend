<script setup lang="ts">
import { useAdmin } from '~~/app/composables/useAdmin'
import { useAdminFormat } from '~~/app/composables/useAdminFormat'
import type { AdminSupportThreadDetail, AdminSupportThreadSummary } from '~~/shared/types/admin'

definePageMeta({
  layout: 'admin',
  middleware: 'surface',
  surface: 'admin',
})

useSeoMeta({
  title: 'Admin Support',
  description: 'Support inbox visibility with masked customer context and admin replies.',
})

const admin = useAdmin()
const { formatDateTime, statusColor } = useAdminFormat()

const search = ref('')
const status = ref('open')
const selectedThreadId = ref<number | null>(null)
const replyForm = reactive({
  body: '',
  close_thread: false,
})
const revealForm = reactive({
  reason: '',
})
const sending = ref(false)
const revealing = ref(false)
const feedback = ref('')
const actionError = ref('')
const revealedPii = ref<{ name?: string, email?: string | null, phone?: string | null } | null>(null)

const { data: threads, pending, error, refresh } = await useAsyncData<AdminSupportThreadSummary[]>(
  'admin-support-threads',
  () => admin.getSupportThreads({ q: search.value || undefined, status: status.value || undefined }),
  { watch: [search, status] },
)

const { data: threadDetail, refresh: refreshThread } = await useAsyncData<AdminSupportThreadDetail | null>(
  () => `admin-support-thread-${selectedThreadId.value ?? 'none'}`,
  () => selectedThreadId.value ? admin.getSupportThread(selectedThreadId.value) : Promise.resolve(null),
  { watch: [selectedThreadId] },
)

watchEffect(() => {
  const firstThread = threads.value?.[0]
  if (!selectedThreadId.value && firstThread) {
    selectedThreadId.value = firstThread.id
  }
})

const submitReply = async () => {
  if (!selectedThreadId.value || !replyForm.body.trim()) {
    return
  }

  sending.value = true
  feedback.value = ''
  actionError.value = ''

  try {
    await admin.replyToSupportThread(selectedThreadId.value, {
      body: replyForm.body,
      close_thread: replyForm.close_thread,
    })
    replyForm.body = ''
    replyForm.close_thread = false
    feedback.value = 'Reply sent.'
    await Promise.all([refresh(), refreshThread()])
  }
  catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : 'Unable to send the support reply.'
  }
  finally {
    sending.value = false
  }
}

const revealPii = async () => {
  if (!selectedThreadId.value || !revealForm.reason.trim()) {
    actionError.value = 'A reason is required before revealing customer contact details.'
    return
  }

  revealing.value = true
  feedback.value = ''
  actionError.value = ''

  try {
    const response = await admin.revealSupportThreadPii(selectedThreadId.value, {
      reason: revealForm.reason.trim(),
    })
    revealedPii.value = response.customer
    feedback.value = 'Customer contact details revealed and audited.'
  }
  catch (caught) {
    actionError.value = caught instanceof Error ? caught.message : 'Unable to reveal support-thread contact details.'
  }
  finally {
    revealing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-highlighted">
            Support inbox
          </h2>
          <p class="text-sm text-muted">
            Support threads stay masked-by-default while giving admins enough context to triage and reply.
          </p>
        </div>
      </template>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        <input
          v-model="search"
          type="text"
          placeholder="Search by subject, customer, or restaurant"
          class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm"
        >
        <select v-model="status" class="w-full rounded-xl border border-default bg-white px-3 py-2 text-sm">
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="">All statuses</option>
        </select>
      </div>
    </UCard>

    <EmptyState
      v-if="error"
      title="Support queue unavailable"
      :description="error.message"
      icon="i-lucide-life-buoy"
    >
      <UButton color="error" variant="soft" @click="refresh()">
        Retry
      </UButton>
    </EmptyState>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-highlighted">
              Thread queue
            </h2>
            <span class="text-sm text-muted">
              {{ pending ? 'Loading…' : `${threads?.length ?? 0} threads` }}
            </span>
          </div>
        </template>

        <div class="space-y-3">
          <button
            v-for="thread in threads ?? []"
            :key="thread.id"
            type="button"
            class="w-full rounded-2xl border px-4 py-4 text-left transition"
            :class="selectedThreadId === thread.id ? 'border-error-300 bg-error-50/50' : 'border-default bg-white hover:border-error-200'"
            @click="selectedThreadId = thread.id"
          >
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="statusColor(thread.status)" variant="soft">
                {{ thread.status }}
              </UBadge>
              <UBadge color="neutral" variant="subtle">
                {{ thread.inquiry_kind || thread.kind }}
              </UBadge>
              <span class="text-xs text-muted">
                {{ formatDateTime(thread.last_message_at) }}
              </span>
            </div>
            <p class="mt-2 font-medium text-highlighted">
              {{ thread.subject || 'Support thread' }}
            </p>
            <p class="mt-1 text-sm text-muted">
              {{ thread.customer?.first_name || 'Customer' }} · {{ thread.customer?.masked_phone || 'No phone' }}
            </p>
            <p class="mt-2 text-sm text-muted">
              {{ thread.last_message_preview || 'No message preview available.' }}
            </p>
          </button>

          <p v-if="!(threads?.length) && !pending" class="text-sm text-muted">
            No support threads matched the current filters.
          </p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="text-base font-semibold text-highlighted">
            Thread detail
          </h2>
        </template>

        <div v-if="threadDetail" class="space-y-4">
          <div class="rounded-2xl border border-default px-4 py-4">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge :color="statusColor(threadDetail.thread.status)" variant="soft">
                {{ threadDetail.thread.status }}
              </UBadge>
              <UBadge color="neutral" variant="subtle">
                {{ threadDetail.thread.inquiry_kind || threadDetail.thread.kind }}
              </UBadge>
            </div>
            <p class="mt-3 text-sm text-muted">
              Customer: {{ threadDetail.thread.customer?.first_name || 'Unknown' }} · {{ threadDetail.thread.customer?.masked_phone || 'No phone' }}
            </p>
            <p class="mt-1 text-sm text-muted">
              Restaurant: {{ threadDetail.thread.restaurant?.name || 'No restaurant linked' }}
            </p>
            <p class="mt-1 text-sm text-muted">
              Booking: {{ threadDetail.thread.booking_id ? `#${threadDetail.thread.booking_id}` : 'No booking linked' }}
            </p>
            <div v-if="revealedPii" class="mt-3 rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted">
              <p><span class="font-medium text-highlighted">Name:</span> {{ revealedPii.name || 'Unknown' }}</p>
              <p><span class="font-medium text-highlighted">Email:</span> {{ revealedPii.email || 'No email' }}</p>
              <p><span class="font-medium text-highlighted">Phone:</span> {{ revealedPii.phone || 'No phone' }}</p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="messageItem in threadDetail.messages"
              :key="messageItem.id"
              class="rounded-2xl border border-default px-4 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <UBadge :color="messageItem.sender_type === 'customer' ? 'warning' : 'neutral'" variant="soft">
                  {{ messageItem.sender_type }}
                </UBadge>
                <span class="text-xs text-muted">
                  {{ formatDateTime(messageItem.created_at) }}
                </span>
              </div>
              <p class="mt-2 text-sm text-highlighted">
                {{ messageItem.body || 'Attachment only' }}
              </p>
            </div>
            <p v-if="!threadDetail.messages.length" class="text-sm text-muted">
              No messages yet on this thread.
            </p>
          </div>

          <div class="space-y-3 border-t border-default pt-4">
            <label class="space-y-2 text-sm">
              <span class="text-muted">PII reveal reason</span>
              <textarea
                v-model="revealForm.reason"
                rows="3"
                class="w-full rounded-2xl border border-default bg-white px-3 py-2"
                placeholder="Why elevated contact access is needed"
              />
            </label>

            <div class="flex items-center gap-3">
              <UButton color="neutral" variant="soft" :loading="revealing" @click="revealPii">
                Reveal and audit
              </UButton>
            </div>

            <label class="space-y-2 text-sm">
              <span class="text-muted">Reply</span>
              <textarea
                v-model="replyForm.body"
                rows="4"
                class="w-full rounded-2xl border border-default bg-white px-3 py-2"
                placeholder="Reply to the customer"
              />
            </label>

            <label class="flex items-center gap-2 text-sm text-muted">
              <input v-model="replyForm.close_thread" type="checkbox">
              Close thread after reply
            </label>

            <div class="flex items-center gap-3">
              <UButton color="error" :loading="sending" @click="submitReply">
                Send reply
              </UButton>
              <span v-if="feedback" class="text-sm text-success-600">{{ feedback }}</span>
              <span v-if="actionError" class="text-sm text-error-600">{{ actionError }}</span>
            </div>
          </div>
        </div>

        <p v-else class="text-sm text-muted">
          Select a support thread to inspect messages and reply.
        </p>
      </UCard>
    </div>
  </div>
</template>
