<script setup lang="ts">
import type { NotificationPreferences, NotificationRecord } from '~~/shared/types/domain'
import { usePartner } from '../../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Partner Alerts',
  description: 'Operator alerts and notification preferences.',
})

const partner = usePartner()
const actionState = reactive({
  savingPreferences: false,
  markingRead: false,
  error: '',
  success: '',
})

const { data: notifications, pending: notificationsPending, refresh: refreshNotifications } = await useAsyncData(
  'partner-alerts',
  async () => {
    const response = await partner.listNotifications()
    return response.items
  },
  { default: () => [] },
)

const { data: unreadCount, refresh: refreshUnreadCount } = await useAsyncData('partner-alert-unread', async () => {
  const response = await partner.getUnreadNotifications()
  return response.count
}, { default: () => 0 })

const { data: preferences, pending: preferencesPending, refresh: refreshPreferences } = await useAsyncData<NotificationPreferences | null>(
  'partner-alert-preferences',
  () => partner.getNotificationPreferences(),
  { default: () => null },
)

const preferenceForm = reactive<NotificationPreferences>({
  push_enabled: true,
  sms_enabled: false,
  email_enabled: true,
  booking_enabled: true,
  messages_enabled: true,
  marketing_enabled: false,
  system_enabled: true,
  locale: 'en',
})

watch(preferences, (value) => {
  if (!value) {
    return
  }
  Object.assign(preferenceForm, value)
}, { immediate: true })

const unreadNotifications = computed<NotificationRecord[]>(() =>
  (notifications.value ?? []).filter((notification) => !notification.is_read),
)

async function markUnreadAsRead() {
  if (!unreadNotifications.value.length) {
    return
  }

  actionState.markingRead = true
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.markNotificationsRead(unreadNotifications.value.map((notification) => notification.id))
    actionState.success = 'Unread alerts marked as read.'
    await Promise.all([refreshNotifications(), refreshUnreadCount()])
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to mark alerts as read.'
  }
  finally {
    actionState.markingRead = false
  }
}

async function savePreferences() {
  actionState.savingPreferences = true
  actionState.error = ''
  actionState.success = ''

  try {
    await partner.updateNotificationPreferences(preferenceForm)
    actionState.success = 'Notification preferences updated.'
    await refreshPreferences()
  }
  catch (error) {
    actionState.error = error instanceof Error ? error.message : 'Unable to update notification preferences.'
  }
  finally {
    actionState.savingPreferences = false
  }
}

function formatDateTime(value: string) {
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
              Alerts and notifications
            </h2>
            <p class="text-sm text-muted">
              In-app operator feed with unread tracking and partner notification preferences.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UBadge color="warning" variant="soft">
              {{ unreadCount }} unread
            </UBadge>
            <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="notificationsPending" @click="refreshNotifications()">
              Refresh
            </UButton>
            <UButton
              color="primary"
              variant="soft"
              :disabled="!unreadNotifications.length"
              :loading="actionState.markingRead"
              @click="markUnreadAsRead"
            >
              Mark unread as read
            </UButton>
          </div>
        </div>
      </template>

      <UAlert v-if="actionState.error" color="error" variant="soft" :title="actionState.error" />
      <UAlert v-else-if="actionState.success" color="success" variant="soft" :title="actionState.success" />

      <div class="mt-4 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div class="space-y-3">
          <UCard v-for="notification in notifications" :key="notification.id" :variant="notification.is_read ? 'subtle' : 'outline'">
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">
                    {{ notification.title }}
                  </p>
                  <p class="text-xs uppercase tracking-wide text-muted">
                    {{ notification.category }} • {{ notification.event_name }}
                  </p>
                </div>
                <UBadge :color="notification.is_read ? 'neutral' : 'warning'" variant="soft">
                  {{ notification.is_read ? 'Read' : 'Unread' }}
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ notification.body }}
              </p>
              <p class="text-xs text-muted">
                {{ formatDateTime(notification.created_at) }}
              </p>
            </div>
          </UCard>

          <EmptyState
            v-if="!notifications.length"
            title="No alerts yet"
            description="Operational alerts, booking status changes, and message notifications will appear here."
            icon="i-lucide-bell-ring"
          />
        </div>

        <UCard>
          <template #header>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-highlighted">
                Notification preferences
              </h3>
              <p class="text-sm text-muted">
                Preference-aware delivery stays server-owned; this page edits the same backend toggles.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <UCheckbox v-model="preferenceForm.push_enabled" label="Push enabled" />
              <UCheckbox v-model="preferenceForm.sms_enabled" label="SMS enabled" />
              <UCheckbox v-model="preferenceForm.email_enabled" label="Email enabled" />
              <UCheckbox v-model="preferenceForm.booking_enabled" label="Booking alerts" />
              <UCheckbox v-model="preferenceForm.messages_enabled" label="Message alerts" />
              <UCheckbox v-model="preferenceForm.marketing_enabled" label="Marketing alerts" />
            </div>

            <div class="space-y-2">
              <p class="text-sm font-medium text-highlighted">
                Locale
              </p>
              <USelect
                v-model="preferenceForm.locale"
                :items="[
                  { label: 'EN', value: 'en' },
                  { label: 'UR', value: 'ur' }
                ]"
                value-key="value"
                class="w-28"
              />
            </div>

            <UAlert
              color="neutral"
              variant="soft"
              title="System alerts remain mandatory"
              description="The backend keeps the locked system category semantics in place."
            />

            <div class="flex justify-end">
              <UButton color="primary" :loading="actionState.savingPreferences || preferencesPending" @click="savePreferences">
                Save preferences
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>
  </div>
</template>
