import type { AuthVerifyResult, NotificationPreference, OtpSendResult, UserProfile } from '~~/shared/types/domain'
import { useApi } from './useApi'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const api = useApi()
  const authStore = useAuthStore()

  const sendOtp = (payload: { email: string }) =>
    api.post<OtpSendResult>('/auth/otp/send', {
      body: {
        tab: 'email',
        email: payload.email,
      },
      defaultMessage: 'Unable to start sign-in.',
    })

  const verifyOtp = async (payload: { email: string, otp: string, full_name?: string }) => {
    const result = await api.post<AuthVerifyResult>('/auth/otp/verify', {
      body: {
        tab: 'email',
        email: payload.email,
        otp: payload.otp,
        full_name: payload.full_name,
      },
      defaultMessage: 'Unable to verify the sign-in code.',
    })

    if (result && result.access_token) {
      // Store in httpOnly cookie via server route
      try {
        await $fetch('/api/auth/token', {
          method: 'POST',
          body: { access_token: result.access_token },
        })
      }
      catch (e) {
        console.warn('Failed to set httpOnly token cookie:', e)
      }

      authStore.setAuth(result.user, result.access_token)
    }

    return result
  }

  const getMe = async () => {
    const profile = await api.get<UserProfile>('/me', {
      defaultMessage: 'Unable to load your profile.',
    })
    if (profile && authStore.accessToken) {
      authStore.setAuth(profile, authStore.accessToken)
    }
    return profile
  }

  const updateProfile = async (payload: {
    first_name?: string
    last_name?: string
    phone?: string
    locale?: 'en' | 'ur'
  }) => {
    const updated = await api.post<UserProfile>('/me/profile', {
      body: payload,
      defaultMessage: 'Unable to update your profile.',
    })
    if (updated) {
      authStore.updateUser(updated)
    }
    return updated
  }

  const getNotificationPreferences = () =>
    api.get<NotificationPreference>('/me/notification-preferences', {
      defaultMessage: 'Unable to load notification preferences.',
    })

  const updateNotificationPreferences = (payload: Partial<NotificationPreference>) =>
    api.patch<NotificationPreference>('/me/notification-preferences', {
      body: payload,
      defaultMessage: 'Unable to update notification preferences.',
    })

  const logout = async () => {
    try {
      await api.post<null>('/auth/logout', {
        defaultMessage: 'Unable to end your session.',
      })
    }
    catch {
      // Ignore network errors on logout
    }

    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    catch {
      // Ignore
    }

    authStore.clearAuth()
  }

  return {
    sendOtp,
    verifyOtp,
    getMe,
    updateProfile,
    getNotificationPreferences,
    updateNotificationPreferences,
    logout,
  }
}
