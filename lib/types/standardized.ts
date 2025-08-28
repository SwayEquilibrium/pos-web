// ================================================
// STANDARDIZED TYPES - CONSOLIDATES ALL INCONSISTENT TYPE DEFINITIONS
// ================================================

// ================================================
// PAYMENT TYPES - STANDARDIZED
// ================================================

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_PAY' | 'GIFT_CARD'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface PaymentTransaction {
  id: string
  order_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  cash_received?: number
  change_given?: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface PaymentRequest {
  order_id: string
  amount: number
  payment_method: PaymentMethod
  transaction_id?: string
  cash_received?: number
  change_given?: number
  metadata?: Record<string, any>
}

// ================================================
// MENU TYPES - STANDARDIZED
// ================================================

export interface Category {
  id: string
  parent_id?: string | null
  name: string
  description?: string
  sort_index: number
  print_sort_index: number
  active: boolean
  color?: string
  emoji?: string
  display_style?: 'emoji' | 'icon' | 'text'
  image_url?: string
  image_thumbnail_url?: string
  created_at: string
  updated_at: string
  // Computed fields
  has_children?: boolean
  product_count?: number
  child_categories?: number
  level?: number
  full_path?: string
}

export interface Product {
  id: string
  name: string
  category_id?: string | null
  product_group_id?: string | null
  description?: string
  sort_index: number
  active: boolean
  image_url?: string
  allergens?: string[]
  nutritional_info?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProductPrice {
  id: string
  product_id: string
  context: 'dine_in' | 'takeaway' | 'delivery'
  price: number
  tax_code_id?: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface ProductGroup {
  id: string
  name: string
  description?: string
  sort_index: number
  active: boolean
  color?: string
  icon?: string
  created_at: string
  updated_at: string
}

export interface ModifierGroup {
  id: string
  name: string
  description?: string
  min_select: number
  max_select: number
  sort_index: number
  active: boolean
  required: boolean
  created_at: string
  updated_at: string
}

export interface Modifier {
  id: string
  group_id: string
  name: string
  description?: string
  kind: 'add' | 'remove' | 'replace'
  price_delta: number
  sort_index: number
  active: boolean
  allergen_free?: boolean
  created_at: string
  updated_at: string
}

export interface Menucard {
  id: string
  name: string
  description?: string
  active: boolean
  sort_index: number
  template?: string
  theme?: string
  created_at: string
  updated_at: string
}

export interface MenucardCategory {
  menucard_id: string
  category_id: string
  sort_index: number
  visible: boolean
  created_at: string
}

// ================================================
// ORDER TYPES - STANDARDIZED
// ================================================

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  type: OrderType
  table_id?: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  special_instructions?: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  final_amount: number
  payment_status: 'unpaid' | 'partial' | 'paid'
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  modifiers: OrderItemModifier[]
  created_at: string
}

export interface OrderItemModifier {
  id: string
  order_item_id: string
  modifier_id: string
  modifier_name: string
  price_delta: number
  created_at: string
}

export interface TableOrder extends Order {
  table_id: string
  table_name: string
  server_name?: string
  seating_time?: string
  estimated_departure?: string
}

export interface TakeawayOrder extends Order {
  pickup_time?: string
  estimated_ready_time?: string
}

export interface DeliveryOrder extends Order {
  delivery_address: string
  delivery_instructions?: string
  estimated_delivery_time?: string
  driver_name?: string
  driver_phone?: string
}

// ================================================
// PRINTER TYPES - STANDARDIZED
// ================================================

export type PrinterType = 'thermal' | 'inkjet' | 'laser' | 'cloudprnt' | 'webprnt'
export type ConnectionType = 'usb' | 'network' | 'bluetooth' | 'cloud' | 'web'

export interface PrinterConfig {
  id: string
  name: string
  type: PrinterType
  connection_type: ConnectionType
  ip_address?: string
  port?: number
  mac_address?: string
  cloudprnt_url?: string
  webprnt_url?: string
  model?: string
  vendor?: string
  auto_print_on_payment: boolean
  auto_print_on_order: boolean
  receipt_template?: string
  paper_width: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface PrintJob {
  id: string
  printer_id: string
  content: string
  status: 'pending' | 'printing' | 'completed' | 'failed'
  job_type: 'receipt' | 'order' | 'report' | 'test'
  metadata?: Record<string, any>
  error_message?: string
  created_at: string
  updated_at: string
}

// ================================================
// CUSTOMER TYPES - STANDARDIZED
// ================================================

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  birth_date?: string
  loyalty_points: number
  preferences?: Record<string, any>
  active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerGroup {
  id: string
  name: string
  description?: string
  discount_percentage?: number
  loyalty_multiplier?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface GiftCard {
  id: string
  card_number: string
  balance: number
  active: boolean
  customer_id?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

// ================================================
// BUSINESS TYPES - STANDARDIZED
// ================================================

export interface Company {
  id: string
  name: string
  legal_name?: string
  vat_number?: string
  address?: string
  city?: string
  postal_code?: string
  country: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  currency: string
  timezone: string
  language: string
  tax_rate: number
  created_at: string
  updated_at: string
}

export interface TaxCode {
  id: string
  name: string
  rate: number
  description?: string
  active: boolean
  created_at: string
  updated_at: string
}

// ================================================
// FORM TYPES - STANDARDIZED
// ================================================

export interface CategoryFormData {
  name: string
  description?: string
  parent_id?: string | null
  sort_index?: number
  color?: string
  emoji?: string
  display_style?: 'emoji' | 'icon' | 'text'
  image_url?: string
  image_thumbnail_url?: string
}

export interface ProductFormData {
  name: string
  category_id?: string
  product_group_id?: string
  description?: string
  sort_index?: number
  image_url?: string
  allergens?: string[]
  nutritional_info?: Record<string, any>
  prices: {
    dine_in?: number
    takeaway?: number
    delivery?: number
    tax_code_id?: string
  }
}

export interface ModifierFormData {
  type: 'group' | 'modifier'
  name: string
  description?: string
  group_id?: string
  min_select?: number
  max_select?: number
  kind?: 'add' | 'remove' | 'replace'
  price_delta?: number
  sort_index?: number
  allergen_free?: boolean
}

export interface PrinterFormData {
  name: string
  type: PrinterType
  connection_type: ConnectionType
  ip_address?: string
  port?: number
  mac_address?: string
  cloudprnt_url?: string
  webprnt_url?: string
  model?: string
  vendor?: string
  auto_print_on_payment: boolean
  auto_print_on_order: boolean
  receipt_template?: string
  paper_width: number
}

// ================================================
// REORDER TYPES - STANDARDIZED
// ================================================

export interface ReorderParams {
  ids: string[]
  parent_id?: string | null
  sort_start?: number
}

export interface ReorderResult {
  success: boolean
  message: string
  error?: string
}

// ================================================
// SEARCH AND FILTER TYPES - STANDARDIZED
// ================================================

export interface SearchParams {
  query?: string
  category_id?: string
  menucard_id?: string
  include_inactive?: boolean
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ================================================
// VALIDATION TYPES - STANDARDIZED
// ================================================

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ================================================
// API RESPONSE TYPES - STANDARDIZED
// ================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: ValidationError[]
  pagination?: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

// ================================================
// FEATURE FLAG TYPES - STANDARDIZED
// ================================================

export interface FeatureFlags {
  idempotencyV1: boolean
  outboxV1: boolean
  paymentsV1: boolean
  fulfillmentV1: boolean
  reservationsV1: boolean
  observabilityV1: boolean
  printerWebPRNTV1: boolean
  printerCloudPRNTV1: boolean
  smoothNavigationV1: boolean
  unifiedMenuV1: boolean
  consolidatedPaymentsV1: boolean
  consolidatedPrintersV1: boolean
}

// ================================================
// UTILITY TYPES - STANDARDIZED
// ================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type EntityWithTimestamps = {
  created_at: string
  updated_at: string
}

export type SoftDeleteEntity = EntityWithTimestamps & {
  active: boolean
}

export type SortableEntity = SoftDeleteEntity & {
  sort_index: number
}

export type HierarchicalEntity = SortableEntity & {
  parent_id?: string | null
}
