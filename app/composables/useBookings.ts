import type {
  BookingAttendanceStatus,
  BookingRecord,
  BookingStatus,
  WaitlistPromotionResult,
} from '~~/shared/types/domain'
import { useApi } from './useApi'

type CreateBookingPayload = {
  restaurant_id: number
  date: string
  time: string
  people: number
  duration?: number
  dining?: string
  dining_area?: string
  occasion?: string
  occasion_note?: string
  special_request?: string
  email?: string
  customer_name?: string
  phone?: string
  marketing_restaurant_email?: boolean
  marketing_platform_email?: boolean
  agree_texts?: boolean
  waitlist?: boolean
}

type ListBookingsQuery = {
  restaurant?: number
  status?: string
  search?: string
  ordering?: string
  page?: number
  per_page?: number
}

type InvitePayload = {
  user_id?: number
  email?: string
  phone?: string
  full_name?: string
  message?: string
}

type InviteByContactPayload = {
  full_name?: string
  email?: string
  phone?: string
  message?: string
}

export type BookingInviteResult = {
  booking_id: number
  booking_code: string
  recipient: {
    user_id?: number | null
    full_name?: string
    email?: string
    phone?: string
  }
  matched_customer: boolean
  message: string
}

export function useBookings() {
  const api = useApi()

  const listMyBookings = (status?: string) =>
    api.get<BookingRecord[]>('/me/bookings', {
      query: status ? { status } : {},
      defaultMessage: 'Unable to load your bookings.',
    })

  const listMyWaitlists = () =>
    api.get<BookingRecord[]>('/me/waitlists', {
      defaultMessage: 'Unable to load your waitlists.',
    })

  const listBookings = (query: ListBookingsQuery = {}) =>
    api.get<BookingRecord[]>('/bookings', {
      query: query as Record<string, string | number | boolean | undefined>,
      defaultMessage: 'Unable to load bookings.',
    })

  const createBooking = (payload: CreateBookingPayload) =>
    api.post<BookingRecord>('/bookings', {
      body: payload,
      defaultMessage: 'Unable to create your booking.',
    })

  const getBooking = (bookingId: number | string) =>
    api.get<BookingRecord>(`/bookings/${bookingId}`, {
      defaultMessage: 'Unable to load this booking.',
    })

  const updateBooking = (
    bookingId: number,
    payload: {
      date?: string
      time?: string
      people?: number
      dining_area?: string
      special_request?: string
      occasion?: string
      occasion_note?: string
    },
  ) =>
    api.patch<BookingRecord>(`/bookings/${bookingId}`, {
      body: payload,
      defaultMessage: 'Unable to update this booking.',
    })

  const replaceBooking = (bookingId: number, payload: CreateBookingPayload) =>
    api.put<BookingRecord>(`/bookings/${bookingId}`, {
      body: payload,
      defaultMessage: 'Unable to update this booking.',
    })

  const transitionBooking = (bookingId: number, status: BookingStatus) =>
    api.post<BookingRecord>(`/bookings/${bookingId}/transition`, {
      body: { status },
      defaultMessage: 'Unable to update this booking.',
    })

  const markAttendance = (bookingId: number, status: BookingAttendanceStatus) =>
    api.post<BookingRecord>(`/bookings/${bookingId}/attendance`, {
      body: { status },
      defaultMessage: 'Unable to record attendance for this booking.',
    })

  const cancelBooking = (bookingId: number) =>
    api.post<BookingRecord>(`/bookings/${bookingId}/cancel`, {
      body: {},
      defaultMessage: 'Unable to cancel this booking.',
    })

  const convertWaitlist = (bookingId: number) =>
    api.post<BookingRecord>(`/bookings/${bookingId}/waitlist-convert`, {
      body: {},
      defaultMessage: 'Unable to convert this waitlist entry.',
    })

  const promoteNextWaitlist = (bookingId: number) =>
    api.post<WaitlistPromotionResult>('/waitlist/promote', {
      body: { booking_id: bookingId },
      defaultMessage: 'Unable to promote this waitlist entry.',
    })

  const inviteGuest = (bookingId: number, payload: InvitePayload) =>
    api.post<BookingInviteResult>(`/bookings/${bookingId}/invite`, {
      body: payload,
      defaultMessage: 'Unable to send the invite.',
    })

  const inviteGuestByContact = (bookingId: number, payload: InviteByContactPayload) =>
    api.post<BookingInviteResult>(`/bookings/${bookingId}/invite-by-contact`, {
      body: payload,
      defaultMessage: 'Unable to send the invite.',
    })

  const submitReview = (bookingId: number, payload: { rating: number, comment?: string }) =>
    api.post<{ booking_id: number, rating: number, comment: string }>(`/bookings/${bookingId}/review`, {
      body: payload,
      defaultMessage: 'Unable to submit your review.',
    })

  return {
    listMyBookings,
    listMyWaitlists,
    listBookings,
    createBooking,
    getBooking,
    updateBooking,
    replaceBooking,
    transitionBooking,
    markAttendance,
    cancelBooking,
    convertWaitlist,
    promoteNextWaitlist,
    inviteGuest,
    inviteGuestByContact,
    submitReview,
  }
}
