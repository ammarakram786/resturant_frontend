import type { ApiHealthcheck, ApiStatus } from '~~/shared/types/domain'
import { useApi } from './useApi'

export function useSystemStatus() {
  const api = useApi()

  const getStatus = () =>
    api.get<ApiStatus>('/status', {
      defaultMessage: 'Unable to load platform status.',
    })

  const getHealth = () =>
    api.get<ApiHealthcheck>('/health', {
      defaultMessage: 'Unable to reach the API health check.',
    })

  return {
    getStatus,
    getHealth,
  }
}
