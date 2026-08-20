import { defineStore } from 'pinia'
import type { UserProfile, UserSummary } from '~~/shared/types/domain'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<UserProfile | UserSummary | null>(null)
    const accessToken = ref<string | null>(null)

    const isAuthenticated = computed(() => Boolean(accessToken.value || user.value))
    const userRole = computed(() => user.value?.role || 'customer')
    const isAdmin = computed(() => userRole.value === 'admin')
    const isPartner = computed(() => ['owner', 'restaurant', 'manager', 'staff', 'cashier', 'waiter'].includes(userRole.value))

    function setAuth(newUser: UserProfile | UserSummary, token: string) {
      user.value = newUser
      accessToken.value = token
    }

    function updateUser(updatedUser: Partial<UserProfile>) {
      if (user.value) {
        user.value = { ...user.value, ...updatedUser } as UserProfile
      }
    }

    function clearAuth() {
      user.value = null
      accessToken.value = null
    }

    return {
      user,
      accessToken,
      isAuthenticated,
      userRole,
      isAdmin,
      isPartner,
      setAuth,
      updateUser,
      clearAuth,
    }
  },
  {
    persist: {
      pick: ['accessToken', 'user'],
    },
  },
)
