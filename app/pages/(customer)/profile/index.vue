<script setup lang="ts">
import type { NotificationPreference } from '~~/shared/types/domain'
import { useAuth } from '../../../composables/useAuth'
import { useCustomerSession } from '../../../composables/useCustomerSession'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Profile',
  description: 'Account, locale, trust, and notification preferences.',
})

const auth = useAuth()
const { data: profile, refresh: refreshProfile } = await useCustomerSession('customer-profile')
const profileForm = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  locale: 'en' as 'en' | 'ur',
})
const preferencesForm = reactive<NotificationPreference>({
  push_enabled: true,
  sms_enabled: true,
  email_enabled: true,
  booking_enabled: true,
  messages_enabled: true,
  marketing_enabled: false,
  system_enabled: true,
  locale: 'en',
})
const state = reactive({
  savingProfile: false,
  savingPreferences: false,
  success: '',
  error: '',
})

watchEffect(() => {
  if (!profile.value) {
    return
  }

  const [firstName = '', ...rest] = profile.value.name.split(' ')
  profileForm.first_name = firstName
  profileForm.last_name = rest.join(' ')
  profileForm.phone = profile.value.phone ?? ''
  profileForm.locale = profile.value.profile?.locale ?? 'en'
})

const { data: preferences, refresh: refreshPreferences } = await useAsyncData<NotificationPreference | null>(
  'customer-notification-preferences',
  async () => {
    if (!profile.value) {
      return null
    }

    const response = await auth.getNotificationPreferences()
    Object.assign(preferencesForm, response)
    return response
  },
)

async function saveProfile() {
  state.success = ''
  state.error = ''
  state.savingProfile = true
  try {
    await auth.updateProfile(profileForm)
    await refreshProfile()
    state.success = 'Profile updated.'
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to update profile.'
  }
  finally {
    state.savingProfile = false
  }
}

async function savePreferences() {
  state.success = ''
  state.error = ''
  state.savingPreferences = true
  try {
    await auth.updateNotificationPreferences(preferencesForm)
    await refreshPreferences()
    state.success = 'Notification preferences updated.'
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to update notification preferences.'
  }
  finally {
    state.savingPreferences = false
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
      description="Use Discover to authenticate before editing your profile."
    />

    <div v-else class="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <UCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-highlighted">Account profile</h1>
            <p class="text-sm text-muted">
              Update your personal details and locale using the canonical `POST /me/profile` contract.
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UInput v-model="profileForm.first_name" placeholder="First name" />
          <UInput v-model="profileForm.last_name" placeholder="Last name" />
          <UInput v-model="profileForm.phone" placeholder="Phone number" />
          <USelect
            v-model="profileForm.locale"
            :items="[
              { label: 'English', value: 'en' },
              { label: 'Urdu', value: 'ur' }
            ]"
            value-key="value"
          />
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <UButton icon="i-lucide-save" :loading="state.savingProfile" @click="saveProfile">
            Save profile
          </UButton>
          <span class="text-sm text-muted">{{ profile.email }}</span>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-highlighted">Trust and session snapshot</h2>
            <p class="text-sm text-muted">
              `GET /me` remains the customer-facing source of truth for trust, locale, and push registration.
            </p>
          </div>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <UCard variant="subtle">
            <p class="text-sm text-muted">Trust score</p>
            <p class="mt-1 text-2xl font-semibold text-highlighted">{{ profile.trust?.score ?? 0 }}</p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-sm text-muted">Trust tier</p>
            <p class="mt-1 text-2xl font-semibold text-highlighted">{{ profile.trust?.tier ?? 'standard' }}</p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-sm text-muted">Push registered</p>
            <p class="mt-1 font-medium text-highlighted">{{ profile.push_device_registered ? 'Yes' : 'No' }}</p>
          </UCard>
          <UCard variant="subtle">
            <p class="text-sm text-muted">Phone verified</p>
            <p class="mt-1 font-medium text-highlighted">{{ profile.profile?.is_phone_verified ? 'Yes' : 'No' }}</p>
          </UCard>
        </div>
      </UCard>
    </div>

    <UCard v-if="profile && preferences">
      <template #header>
        <div class="space-y-1">
          <h2 class="text-xl font-semibold text-highlighted">Notification preferences</h2>
          <p class="text-sm text-muted">
            Category toggles stay server-owned, including the locked system category semantics.
          </p>
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCheckbox v-model="preferencesForm.push_enabled" label="Push notifications" />
        <UCheckbox v-model="preferencesForm.sms_enabled" label="SMS updates" />
        <UCheckbox v-model="preferencesForm.email_enabled" label="Email updates" />
        <UCheckbox v-model="preferencesForm.booking_enabled" label="Booking notifications" />
        <UCheckbox v-model="preferencesForm.messages_enabled" label="Message notifications" />
        <UCheckbox v-model="preferencesForm.marketing_enabled" label="Marketing notifications" />
        <UCheckbox :model-value="preferencesForm.system_enabled" disabled label="System notifications" />
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <UButton icon="i-lucide-bell-ring" :loading="state.savingPreferences" @click="savePreferences">
          Save preferences
        </UButton>
        <span class="text-sm text-muted">Locale for notifications: {{ preferencesForm.locale }}</span>
      </div>
    </UCard>

    <UAlert v-if="state.success" color="success" variant="soft" :title="state.success" />
    <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />
  </div>
</template>
