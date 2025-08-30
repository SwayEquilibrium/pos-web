// ================================================
// SHARED TYPES - API <-> REPOSITORY COMMUNICATION
// ================================================

// ================================================
// MENU TYPES
// ================================================

export interface CategoryDTO {
  id: string
  parent_id?: string | null
  name: string
  description?: string
  sort_index: number
  print_sort_index: number
  active: boolean
  color?: string
  emoji?: string
  image_url?: string
  image_thumbnail_url?: string
  display_style?: 'emoji' | 'icon' | 'text'
  created_at: string
  updated_at: string
}

export interface ProductDTO {
  id: string
  name: string
  category_id?: string | null
  product_group_id?: string | null
  description?: string
  active: boolean
  color?: string
  emoji?: string
  image_url?: string
  image_thumbnail_url?: string
  display_style?: 'emoji' | 'icon' | 'text'
  allergens?: string[]
  nutritional_info?: any
  created_at: string
  updated_at: string
}

export interface ProductPriceDTO {
  id: string
  product_id: string
  context: 'dine_in' | 'takeaway' | 'delivery'
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ModifierGroupDTO {
  id: string
  name: string
  description?: string
  required: boolean
  min_selections: number
  max_selections: number
  active: boolean
  sort_index: number
  created_at: string
  updated_at: string
}

export interface ModifierDTO {
  id: string
  modifier_group_id: string
  name: string
  description?: string
  price_delta: number
  active: boolean
  sort_index: number
  created_at: string
  updated_at: string
}

export interface MenucardDTO {
  id: string
  name: string
  description?: string
  active: boolean
  sort_index: number
  created_at: string
  updated_at: string
}

// ================================================
// ORDER TYPES
// ================================================

export interface OrderDTO {
  id: string
  table_id?: string
  order_number: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'
  total_amount: number
  tax_amount: number
  discount_amount: number
  tip_amount: number
  payment_method?: string
  customer_count: number
  notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
  paid_at?: string
}

export interface OrderItemDTO {
  id: string
  order_id: string
  product_id: string
  category_id: string
  quantity: number
  unit_price: number
  total_price: number
  modifiers_total: number
  special_instructions?: string
  product_name: string
  category_name: string
  category_path?: string
  created_at: string
}

export interface OrderModifierDTO {
  id: string
  order_item_id: string
  modifier_group_id: string
  modifier_id: string
  modifier_name: string
  modifier_group_name: string
  price: number
  quantity: number
  created_at: string
}

// ================================================
// PAYMENT TYPES
// ================================================

export interface PaymentTransactionDTO {
  id: string
  payment_id: string
  reference_number?: string
  order_id?: string
  order_number?: string
  payment_type_id?: string
  payment_method: string
  amount: number
  fee_amount: number
  net_amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
  currency: string
  processed_by?: string
  processed_at?: string
  created_at: string
  updated_at: string
  metadata?: any
  notes?: string
  idempotency_key?: string
}

export interface PaymentTypeDTO {
  id: string
  code: string
  name: string
  description?: string
  requires_reference: boolean
  supports_partial: boolean
  fee_percentage: number
  fee_fixed: number
  active: boolean
  sort_order: number
}

export interface PaymentLogDTO {
  id: string
  company_id?: string
  order_id?: string
  payment_method: string
  amount: number
  currency: string
  status: string
  transaction_reference?: string
  processed_by?: string
  processed_at?: string
  gateway_response?: any
  created_at: string
  updated_at: string
}

// ================================================
// TABLE TYPES
// ================================================

export interface TableDTO {
  id: string
  room_id?: string
  name: string
  capacity: number
  x: number
  y: number
  width: number
  height: number
  active: boolean
  sort_index: number
  created_at: string
  updated_at: string
}

export interface RoomDTO {
  id: string
  name: string
  description?: string
  color: string
  sort_index: number
  active: boolean
  created_at: string
  updated_at: string
}

// ================================================
// PRINTER TYPES
// ================================================

export interface PrinterDTO {
  id: string
  name: string
  type: 'thermal' | 'inkjet' | 'laser' | 'dot_matrix'
  connection_type: 'usb' | 'network' | 'bluetooth'
  ip_address?: string
  port?: number
  mac_address?: string

  webprnt_url?: string
  model?: string
  vendor?: string
  auto_print_on_payment: boolean
  auto_print_on_order: boolean
  receipt_template?: string
  paper_width: number
  active: boolean
  last_heartbeat?: string
  created_at: string
  updated_at: string
}

export interface PrintJobDTO {
  id: string
  printer_id: string
  payload: string
  content_type: string
  order_id?: string
  receipt_type?: string
  status: 'QUEUED' | 'PROCESSING' | 'DELIVERED' | 'PRINTED' | 'FAILED' | 'CANCELLED'
  error_message?: string
  created_at: string
  delivered_at?: string
  printed_at?: string
  updated_at: string
}

// ================================================
// COMPANY TYPES
// ================================================

export interface CompanyDTO {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  currency: string
  timezone: string
  tax_rate: number
  active: boolean
  created_at: string
  updated_at: string
}

// ================================================
// USER TYPES
// ================================================

export interface UserProfileDTO {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: 'user' | 'admin' | 'manager'
  active: boolean
  created_at: string
  updated_at: string
}

// ================================================
// API RESPONSE TYPES
// ================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ListResponse<T = any> {
  data: T[]
  total: number
  limit?: number
  offset?: number
}

// ================================================
// COMMON TYPES
// ================================================

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface SoftDeleteEntity extends BaseEntity {
  active: boolean
}

export interface SortableEntity extends BaseEntity {
  sort_index: number
}

export interface NamedEntity extends BaseEntity {
  name: string
  description?: string
}

// ================================================
// UTILITY TYPES
// ================================================

export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'

export type SortOrder = 'asc' | 'desc'

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike'

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
}

export interface SortCondition {
  field: string
  order: SortOrder
}

export interface QueryOptions {
  filters?: FilterCondition[]
  sorts?: SortCondition[]
  limit?: number
  offset?: number
  include?: string[]
}

// ================================================
// VALIDATION TYPES
// ================================================

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// ================================================
// EVENT TYPES
// ================================================

export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  data: any
  metadata?: any
  timestamp: string
  version: number
}

export interface EventHandler<T = any> {
  handle(event: DomainEvent): Promise<void>
}

// All types are already exported above as interfaces
