import type { SurfaceKind } from '../types/domain'

export type SurfaceNavLink = {
  label: string
  icon: string
  to: string
  description?: string
}

export type SurfaceConfig = {
  kind: SurfaceKind
  title: string
  shortTitle: string
  description: string
  homePath: string
  accent: 'primary' | 'secondary' | 'warning' | 'error' | 'neutral'
  nav: SurfaceNavLink[]
}

export const surfaceConfigs: Record<SurfaceKind, SurfaceConfig> = {
  customer: {
    kind: 'customer',
    title: 'Customer Experience',
    shortTitle: 'Customer',
    description: 'Discovery, availability, bookings, rewards, and profile journeys.',
    homePath: '/discover',
    accent: 'primary',
    nav: [
      { label: 'Overview', icon: 'i-lucide-house', to: '/discover' },
      { label: 'Restaurants', icon: 'i-lucide-store', to: '/restaurants' },
      { label: 'Bookings', icon: 'i-lucide-calendar-check-2', to: '/bookings' },
      { label: 'Inbox', icon: 'i-lucide-messages-square', to: '/inbox' },
      { label: 'Notifications', icon: 'i-lucide-bell', to: '/notifications' },
      { label: 'Rewards', icon: 'i-lucide-gift', to: '/rewards' },
      { label: 'Private events', icon: 'i-lucide-party-popper', to: '/private-events' },
      { label: 'Pickup', icon: 'i-lucide-shopping-bag', to: '/pickup' },
      { label: 'Profile', icon: 'i-lucide-user-round', to: '/profile' },
    ],
  },
  partner: {
    kind: 'partner',
    title: 'Partner Operations',
    shortTitle: 'Partner',
    description: 'Operator-facing booking boards, waitlist actions, and venue operations.',
    homePath: '/partner',
    accent: 'warning',
    nav: [
      { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/partner' },
      { label: 'Bookings', icon: 'i-lucide-calendar-range', to: '/partner/bookings' },
      { label: 'Waitlist', icon: 'i-lucide-list-ordered', to: '/partner/waitlist' },
      { label: 'Messages', icon: 'i-lucide-messages-square', to: '/partner/messages' },
      { label: 'Alerts', icon: 'i-lucide-bell-ring', to: '/partner/alerts' },
      { label: 'Operations', icon: 'i-lucide-store', to: '/partner/operations' },
      { label: 'Private Events', icon: 'i-lucide-party-popper', to: '/partner/private-events' },
    ],
  },
  admin: {
    kind: 'admin',
    title: 'Admin Oversight',
    shortTitle: 'Admin',
    description: 'Approvals, support, analytics, auditing, and platform governance.',
    homePath: '/admin',
    accent: 'error',
    nav: [
      { label: 'Overview', icon: 'i-lucide-shield', to: '/admin' },
      { label: 'Restaurants', icon: 'i-lucide-store', to: '/admin/restaurants' },
      { label: 'Trust', icon: 'i-lucide-badge-check', to: '/admin/trust' },
      { label: 'Support', icon: 'i-lucide-life-buoy', to: '/admin/support' },
      { label: 'Billing', icon: 'i-lucide-receipt', to: '/admin/billing' },
      { label: 'Audit', icon: 'i-lucide-scroll-text', to: '/admin/audit' },
    ],
  },
  hub: {
    kind: 'hub',
    title: 'Hub Platform Ops',
    shortTitle: 'Hub',
    description: 'Multi-tenant management, RBAC, platform modules, invoicing, and audit trails.',
    homePath: '/hub',
    accent: 'secondary',
    nav: [
      { label: 'Overview', icon: 'i-lucide-building-2', to: '/hub' },
      { label: 'Tenants', icon: 'i-lucide-store', to: '/hub/tenants' },
      { label: 'Users', icon: 'i-lucide-users-round', to: '/hub/users' },
      { label: 'Roles', icon: 'i-lucide-key-round', to: '/hub/roles' },
      { label: 'Modules', icon: 'i-lucide-blocks', to: '/hub/modules' },
      { label: 'Billing', icon: 'i-lucide-receipt-text', to: '/hub/billing' },
      { label: 'Audit Logs', icon: 'i-lucide-history', to: '/hub/audit-logs' },
    ],
  },
}

export const surfacePathPrefixes: Record<SurfaceKind, string> = {
  customer: '/',
  partner: '/partner',
  admin: '/admin',
  hub: '/hub',
}

export const portalSwitcherSurfaces: Array<{ kind: SurfaceKind, label: string, path: string }> = [
  { kind: 'customer', label: 'Customer', path: '/discover' },
  { kind: 'partner', label: 'Partner', path: '/partner' },
  { kind: 'admin', label: 'Admin', path: '/admin' },
  { kind: 'hub', label: 'Hub', path: '/hub' },
]
