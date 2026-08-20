export type AdminMetricMap = {
  restaurants_total: number
  restaurants_pending_approval: number
  restaurants_kyc_pending: number
  support_open: number
  billing_overdue: number
  reconciliation_pending: number
  trust_adjustments_30d: number
  open_alerts: number
  groups_total: number
  active_bank_offers: number
  restaurant_offer_rules: number
  bookings_total: number
}

export type AdminEventRecord = {
  id: number
  aggregate_type: string
  aggregate_id: string
  event_name: string
  audience: Array<Record<string, unknown>>
  payload: Record<string, unknown>
  created_at: string
  published_at?: string | null
}

export type AdminOverview = {
  metrics: AdminMetricMap
  booking_statuses: Array<{ status: string, total: number }>
  latest_events: AdminEventRecord[]
  latest_alerts: Array<{
    id: number
    title: string
    kind: string
    severity: string
    status: string
    restaurant_id: number
    restaurant_name: string
    created_at: string
  }>
  latest_invoices: Array<{
    id: number
    invoice_number: string
    status: string
    restaurant_name: string
    total: string
    billing_period_end: string
  }>
}

export type AdminRestaurantSummary = {
  id: number
  slug: string
  name: string
  city?: string | null
  cuisine?: string | null
  status: string
  kyc: {
    status: string
    note?: string
    reviewed_at?: string | null
    reviewed_by?: string | null
    documents_count: number
  }
  group?: {
    id: number
    name: string
    role: string
    is_primary: boolean
  } | null
  booking_count: number
  offer_rules_count: number
  invoice_statuses: string[]
  latest_invoice_total?: string | null
  supports_private_events: boolean
}

export type AdminRestaurantDetail = {
  id: number
  slug: string
  name: string
  city?: string | null
  status: string
  description?: string | null
  cuisine?: string | null
  price_range?: string | null
  supports_private_events: boolean
  kyc: AdminRestaurantSummary['kyc']
  groups: Array<{
    id: number
    name: string
    role: string
    is_primary: boolean
  }>
  offer_rules: Array<{
    id: number
    title: string
    offer_type: string
    status: string
    created_at: string
  }>
  invoices: Array<{
    id: number
    invoice_number: string
    status: string
    total: string
    subtotal: string
    adjustments: string
    billing_period_start: string
    billing_period_end: string
  }>
  weekly_statements: Array<{
    id: number
    week_start: string
    week_end: string
    totals: Record<string, unknown>
  }>
  analytics_snapshots: Array<{
    id: number
    period: string
    snapshot_date: string
    metrics: Record<string, unknown>
  }>
  alerts: Array<{
    id: number
    kind: string
    severity: string
    status: string
    title: string
    payload: Record<string, unknown>
    created_at: string
  }>
}

export type AdminCustomerSummary = {
  id: number
  name: string
  masked_email: string
  masked_phone: string
  trust_score: number
  tier: string
  bookings_total: number
  recent_bookings: Array<{
    id: number
    code: string
    status: string
    restaurant_name: string
    starts_at: string
  }>
}

export type AdminTrustDetail = {
  customer: {
    id: number
    email?: string | null
    role?: string
    trust_score: number
    tier: string
  }
  adjustments: Array<{
    id: number
    delta: number
    reason: string
    resulting_score: number
    actor_email: string
    created_at: string
  }>
}

export type AdminPiiRevealResult = {
  customer: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
  }
}

export type AdminSupportThreadSummary = {
  id: number
  kind: string
  status: string
  restaurant_id?: number | null
  booking_id?: number | null
  customer_user_id: number
  inquiry_kind?: string | null
  last_message_at?: string | null
  unread_count: number
  subject?: string | null
  last_message_preview?: string
  customer?: {
    id: number
    first_name?: string | null
    last_name?: string | null
    masked_phone?: string | null
  }
  restaurant?: {
    id: number
    name: string
    logo_url?: string | null
  }
}

export type AdminSupportThreadDetail = {
  thread: AdminSupportThreadSummary
  messages: Array<{
    id: number
    thread_id: number
    sender_type: string
    sender_user_id?: number | null
    sender_name?: string | null
    body: string
    attachments: Array<Record<string, unknown>>
    via_concierge: boolean
    client_ref: string
    created_at: string
  }>
}

export type AdminSupportThreadPiiRevealResult = {
  thread_id: number
  customer: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
  }
}

export type AdminBillingOverview = {
  summary: {
    invoice_count: number
    overdue_count: number
    issued_count: number
    paid_count: number
    reconciliation_pending: number
    statement_count: number
    total_amount: string
    subtotal_amount: string
  }
  invoices: Array<{
    id: number
    invoice_number: string
    restaurant_id: number
    restaurant_name: string
    status: string
    billing_period_start: string
    billing_period_end: string
    subtotal: string
    adjustments: string
    total: string
    reconciliations_count: number
  }>
}
