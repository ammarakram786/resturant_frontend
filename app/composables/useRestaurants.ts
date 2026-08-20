import type {
  PrivateEventRecord,
  RestaurantAvailability,
  RestaurantDetail,
  RestaurantMenu,
  RestaurantSection,
  RestaurantSummary,
} from '~~/shared/types/domain'
import { useApi } from './useApi'

type RestaurantQuery = {
  date?: string
  time?: string
  guests?: number
  people?: number
  dining?: string
  q?: string
}

export function useRestaurants() {
  const api = useApi()

  const listRestaurants = (query: RestaurantQuery = {}) =>
    api.get<RestaurantSummary[]>('/restaurants', {
      query,
      defaultMessage: 'Unable to load restaurants.',
    })

  const getRestaurant = (id: number | string, query: RestaurantQuery = {}) =>
    api.get<RestaurantDetail>(`/restaurants/${id}`, {
      query,
      defaultMessage: 'Unable to load this restaurant.',
    })

  const getAvailability = (id: number | string, query: RestaurantQuery = {}) =>
    api.get<RestaurantAvailability>(`/restaurants/${id}/availability`, {
      query,
      defaultMessage: 'Unable to load availability.',
    })

  const getMenus = (id: number | string) =>
    api.get<RestaurantMenu[]>(`/restaurants/${id}/menus`, {
      defaultMessage: 'Unable to load the menu.',
    })

  const getSections = (id: number | string) =>
    api.get<RestaurantSection[]>(`/restaurants/${id}/sections`, {
      defaultMessage: 'Unable to load restaurant sections.',
    })

  const createPrivateEvent = (
    restaurantId: number | string,
    payload: {
      event_type?: string
      guest_count: number
      requested_starts_at: string
      requested_ends_at: string
      section_key?: string
      customer_name?: string
      contact_phone?: string
      notes?: string
    },
  ) =>
    api.post<PrivateEventRecord>(`/restaurants/${restaurantId}/private-events`, {
      body: payload,
      defaultMessage: 'Unable to submit the private event enquiry.',
    })

  return {
    listRestaurants,
    getRestaurant,
    getAvailability,
    getMenus,
    getSections,
    createPrivateEvent,
  }
}
