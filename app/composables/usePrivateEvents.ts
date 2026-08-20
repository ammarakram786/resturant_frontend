import type { PrivateEventRecord } from '~~/shared/types/domain'
import { useApi } from './useApi'

export function usePrivateEvents() {
  const api = useApi()

  const listPrivateEvents = () =>
    api.get<PrivateEventRecord[]>('/me/private-events', {
      defaultMessage: 'Unable to load private events.',
    })

  const getPrivateEvent = (eventId: number | string) =>
    api.get<PrivateEventRecord>(`/me/private-events/${eventId}`, {
      defaultMessage: 'Unable to load this private event.',
    })

  const acceptPrivateEvent = (eventId: number) =>
    api.post<PrivateEventRecord>(`/me/private-events/${eventId}/accept`, {
      defaultMessage: 'Unable to accept this quote.',
    })

  const cancelPrivateEvent = (eventId: number) =>
    api.post<PrivateEventRecord>(`/me/private-events/${eventId}/cancel`, {
      defaultMessage: 'Unable to cancel this private event.',
    })

  return {
    listPrivateEvents,
    getPrivateEvent,
    acceptPrivateEvent,
    cancelPrivateEvent,
  }
}
