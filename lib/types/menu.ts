// ================================================
// SHARED MENU SYSTEM TYPES
// ================================================

export interface TaxCode {
  id: string
  name: string
  rate: number
  created_at?: string
  updated_at?: string
}

export interface ProductGroup {
  id: string
  name: string
  description?: string
  sort_index: number
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  parent_id?: string | null
  name: string
  description?: string
  sort_index: number
  print_sort_index: number
  active: boolean
  created_at?: string
  updated_at?: string
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
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductPrice {
  id: string
  product_id: string
  context: 'dine_in' | 'takeaway'
  price: number
  tax_code_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface Menucard {
  id: string
  name: string
  description?: string
  active: boolean
  sort_index: number
  created_at?: string
  updated_at?: string
}

export interface MenucardCategory {
  menucard_id: string
  category_id: string
  sort_index: number
  created_at?: string
}

export interface ModifierGroup {
  id: string
  name: string
  description?: string
  min_select: number
  max_select: number
  sort_index: number
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface Modifier {
  id: string
  group_id: string
  name: string
  description?: string
  kind: 'add' | 'remove'
  price_delta: number
  sort_index: number
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductModifierGroup {
  product_id: string
  group_id: string
  sort_index: number
  is_required: boolean
  created_at?: string
}

// ================================================
// COMPUTED/VIEW TYPES
// ================================================

export interface ProductWithPricing {
  product_id: string
  name: string
  description?: string
  category_id?: string | null
  product_group_id?: string | null
  active: boolean
  category_name?: string
  product_group_name?: string
  dine_in_price?: number
  dine_in_tax?: string | null
  takeaway_price?: number
  takeaway_tax?: string | null
  created_at?: string
  updated_at?: string
}

export interface ModifierGroupWithModifiers extends ModifierGroup {
  modifiers: Modifier[]
}

export interface ProductWithModifierGroups extends Product {
  modifier_groups: (ModifierGroup & { is_required: boolean; sort_index: number })[]
}

// ================================================
// FORM/INPUT TYPES
// ================================================

export interface ProductFormData {
  name: string
  category_id?: string | null
  product_group_id?: string | null
  description?: string
  dine_in_price?: number
  dine_in_tax?: string | null
  takeaway_price?: number
  takeaway_tax?: string | null
}

export interface CategoryFormData {
  name: string
  parent_id?: string | null
  description?: string
  sort_index?: number
}

export interface ProductGroupFormData {
  name: string
  description?: string
  sort_index?: number
}

export interface ModifierGroupFormData {
  name: string
  description?: string
  min_select?: number
  max_select?: number
}

export interface ModifierFormData {
  name: string
  description?: string
  kind?: 'add' | 'remove'
  price_delta?: number
}

export interface MenucardFormData {
  name: string
  description?: string
  sort_index?: number
}

// ================================================
// API RESPONSE TYPES
// ================================================

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// ================================================
// UI STATE TYPES
// ================================================

export type MenuToggleTab = 'menucards' | 'categories' | 'products' | 'modifiers' | 'product-groups'

export interface MenuEditorState {
  activeTab: MenuToggleTab
  selectedProduct?: string | null
  selectedCategory?: string | null
  selectedMenucard?: string | null
  selectedModifierGroup?: string | null
  selectedProductGroup?: string | null
}

export interface SortableItem {
  id: string
  name: string
  sort_index: number
}

// ================================================
// REPOSITORY FUNCTION TYPES
// ================================================

export interface ReorderParams {
  table: 'categories' | 'product_groups' | 'product_modifier_groups' | 'menucard_categories'
  parent_id?: string | null
  ids: string[]
  sort_start?: number
}

export interface UpsertProductParams {
  product_id?: string | null
  name: string
  category_id?: string | null
  product_group_id?: string | null
  description?: string
  dine_in_price?: number
  dine_in_tax?: string | null
  takeaway_price?: number
  takeaway_tax?: string | null
}

// ================================================
// UTILITY TYPES
// ================================================

export type DatabaseTable = 
  | 'categories'
  | 'products' 
  | 'product_groups'
  | 'product_prices'
  | 'menucards'
  | 'menucard_categories'
  | 'modifier_groups'
  | 'modifiers'
  | 'product_modifier_groups'
  | 'tax_codes'

export type PriceContext = 'dine_in' | 'takeaway'

export type ModifierKind = 'add' | 'remove'

// ================================================
// ERROR TYPES
// ================================================

export interface MenuError {
  code: string
  message: string
  details?: any
}

export class MenuRepositoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'MenuRepositoryError'
  }
}
