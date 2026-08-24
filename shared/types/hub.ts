export type TenantStatus = 'draft' | 'pending_approval' | 'active' | 'suspended'

export type HubRoleTypeScope = 'system' | 'chain' | 'restaurant' | 'guest'

export type HubBillingStatus = 'draft' | 'issued' | 'paid' | 'overdue'

export type HubTenant = {
  id: number
  name: string
  slug: string
  status: TenantStatus
  city?: string
  cuisine?: string
  price_range?: string
  supports_private_events: boolean
  booking_count: number
  created_at: string
  updated_at: string
}

export type HubTenantPayload = {
  name: string
  slug: string
  status?: TenantStatus
  city?: string
  cuisine?: string
  price_range?: string
  supports_private_events?: boolean
}

export type HubUser = {
  id: number
  username: string
  email?: string
  first_name?: string
  last_name?: string
  full_name: string
  phone?: string
  role?: string
  is_phone_verified: boolean
  trust_score?: number
  primary_restaurant?: number | null
  created_at: string
  updated_at: string
}

export type HubUserPayload = {
  username: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
  is_phone_verified?: boolean
  trust_score?: number
  primary_restaurant?: number | null
}

export type HubRole = {
  id: number
  name: string
  code: string
  role_type?: HubRoleTypeScope
  description?: string
  permissions?: unknown[]
  is_active: boolean
  created_at: string
}

export type HubRolePayload = {
  name: string
  code: string
  role_type?: HubRoleTypeScope
  description?: string
  permissions?: string[]
  is_active?: boolean
}

export type HubModule = {
  id: number
  name: string
  slug: string
  description?: string
  is_active: boolean
  created_at: string
}

export type HubModulePayload = {
  name: string
  slug: string
  description?: string
  is_active?: boolean
}

export type HubInvoice = {
  id: number
  invoice_number: string
  restaurant: number
  restaurant_name: string
  status?: HubBillingStatus
  billing_period_start: string
  billing_period_end: string
  subtotal?: string
  adjustments?: string
  total?: string
  created_at: string
}

export type HubInvoicePayload = {
  invoice_number: string
  restaurant: number
  status?: HubBillingStatus
  billing_period_start: string
  billing_period_end: string
  subtotal?: string
  adjustments?: string
  total?: string
}

export type HubAuditEvent = {
  id: number
  action: string
  actor_id?: number | null
  actor_email?: string
  module_name?: string
  resource_type?: string
  resource_id?: string
  ip_address?: string | null
  payload?: Record<string, unknown>
  created_at: string
}

export type HubAuditEventPayload = {
  action: string
  actor_id?: number | null
  actor_email?: string
  module_name?: string
  resource_type?: string
  resource_id?: string
  ip_address?: string
  payload?: Record<string, unknown>
}
