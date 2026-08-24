export type AppLocale = 'en' | 'ur'

export type SurfaceKind = 'customer' | 'partner' | 'admin' | 'hub'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'modification_pending'
  | 'waitlisted'
  | 'table_ready'
  | 'arrived'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type BookingStatusTone =
  | 'neutral'
  | 'primary'
  | 'warning'
  | 'success'
  | 'error'

export type BookingStatusDescriptor = {
  value: BookingStatus
  label: string
  tone: BookingStatusTone
  terminal: boolean
}

export type RestaurantSummary = {
  id: number
  slug: string
  name: string
  description?: string | null
  cuisine?: string | null
  dining_type?: string | null
  price_range?: string | null
  image_url?: string | null
  photos?: string[]
  address?: string | null
  city?: string | null
  rating?: number | null
  reviews_count?: number
  availability?: RestaurantAvailability | null
}

export type RestaurantAvailability = {
  available: boolean
  waitlist_available: boolean
  status: string
  display_mode: string
  message?: string | null
  waitlist_message?: string | null
  waitlist_cta?: string | null
  policy?: Record<string, unknown> | null
  filters: {
    date?: string
    time?: string
    guests?: number
    dining?: string
  }
  slots: Array<{
    time: string
    available: boolean
  }>
  assignment?: {
    section_key?: string | null
    section_name?: string | null
    floor_name?: string | null
    table_numbers?: string[]
  } | null
  sections?: Array<{
    key: string
    name: string
    floor_name?: string | null
    available_tables?: number
    next_available_at?: string | null
  }>
  available_times: string[]
  waitlist_times: string[]
}

export type RestaurantDetail = RestaurantSummary & {
  additional_information: Record<string, unknown>
  facilities: string[]
  schedule: Array<Record<string, unknown>>
  menus?: RestaurantMenu[]
  sections?: RestaurantSection[]
}

export type RestaurantMenu = {
  id?: string | number
  name?: string
  title?: string
  slug?: string
  description?: string
  categories?: RestaurantMenuCategory[]
  items?: RestaurantMenuItem[]
}

export type RestaurantMenuCategory = {
  id?: string | number
  name?: string
  title?: string
  description?: string
  items?: RestaurantMenuItem[]
}

export type RestaurantMenuItem = {
  id?: string | number
  name: string
  description?: string
  price?: string | number
  image_url?: string
  vegetarian?: boolean
  spicy?: boolean
  available?: boolean
  options?: Array<Record<string, unknown>>
}

export type RestaurantSection = {
  key: string
  name: string
  capacity?: number
  private_event_enabled?: boolean
}

export type BookingRecord = {
  id: number
  code: string
  status: BookingStatus
  confirmed_at?: string | null
  starts_at: string
  ends_at: string
  people: number
  dining_area?: string
  restaurant: {
    id: number
    name: string
    slug: string
    city?: string | null
  }
  user: UserSummary
  waitlist: {
    enabled: boolean
    queue_position?: number | null
    estimated_wait_minutes?: number | null
  }
  special_request?: string
  occasion?: string
  occasion_note?: string
  customer_name?: string
  contact_email?: string
  contact_phone?: string
  review_requested_at?: string | null
  reviewed_at?: string | null
}

export type UserSummary = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  role?: string
  avatar_url?: string | null
  wallet_balance?: number
  referral_code?: string | null
  restaurant_id?: number | null
  created_at?: string
}

export type UserProfile = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  role?: string
  created_at?: string
  country_code?: string
  push_device_registered?: boolean
  profile?: {
    locale?: AppLocale
    is_phone_verified?: boolean
    restaurant_id?: number | null
  }
  trust?: {
    score: number
    tier: string
  }
}

export type OtpSendResult = {
  tab: string
  id: string
  expires_at: number
  resend_at: number
  ttl_seconds: number
  resend_cooldown: number
}

export type AuthVerifyResult = {
  user: UserSummary
  access_token: string
  token_type: string
  is_customer_have_subscription: boolean
  is_new_user: boolean
}

export type OperatorCustomerSummary = {
  id: number
  name: string
  masked_email?: string
  masked_phone?: string
  trust_score?: number
  role?: string
}

export type OperatorBookingRecord = {
  id: number
  code: string
  status: BookingStatus
  confirmed_at?: string | null
  starts_at: string
  ends_at: string
  people: number
  dining_area?: string
  occasion?: string
  occasion_note?: string
  restaurant: BookingRecord['restaurant']
  customer: OperatorCustomerSummary
  waitlist: BookingRecord['waitlist']
  modification_request?: PendingModificationRequest | null
  special_request?: string
  customer_name?: string
  contact_email_masked?: string
  contact_phone_masked?: string
  review_requested_at?: string | null
  reviewed_at?: string | null
}

export type PendingModificationRequest = {
  id: number
  status: 'pending' | 'approved' | 'rejected'
  original_payload: Record<string, unknown>
  requested_payload: Record<string, unknown>
  decision_note?: string
  requested_by_id: number
  created_at: string
}

export type ModificationDecisionResponse = {
  modification: PendingModificationRequest & { booking_id: number, acted_by_id?: number | null, acted_at?: string | null }
  booking: {
    id: number
    status: BookingStatus
    starts_at: string
    ends_at: string
    people: number
    dining_area?: string | null
    special_request?: string
    occasion?: string
    occasion_note?: string
  }
}

export type WaitlistPromotionResult = {
  booking_id: number
  status: BookingStatus
}

export type OperatorGuestProfile = {
  booking_id: number
  customer: {
    id: number
    name: string
    email_masked: string
    phone_masked: string
    trust: {
      score: number
      tier: string
    }
  }
}

export type RestaurantGuestSummary = {
  user_id: number
  name: string
  visits: number
  last_status: BookingStatus
  trust_score: number
}

export type RestaurantAnalyticsOverview = {
  bookings_total: number
  by_status: Array<{
    status: string
    total: number
  }>
  pending_modifications: number
}

export type MessageRecord = {
  id: number
  thread_id: number
  sender_type: 'customer' | 'restaurant' | 'ai' | 'system'
  sender_user_id?: number | null
  sender_name?: string | null
  body: string
  attachments: Array<Record<string, unknown>>
  via_concierge: boolean
  client_ref?: string
  created_at: string
}

export type ThreadRecord = {
  id: number
  kind: 'support' | 'booking' | 'direct'
  status: 'open' | 'closed'
  restaurant_id?: number | null
  booking_id?: number | null
  customer_user_id: number
  inquiry_kind?: string
  last_message_at?: string | null
  unread_count: number
  last_message?: MessageRecord | null
  restaurant?: {
    id: number
    name: string
    logo_url?: string | null
  }
  customer?: {
    id: number
    first_name?: string | null
    last_name?: string | null
    salutation?: string | null
    masked_phone?: string
  }
}

export type ThreadDetail = {
  thread: ThreadRecord
  messages: MessageRecord[]
}

export type NotificationRecord = {
  id: number
  category: 'booking' | 'message' | 'marketing' | 'system'
  event_name: string
  title: string
  body: string
  payload: Record<string, unknown>
  status: string
  read_at?: string | null
  is_read: boolean
  created_at: string
}

export type NotificationPreferences = {
  push_enabled: boolean
  sms_enabled: boolean
  email_enabled: boolean
  booking_enabled: boolean
  messages_enabled: boolean
  marketing_enabled: boolean
  system_enabled: boolean
  locale: AppLocale
}

export type NotificationPreference = NotificationPreferences

export type PosConnectionRecord = {
  provider: string
  external_location_id?: string
  is_active: boolean
  sync_orders: boolean
  sync_menu: boolean
  sync_spend: boolean
  last_synced_at?: string | null
  credentials_masked: Record<string, string>
}

export type PickupOrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled'

export type PickupOrderRecord = {
  id: number
  code: string
  status: PickupOrderStatus
  payment_status: 'unpaid' | 'pos_owned' | 'paid'
  restaurant_id?: number
  restaurant?: {
    id: number
    name: string
    slug: string
    city?: string | null
  }
  scheduled_for?: string | null
  subtotal: string
  notes?: string
  source?: string
  metadata?: Record<string, unknown>
  customer: {
    id: number
    name: string
    masked_phone: string
  }
  items: Array<{
    id: number
    name: string
    quantity: number
    unit_price: string
    subtotal: string
    options: Array<Record<string, unknown>>
    external_item_id?: string
  }>
  created_at: string
  updated_at: string
}

export type PrivateEventStatus =
  | 'enquiry'
  | 'quoted'
  | 'accepted'
  | 'confirmed'
  | 'declined'
  | 'cancelled'

export type PrivateEventRecord = {
  id: number
  restaurant_id: number
  customer_id: number
  status: PrivateEventStatus
  event_type?: string
  guest_count: number
  requested_starts_at: string
  requested_ends_at: string
  section_key?: string
  customer_name?: string
  contact_phone_masked?: string
  notes?: string
  quoted_total: string
  operator_notes?: string
  status_history: Array<Record<string, unknown>>
  latest_message?: string
  quote_lines: Array<{
    id: number
    label: string
    quantity: number
    unit_price: string
    subtotal: string
    notes?: string
  }>
  created_at: string
}

export type PrivateEventCalendarItem = {
  id: number
  status: PrivateEventStatus
  section_key?: string
  requested_starts_at: string
  requested_ends_at: string
  guest_count: number
}

export type RestaurantSectionRecord = {
  key: string
  name: string
  capacity: number
  private_event_enabled: boolean
}

export type RestaurantLayoutSnapshot = {
  floors: Array<{
    key: string
    name: string
    sections: Array<{
      key: string
      name: string
      capacity?: number
      private_event_enabled?: boolean
      tables?: Array<{
        id?: string | number
        name?: string
        seats?: number
        status?: string
      }>
    }>
  }>
  summary: {
    floors: number
    sections: number
    tables: number
    seats: number
  }
  tables: Array<{
    id?: string | number
    name?: string
    floor_key?: string
    floor_name?: string
    section_key?: string
    section_name?: string
    seats?: number
    status?: string
    combinable_with?: string[]
  }>
}

export type RewardsSummary = {
  points_balance: number
  lifetime_points_delta: number
  transactions_count: number
  tier: {
    slug: string
    label: string
    priority_access: boolean
  }
}

export type RewardTransaction = {
  id: number
  points: number
  kind: 'earn' | 'redeem' | 'adjust' | 'referral'
  source: string
  balance_after: number
  metadata: Record<string, unknown>
  created_at: string
}

export type ReferralRecord = {
  id: number
  code: string
  invitee_email?: string
  invitee_phone?: string
  status: 'pending' | 'accepted' | 'rejected'
  accepted_at?: string | null
  responded_at?: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type ReferralValidation = {
  valid: boolean
  code: string
  referrer_name?: string | null
}

export type PrivateEventQuoteLine = {
  id: number
  label: string
  quantity: number
  unit_price: string
  subtotal: string
  notes?: string
}

export type BookingAttendanceStatus = 'arrived' | 'seated' | 'completed' | 'no_show'

export type InquiryRateLimit = {
  restaurant_id: number
  window: unknown
  remaining: unknown
  limited: boolean
}

export type StatusRealtimeCapabilities = {
  push_enabled: boolean
  push_provider: string
  broadcast_enabled: boolean
  booking_poll_interval_seconds: number
  notification_poll_interval_seconds: number
  phone_otp_enabled: boolean
}

export type ApiStatus = {
  api: string
  version: string
  phase: string
  payments: string
  realtime: StatusRealtimeCapabilities
}

export type ApiHealthcheck = {
  status: string
  service: string
  timezone: string
  api_version: string
}

export type DevicePlatform = 'web' | 'android' | 'ios'

export type DeviceTokenPayload = {
  token: string
  platform: DevicePlatform
  device_id?: string
}

export type GoogleAuthPayload = {
  email: string
  full_name?: string
  google_subject?: string
  id_token?: string
  access_token?: string
  phone?: string
}
