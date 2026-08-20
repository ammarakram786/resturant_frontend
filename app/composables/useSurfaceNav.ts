import type { NavigationMenuItem } from '@nuxt/ui'
import { surfaceConfigs } from '~~/shared/config/surfaces'
import type { BookingStatusDescriptor, SurfaceKind } from '~~/shared/types/domain'

const bookingStatuses: BookingStatusDescriptor[] = [
  { value: 'pending', label: 'Pending', tone: 'warning', terminal: false },
  { value: 'confirmed', label: 'Confirmed', tone: 'primary', terminal: false },
  { value: 'modification_pending', label: 'Modification pending', tone: 'warning', terminal: false },
  { value: 'waitlisted', label: 'Waitlisted', tone: 'neutral', terminal: false },
  { value: 'table_ready', label: 'Table ready', tone: 'primary', terminal: false },
  { value: 'arrived', label: 'Arrived', tone: 'primary', terminal: false },
  { value: 'seated', label: 'Seated', tone: 'success', terminal: false },
  { value: 'completed', label: 'Completed', tone: 'success', terminal: true },
  { value: 'cancelled', label: 'Cancelled', tone: 'error', terminal: true },
  { value: 'no_show', label: 'No show', tone: 'error', terminal: true },
]

export function useSurfaceNav(surface: SurfaceKind) {
  const config = computed(() => surfaceConfigs[surface])
  const items = computed<NavigationMenuItem[][]>(() => [
    config.value.nav.map((link): NavigationMenuItem => ({
      label: link.label,
      icon: link.icon,
      to: link.to,
    })),
  ])

  return {
    config,
    items,
    bookingStatuses,
  }
}
