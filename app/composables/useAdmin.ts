import type {
  AdminBillingOverview,
  AdminCustomerSummary,
  AdminEventRecord,
  AdminOverview,
  AdminPiiRevealResult,
  AdminRestaurantDetail,
  AdminRestaurantSummary,
  AdminSupportThreadDetail,
  AdminSupportThreadPiiRevealResult,
  AdminSupportThreadSummary,
  AdminTrustDetail,
} from '~~/shared/types/admin'
import { useApi } from './useApi'

export function useAdmin() {
  const api = useApi()

  return {
    getOverview: () =>
      api.get<AdminOverview>('/admin/overview', {
        defaultMessage: 'Unable to load the admin overview.',
      }),
    getRestaurants: (query?: Record<string, string | number | boolean | undefined>) =>
      api.get<AdminRestaurantSummary[]>('/admin/restaurants', {
        query,
        defaultMessage: 'Unable to load admin restaurants.',
      }),
    getRestaurant: (restaurantId: number) =>
      api.get<AdminRestaurantDetail>(`/admin/restaurants/${restaurantId}`, {
        defaultMessage: 'Unable to load the restaurant oversight view.',
      }),
    reviewRestaurant: (restaurantId: number, body: Record<string, unknown>) =>
      api.patch<AdminRestaurantDetail>(`/admin/restaurants/${restaurantId}`, {
        body,
        defaultMessage: 'Unable to update the restaurant review.',
      }),
    getCustomers: (query?: Record<string, string | number | boolean | undefined>) =>
      api.get<AdminCustomerSummary[]>('/admin/customers', {
        query,
        defaultMessage: 'Unable to load customers.',
      }),
    getCustomerTrust: (customerId: number) =>
      api.get<AdminTrustDetail>(`/admin/customers/${customerId}/trust`, {
        defaultMessage: 'Unable to load customer trust.',
      }),
    adjustCustomerTrust: (customerId: number, body: { delta: number, reason: string }) =>
      api.post<{
        customer: AdminTrustDetail['customer']
        adjustment: AdminTrustDetail['adjustments'][number]
      }>(`/admin/customers/${customerId}/trust-adjust`, {
        body,
        defaultMessage: 'Unable to adjust customer trust.',
      }),
    revealCustomerPii: (customerId: number, body: { reason: string }) =>
      api.post<AdminPiiRevealResult>(`/admin/customers/${customerId}/reveal-pii`, {
        body,
        defaultMessage: 'Unable to reveal customer contact details.',
      }),
    getSupportThreads: (query?: Record<string, string | number | boolean | undefined>) =>
      api.get<AdminSupportThreadSummary[]>('/admin/support/threads', {
        query,
        defaultMessage: 'Unable to load support threads.',
      }),
    getSupportThread: (threadId: number) =>
      api.get<AdminSupportThreadDetail>(`/admin/support/threads/${threadId}`, {
        defaultMessage: 'Unable to load the support thread.',
      }),
    replyToSupportThread: (threadId: number, body: { body: string, close_thread?: boolean }) =>
      api.post<AdminSupportThreadDetail>(`/admin/support/threads/${threadId}`, {
        body,
        defaultMessage: 'Unable to send the support reply.',
      }),
    revealSupportThreadPii: (threadId: number, body: { reason: string }) =>
      api.put<AdminSupportThreadPiiRevealResult>(`/admin/support/threads/${threadId}/reveal-pii`, {
        body,
        defaultMessage: 'Unable to reveal support-thread contact details.',
      }),
    getBilling: (query?: Record<string, string | number | boolean | undefined>) =>
      api.get<AdminBillingOverview>('/admin/billing', {
        query,
        defaultMessage: 'Unable to load billing visibility.',
      }),
    getAuditEvents: (query?: Record<string, string | number | boolean | undefined>) =>
      api.get<AdminEventRecord[]>('/admin/audit/events', {
        query,
        defaultMessage: 'Unable to load audit visibility.',
      }),
  }
}
