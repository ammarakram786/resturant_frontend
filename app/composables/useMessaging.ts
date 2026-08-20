import type { MessageRecord, ThreadDetail, ThreadRecord } from '~~/shared/types/domain'
import { useApi } from './useApi'

export function useMessaging() {
  const api = useApi()

  const listThreads = (query: { status?: string } = {}) =>
    api.get<ThreadRecord[]>('/me/threads', {
      query,
      defaultMessage: 'Unable to load your inbox.',
    })

  const createThread = (payload: {
    kind: 'support' | 'booking' | 'direct'
    restaurant_id?: number
    booking_id?: number
    inquiry_kind?: string
  }) =>
    api.post<ThreadRecord>('/me/threads', {
      body: payload,
      defaultMessage: 'Unable to create a conversation.',
    })

  const getThread = (threadId: number | string) =>
    api.get<ThreadDetail>(`/me/threads/${threadId}`, {
      defaultMessage: 'Unable to load this conversation.',
    })

  const sendMessage = (
    threadId: number,
    payload: {
      body?: string
      attachments?: Array<Record<string, unknown>>
      via_concierge?: boolean
    },
  ) =>
    api.post<MessageRecord>(`/me/threads/${threadId}/messages`, {
      body: payload,
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
      defaultMessage: 'Unable to send your message.',
    })

  const markThreadRead = (threadId: number) =>
    api.post<{ thread_id: number, unread_count: number }>(`/me/threads/${threadId}/read`, {
      defaultMessage: 'Unable to mark this conversation as read.',
    })

  const escalateConcierge = (payload: { ai_session_id?: string, restaurant_id?: number }) =>
    api.post<ThreadRecord>('/me/concierge/escalate', {
      body: payload,
      defaultMessage: 'Unable to escalate to concierge.',
    })

  return {
    listThreads,
    createThread,
    getThread,
    sendMessage,
    markThreadRead,
    escalateConcierge,
  }
}
