import type { UserProfile } from '~~/shared/types/domain'
import { ApiClientError } from '~~/shared/types/api'
import { useAuth } from './useAuth'

export async function useCustomerSession(key = 'customer-session') {
  const auth = useAuth()

  return await useAsyncData<UserProfile | null>(key, async () => {
    try {
      return await auth.getMe()
    }
    catch (error) {
      if (error instanceof ApiClientError && error.code === 'UNAUTHENTICATED') {
        return null
      }

      throw error
    }
  })
}
