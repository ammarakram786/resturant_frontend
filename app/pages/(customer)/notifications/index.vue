<script setup lang="ts">
import type { NotificationRecord } from '~~/shared/types/domain'
import { useCustomerSession } from '../../../composables/useCustomerSession'
import { useNotifications } from '../../../composables/useNotifications'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Notifications',
  description: 'Customer notification feed and unread state.',
})

const notificationsApi = useNotifications()
const { data: profile } = await useCustomerSession('customer-notifications-session')
const state = reactive({
  busy: false,
  error: '',
})

const { data: notifications, refresh } = await useAsyncData<NotificationRecord[]>('customer-notifications', async () => {
  if (!profile.value) {
    return []
  }

  return notificationsApi.listNotifications()
})

const { data: unreadCount, refresh: refreshUnread } = await useAsyncData<number>('customer-notifications-unread', async () => {
  if (!profile.value) {
    return 0
  }

  const response = await notificationsApi.getUnreadCount()
  return response.count
})

const notificationList = computed(() => notifications.value ?? [])
const unreadIds = computed(() => notificationList.value.filter((item) => !item.read_at).map((item) => item.id))

async function markAllRead() {
  if (!unreadIds.value.length) {
    return
  }

  state.busy = true
  state.error = ''
  try {
    await notificationsApi.markRead(unreadIds.value)
    await Promise.all([refresh(), refreshUnread()])
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to mark notifications as read.'
  }
  finally {
    state.busy = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-highlighted">Notifications</h1>
            <p class="text-sm text-muted">
              Inbox persistence and unread counters are explicit API surface, not websocket-only behavior.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UBadge color="primary" variant="soft">{{ unreadCount ?? 0 }} unread</UBadge>
            <UButton icon="i-lucide-check-check" :loading="state.busy" :disabled="!unreadIds.length" @click="markAllRead">
              Mark all read
            </UButton>
          </div>
        </div>
      </template>

      <UAlert
        v-if="!profile"
        color="warning"
        variant="soft"
        title="Sign in required"
        description="Authenticate from Discover before loading notifications."
      />

      <div v-else-if="notificationList.length" class="space-y-4">
        <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />

        <UCard v-for="item in notificationList" :key="item.id" :variant="item.read_at ? 'subtle' : 'outline'">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium text-highlighted">{{ item.title }}</p>
                <UBadge variant="soft">{{ item.category }}</UBadge>
                <UBadge v-if="!item.read_at" color="warning" variant="soft">New</UBadge>
              </div>
              <p class="text-sm text-muted">{{ item.body || 'No body provided.' }}</p>
              <p class="text-xs text-muted">
                {{ new Date(item.created_at).toLocaleString() }} • {{ item.event_name || 'system.event' }}
              </p>
            </div>
            <p class="text-xs text-muted">Delivery: {{ item.status }}</p>
          </div>
        </UCard>
      </div>

      <EmptyState
        v-else
        title="No notifications yet"
        description="Booking, message, referral, and pickup events will appear here as backend fan-out grows."
        icon="i-lucide-bell-off"
      />
    </UCard>
  </div>
</template>
