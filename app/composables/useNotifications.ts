import type { NotificationRecord } from '~~/shared/types/domain'
import { useApi } from './useApi'

export function useNotifications() {
  const api = useApi()

  const listNotifications = () =>
    api.get<NotificationRecord[]>('/notifications', {
      defaultMessage: 'Unable to load notifications.',
    })

  const getUnreadCount = () =>
    api.get<{ count: number }>('/notifications/unread-count', {
      defaultMessage: 'Unable to load unread count.',
    })

  const markRead = (ids: number[]) =>
    api.post<{ updated: number }>('/notifications/read', {
      body: { ids },
      defaultMessage: 'Unable to mark notifications as read.',
    })

  return {
    listNotifications,
    getUnreadCount,
    markRead,
  }
}
