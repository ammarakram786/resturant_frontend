import type {
  AuthVerifyResult,
  DeviceTokenPayload,
  GoogleAuthPayload,
  NotificationPreference,
  OtpSendResult,
  UserProfile,
} from '~~/shared/types/domain'
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

  const resendOtp = (payload: { email: string }) =>
    api.post<OtpSendResult>('/auth/otp/resend', {
      body: {
        tab: 'email',
        email: payload.email,
      },
      defaultMessage: 'Unable to resend the sign-in code.',
    })

  const persistSession = async (result: AuthVerifyResult) => {
    if (result && result.access_token) {
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

  const verifyOtp = async (payload: { email: string, otp: string, full_name?: string }) =>
    persistSession(await api.post<AuthVerifyResult>('/auth/otp/verify', {
      body: {
        tab: 'email',
        email: payload.email,
        otp: payload.otp,
        full_name: payload.full_name,
      },
      defaultMessage: 'Unable to verify the sign-in code.',
    }))

  const googleAuth = async (payload: GoogleAuthPayload) =>
    persistSession(await api.post<AuthVerifyResult>('/auth/google', {
      body: payload,
      defaultMessage: 'Unable to sign in with Google.',
    }))

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

  const registerFcm = (payload: DeviceTokenPayload) =>
    api.post<{ token: string, platform: DevicePlatform, device_id: string }>('/auth/fcm', {
      body: payload,
      defaultMessage: 'Unable to register this device for push notifications.',
    })

  const unregisterFcm = (payload: { token: string }) =>
    api.delete<{ removed: number }>('/auth/fcm', {
      body: payload,
      defaultMessage: 'Unable to unregister this device.',
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
    resendOtp,
    verifyOtp,
    googleAuth,
    getMe,
    updateProfile,
    getNotificationPreferences,
    updateNotificationPreferences,
    registerFcm,
    unregisterFcm,
    logout,
  }
}
