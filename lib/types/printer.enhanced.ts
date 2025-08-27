/**
 * Enhanced Printer Management Types v2.0
 * Refactored based on feedback but keeping practical focus
 */

// ================================================
// ENHANCED CORE PRINTER TYPES
// ================================================

export interface PrinterProfile {
  id: string
  company_id: string
  
  // Basic info
  name: string
  display_name: string
  printer_type: 'CloudPRNT' | 'WebPRNT' | 'USB' | 'Bluetooth'
  connection_string: string
  
  // Enhanced printer brand and capabilities
  brand: 'Star' | 'Epson' | 'Generic' // Added brand for specific handling
  paper_width: number
  supports_cut: boolean
  
  // Enhanced cut command handling - store as hex for flexibility
  cut_command_hex: string // Store as hex string like "1B6401" for ESC d 1
  cut_command_name: string // Human readable like "ESC d 1 (Partial Cut)"
  
  // Behavior
  print_kitchen_receipts: boolean
  print_customer_receipts: boolean
  auto_print_on_order: boolean
  auto_print_on_payment: boolean
  
  // Status
  is_active: boolean
  is_default: boolean
  last_test_at?: string
  last_test_result?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ================================================
// ENHANCED SORTING RULES WITH SCOPE
// ================================================

export interface PrinterSortRule {
  id: string
  printer_id: string
  rule_name: string
  rule_type: SortRuleType
  rule_scope: 'section' | 'within_section' // NEW: Scope separation
  rule_order: number
  rule_config: SortRuleConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SortRuleType = 
  | 'by_product_type'  
  | 'by_course'        
  | 'by_category'      
  | 'by_priority'
  | 'by_manual_order'  // NEW: Manual drag-and-drop ordering

export interface SortRuleConfig {
  values?: string[]           
  course_numbers?: number[]   
  sort_direction?: 'asc' | 'desc'
  priority_order?: string[]   
  category_order?: string[]   // NEW: Manual category ordering
}

// ================================================
// ENHANCED PRODUCT HANDLING
// ================================================

export interface ProductTypeAssignment {
  id: string
  product_id: string
  product_type_id: string
  is_primary: boolean // Only one primary type per product
  created_at: string
}

// Helper type for resolved product information
export interface ResolvedProduct {
  id: string
  name: string
  category_id: string
  category_name: string
  product_type_name: string // Single resolved type name (not array)
  course_number?: number
  print_sort_index: number // From category.print_sort_index
}

// ================================================
// ENHANCED PRINTER CONFIGURATION
// ================================================

export interface PrinterConfig {
  printer: PrinterProfile
  assigned_rooms: string[]
  assigned_categories: string[]
  section_rules: PrinterSortRule[]      // Rules that create sections
  within_section_rules: PrinterSortRule[] // Rules that sort within sections
}

// ================================================
// ENHANCED PRINTABLE ITEM
// ================================================

export interface PrintableItem {
  id: string
  name: string
  quantity: number
  price: number
  product_id: string
  category_id: string
  category_name: string
  product_type_name: string // Single resolved type (not array)
  course_number?: number
  print_sort_index: number // From category
  modifiers?: Array<{
    name: string
    price_adjustment: number
  }>
  created_at: string
}

// ================================================
// ENHANCED RECEIPT BUILDING
// ================================================

export interface ReceiptBuildOptions {
  mode: 'text' | 'binary' // Support both modes
  brand: PrinterProfile['brand']
  paper_width: number
  cut_command_hex: string
  include_cut: boolean
}

export interface ReceiptContent {
  mode: 'text' | 'binary'
  content: string | Uint8Array
  estimated_lines: number
}

// ================================================
// ENHANCED FORM DATA
// ================================================

export interface PrinterFormData {
  name: string
  display_name: string
  printer_type: PrinterProfile['printer_type']
  brand: PrinterProfile['brand']
  connection_string: string
  paper_width: number
  supports_cut: boolean
  cut_command_hex: string
  cut_command_name: string
  print_kitchen_receipts: boolean
  print_customer_receipts: boolean
  auto_print_on_order: boolean
  auto_print_on_payment: boolean
  assigned_rooms: string[]
  assigned_categories: string[]
}

export interface SortRuleFormData {
  rule_name: string
  rule_type: SortRuleType
  rule_scope: 'section' | 'within_section'
  rule_config: SortRuleConfig
  is_active: boolean
}

// ================================================
// ENHANCED CUT COMMANDS WITH HEX STORAGE
// ================================================

export interface CutCommandDefinition {
  name: string
  description: string
  hex: string // Store as hex string
  brand_compatibility: PrinterProfile['brand'][]
  tested_working: boolean // Track which ones we've verified
}

// Your working commands with hex representation
export const CUT_COMMANDS: Record<string, CutCommandDefinition> = {
  'ESC_d_1': {
    name: 'ESC d 1 (Partial Cut)',
    description: 'Partial cut - TESTED WORKING with TSP100',
    hex: '1B6401', // ESC d 1 as hex
    brand_compatibility: ['Star'],
    tested_working: true // We know this works!
  },
  'ESC_d_3': {
    name: 'ESC d 3 (Feed + Cut)',
    description: 'Feed lines then partial cut',
    hex: '1B6403', // ESC d 3 as hex
    brand_compatibility: ['Star'],
    tested_working: false
  },
  'GS_V_66_0': {
    name: 'GS V 66 0 (Standard)',
    description: 'Standard GS partial cut',
    hex: '1D564200', // GS V 66 0 as hex
    brand_compatibility: ['Star', 'Epson'],
    tested_working: false
  },
  'GS_V_1_0': {
    name: 'GS V 1 0 (Alternative)',
    description: 'Alternative GS partial cut',
    hex: '1D560100', // GS V 1 0 as hex
    brand_compatibility: ['Star', 'Epson'],
    tested_working: false
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  // Remove any spaces or prefixes
  const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '')
  
  if (cleanHex.length % 2 !== 0) {
    throw new Error(`Invalid hex string length: ${cleanHex}`)
  }
  
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
  }
  
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join('')
}

/**
 * Convert hex to ESC/POS command string for text mode
 */
export function hexToEscPosString(hex: string): string {
  const bytes = hexToBytes(hex)
  return Array.from(bytes)
    .map(byte => String.fromCharCode(byte))
    .join('')
}

// ================================================
// SORT RULE TEMPLATES WITH SCOPE
// ================================================

export const SECTION_RULE_TEMPLATES: Array<{
  name: string
  type: SortRuleType
  scope: 'section'
  config: SortRuleConfig
  description: string
}> = [
  {
    name: 'Drinks First',
    type: 'by_product_type',
    scope: 'section',
    config: { values: ['drinks'], sort_direction: 'asc' },
    description: 'Create a drinks section first'
  },
  {
    name: 'Course Sections',
    type: 'by_course',
    scope: 'section',
    config: { course_numbers: [1, 2, 3], sort_direction: 'asc' },
    description: 'Create sections by course order'
  }
]

export const WITHIN_SECTION_RULE_TEMPLATES: Array<{
  name: string
  type: SortRuleType
  scope: 'within_section'
  config: SortRuleConfig
  description: string
}> = [
  {
    name: 'Category Order',
    type: 'by_category',
    scope: 'within_section',
    config: { sort_direction: 'asc' },
    description: 'Sort by category print_sort_index within each section'
  },
  {
    name: 'Alphabetical',
    type: 'by_priority',
    scope: 'within_section',
    config: { sort_direction: 'asc' },
    description: 'Sort alphabetically within each section'
  }
]

// ================================================
// COMPANY CONTEXT PLACEHOLDER
// ================================================

// TODO: Replace with actual auth context
export const COMPANY_CONTEXT = {
  getCurrentCompanyId(): string {
    // TODO: Get from auth/session context
    return '00000000-0000-0000-0000-000000000000'
  }
}
