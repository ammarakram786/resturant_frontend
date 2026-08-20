import type { BookingRecord } from '~~/shared/types/domain'
import { useApi } from './useApi'

type CreateBookingPayload = {
  restaurant_id: number
  date: string
  time: string
  people: number
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

export function useBookings() {
  const api = useApi()

  const listMyBookings = (status?: string) =>
    api.get<BookingRecord[]>('/me/bookings', {
      query: status ? { status } : {},
      defaultMessage: 'Unable to load your bookings.',
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

  const cancelBooking = (bookingId: number) =>
    api.post<BookingRecord>(`/bookings/${bookingId}/cancel`, {
      defaultMessage: 'Unable to cancel this booking.',
    })

  const convertWaitlist = (bookingId: number) =>
    api.post<BookingRecord>(`/bookings/${bookingId}/waitlist-convert`, {
      defaultMessage: 'Unable to convert this waitlist entry.',
    })

  const submitReview = (bookingId: number, payload: { rating: number, comment?: string }) =>
    api.post<{ booking_id: number, rating: number, comment: string }>(`/bookings/${bookingId}/review`, {
      body: payload,
      defaultMessage: 'Unable to submit your review.',
    })

  return {
    listMyBookings,
    createBooking,
    getBooking,
    updateBooking,
    cancelBooking,
    convertWaitlist,
    submitReview,
  }
}
