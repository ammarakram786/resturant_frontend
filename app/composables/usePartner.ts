import type { ApiPaginationMeta, ApiSuccessEnvelope } from '~~/shared/types/api'
import type {
  NotificationPreferences,
  NotificationRecord,
  OperatorBookingRecord,
  OperatorGuestProfile,
  PickupOrderRecord,
  PickupOrderStatus,
  PosConnectionRecord,
  PrivateEventCalendarItem,
  PrivateEventRecord,
  RestaurantAnalyticsOverview,
  RestaurantGuestSummary,
  RestaurantLayoutSnapshot,
  RestaurantSectionRecord,
  ThreadDetail,
  ThreadRecord,
} from '~~/shared/types/domain'
import { useApi } from './useApi'

type EnvelopeWithMeta<T> = ApiSuccessEnvelope<T, ApiPaginationMeta & Record<string, unknown>>

export function usePartner() {
  const api = useApi()

  const listBookings = async (status = '') => {
    const response = await api.requestEnvelope<OperatorBookingRecord[]>('/restaurant/bookings', {
      method: 'GET',
      query: status ? { status } : {},
      defaultMessage: 'Unable to load restaurant bookings.',
    }) as EnvelopeWithMeta<OperatorBookingRecord[]>
    return {
      items: response.data,
      meta: response.meta,
    }
  }

  const getBooking = (bookingId: number) =>
    api.get<OperatorBookingRecord>(`/restaurant/bookings/${bookingId}`, {
      defaultMessage: 'Unable to load this booking.',
    })

  const transitionBooking = (bookingId: number, action: string, body?: Record<string, unknown>) =>
    api.post<OperatorBookingRecord>(`/restaurant/bookings/${bookingId}/${action}`, {
      body,
      defaultMessage: 'Unable to update this booking.',
    })

  const getGuestProfile = (bookingId: number) =>
    api.get<OperatorGuestProfile>(`/restaurant/bookings/${bookingId}/guest-profile`, {
      defaultMessage: 'Unable to load guest profile.',
    })

  const listGuests = () =>
    api.get<RestaurantGuestSummary[]>('/restaurant/guests', {
      defaultMessage: 'Unable to load guest summaries.',
    })

  const getAnalyticsOverview = () =>
    api.get<RestaurantAnalyticsOverview>('/restaurant/analytics/overview', {
      defaultMessage: 'Unable to load analytics overview.',
    })

  const listThreads = async (status = 'open') => {
    const response = await api.requestEnvelope<ThreadRecord[]>('/restaurant/threads', {
      method: 'GET',
      query: { status },
      defaultMessage: 'Unable to load restaurant threads.',
    }) as EnvelopeWithMeta<ThreadRecord[]>
    return {
      items: response.data,
      meta: response.meta,
    }
  }

  const getThread = async (threadId: number) => {
    const response = await api.requestEnvelope<ThreadDetail>(`/restaurant/threads/${threadId}`, {
      method: 'GET',
      defaultMessage: 'Unable to load this thread.',
    }) as EnvelopeWithMeta<ThreadDetail>
    return {
      data: response.data,
      meta: response.meta,
    }
  }

  const createThread = (payload: { booking_id: number, initial_message: string }) =>
    api.post<ThreadRecord>('/restaurant/threads', {
      body: payload,
      defaultMessage: 'Unable to start the conversation.',
    })

  const sendThreadMessage = (threadId: number, payload: { body: string }) =>
    api.post(`/restaurant/threads/${threadId}/messages`, {
      body: payload,
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
      defaultMessage: 'Unable to send the message.',
    })

  const markThreadRead = (threadId: number) =>
    api.post(`/restaurant/threads/${threadId}/read`, {
      defaultMessage: 'Unable to mark the thread as read.',
    })

  const listNotifications = async () => {
    const response = await api.requestEnvelope<NotificationRecord[]>('/notifications', {
      method: 'GET',
      defaultMessage: 'Unable to load alerts.',
    }) as EnvelopeWithMeta<NotificationRecord[]>
    return {
      items: response.data,
      meta: response.meta,
    }
  }

  const getUnreadNotifications = () =>
    api.get<{ count: number }>('/notifications/unread-count', {
      defaultMessage: 'Unable to load unread alert count.',
    })

  const markNotificationsRead = (ids: number[]) =>
    api.post<{ updated: number }>('/notifications/read', {
      body: { ids },
      defaultMessage: 'Unable to mark alerts as read.',
    })

  const getNotificationPreferences = () =>
    api.get<NotificationPreferences>('/me/notification-preferences', {
      defaultMessage: 'Unable to load notification preferences.',
    })

  const updateNotificationPreferences = (payload: Partial<NotificationPreferences>) =>
    api.patch<NotificationPreferences>('/me/notification-preferences', {
      body: payload,
      defaultMessage: 'Unable to update notification preferences.',
    })

  const getPosConnection = () =>
    api.get<PosConnectionRecord>('/restaurant/pos-connection', {
      defaultMessage: 'Unable to load POS connection.',
    })

  const updatePosConnection = (payload: Record<string, unknown>) =>
    api.put<PosConnectionRecord>('/restaurant/pos-connection', {
      body: payload,
      defaultMessage: 'Unable to update POS connection.',
    })

  const listPickupOrders = async (status = '') => {
    const response = await api.requestEnvelope<PickupOrderRecord[]>('/restaurant/pickup-orders', {
      method: 'GET',
      query: status ? { status } : {},
      defaultMessage: 'Unable to load pickup orders.',
    }) as EnvelopeWithMeta<PickupOrderRecord[]>
    return {
      items: response.data,
      meta: response.meta,
    }
  }

  const updatePickupOrderStatus = (orderId: number, status: PickupOrderStatus) =>
    api.post<PickupOrderRecord>(`/restaurant/pickup-orders/${orderId}/status`, {
      body: { status },
      defaultMessage: 'Unable to update pickup order status.',
    })

  const listPrivateEvents = () =>
    api.get<PrivateEventRecord[]>('/restaurant/private-events', {
      defaultMessage: 'Unable to load private events.',
    })

  const getPrivateEvent = (eventId: number) =>
    api.get<PrivateEventRecord>(`/restaurant/private-events/${eventId}`, {
      defaultMessage: 'Unable to load this private event.',
    })

  const getPrivateEventCalendar = () =>
    api.get<PrivateEventCalendarItem[]>('/restaurant/private-events/calendar', {
      defaultMessage: 'Unable to load the private-event calendar.',
    })

  const quotePrivateEvent = (eventId: number, payload: { operator_notes?: string, lines: Array<Record<string, unknown>> }) =>
    api.post<PrivateEventRecord>(`/restaurant/private-events/${eventId}/quote`, {
      body: payload,
      defaultMessage: 'Unable to quote this private event.',
    })

  const confirmPrivateEvent = (eventId: number) =>
    api.post<PrivateEventRecord>(`/restaurant/private-events/${eventId}/confirm`, {
      defaultMessage: 'Unable to confirm this private event.',
    })

  const declinePrivateEvent = (eventId: number) =>
    api.post<PrivateEventRecord>(`/restaurant/private-events/${eventId}/decline`, {
      defaultMessage: 'Unable to decline this private event.',
    })

  const messagePrivateEvent = (eventId: number, message: string) =>
    api.post<PrivateEventRecord>(`/restaurant/private-events/${eventId}/message`, {
      body: { message },
      defaultMessage: 'Unable to send the private-event message.',
    })

  const listSections = () =>
    api.get<RestaurantLayoutSnapshot>('/restaurant/sections', {
      defaultMessage: 'Unable to load restaurant sections.',
    })

  const createSection = (payload: RestaurantSectionRecord) =>
    api.post<RestaurantSectionRecord>('/restaurant/sections', {
      body: payload,
      defaultMessage: 'Unable to create the section.',
    })

  const updateSection = (sectionKey: string, payload: Partial<RestaurantSectionRecord>) =>
    api.patch<RestaurantSectionRecord>(`/restaurant/sections/${sectionKey}`, {
      body: payload,
      defaultMessage: 'Unable to update the section.',
    })

  return {
    listBookings,
    getBooking,
    transitionBooking,
    getGuestProfile,
    listGuests,
    getAnalyticsOverview,
    listThreads,
    getThread,
    createThread,
    sendThreadMessage,
    markThreadRead,
    listNotifications,
    getUnreadNotifications,
    markNotificationsRead,
    getNotificationPreferences,
    updateNotificationPreferences,
    getPosConnection,
    updatePosConnection,
    listPickupOrders,
    updatePickupOrderStatus,
    listPrivateEvents,
    getPrivateEvent,
    getPrivateEventCalendar,
    quotePrivateEvent,
    confirmPrivateEvent,
    declinePrivateEvent,
    messagePrivateEvent,
    listSections,
    createSection,
    updateSection,
  }
}
