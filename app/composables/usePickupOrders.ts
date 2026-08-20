import type { PickupOrderRecord } from '~~/shared/types/domain'
import { useApi } from './useApi'

export function usePickupOrders() {
  const api = useApi()

  const createPickupOrder = (
    restaurantId: number,
    payload: {
      scheduled_for?: string
      notes?: string
      items: Array<{
        name: string
        quantity: number
        unit_price: string | number
        options?: Array<Record<string, unknown>>
        external_item_id?: string
      }>
    },
  ) =>
    api.post<PickupOrderRecord>(`/restaurants/${restaurantId}/pickup-orders`, {
      body: payload,
      defaultMessage: 'Unable to place the pickup order.',
    })

  const listPickupOrders = () =>
    api.get<PickupOrderRecord[]>('/me/pickup-orders', {
      defaultMessage: 'Unable to load pickup history.',
    })

  const getPickupOrder = (orderId: number | string) =>
    api.get<PickupOrderRecord>(`/me/pickup-orders/${orderId}`, {
      defaultMessage: 'Unable to load this pickup order.',
    })

  return {
    createPickupOrder,
    listPickupOrders,
    getPickupOrder,
  }
}
