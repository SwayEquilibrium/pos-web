/**
 * Advanced Printer Management Types v1.0
 */

// ================================================
// CORE PRINTER TYPES
// ================================================

export interface PrinterProfile {
  id: string
  company_id: string
  
  // Basic info
  name: string
  display_name: string
  printer_type: 'Direct IP' | 'USB' | 'Bluetooth'
  connection_string: string
  
  // Capabilities
  paper_width: number
  supports_cut: boolean
  cut_command: CutCommandType
  
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

export type CutCommandType = 
  | 'ESC_d_1'      // ESC d 1 - Working for TSP100
  | 'ESC_d_3'      // ESC d 3 - Feed + partial cut
  | 'GS_V_66_0'    // GS V 66 0 - Standard partial cut
  | 'GS_V_1_0'     // GS V 1 0 - Alternative partial cut
  | 'RAW_1D_56_01_00' // Raw hex command

// ================================================
// PRINTER ASSIGNMENTS
// ================================================

export interface PrinterRoomAssignment {
  id: string
  printer_id: string
  room_id: string
  created_at: string
}

export interface PrinterCategoryAssignment {
  id: string
  printer_id: string
  category_id: string
  created_at: string
}

// ================================================
// SORTING RULES SYSTEM
// ================================================

export interface PrinterSortRule {
  id: string
  printer_id: string
  rule_name: string
  rule_type: SortRuleType
  rule_order: number
  rule_config: SortRuleConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SortRuleType = 
  | 'by_product_type'  // Sort by product types (drinks, food, etc.)
  | 'by_course'        // Sort by course number (starter, main, dessert)
  | 'by_category'      // Sort by category print_sort_index
  | 'by_priority'      // Sort by custom priority

export interface SortRuleConfig {
  values?: string[]           // For product types: ["drinks", "food"]
  course_numbers?: number[]   // For courses: [1, 2, 3]
  sort_direction?: 'asc' | 'desc'
  priority_order?: string[]   // For custom priority
}

// ================================================
// PRODUCT TYPES & COURSES
// ================================================

export interface ProductType {
  id: string
  company_id: string
  name: string
  code: string
  description?: string
  sort_order: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductTypeAssignment {
  id: string
  product_id: string
  product_type_id: string
  is_primary: boolean
  created_at: string
}

export interface Course {
  id: string
  company_id: string
  name: string
  code: string
  course_number: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ================================================
// PRINTER CONFIGURATION (Aggregate)
// ================================================

export interface PrinterConfig {
  printer: PrinterProfile
  assigned_rooms: string[]
  assigned_categories: string[]
  sort_rules: PrinterSortRule[]
}

// ================================================
// PRINTING PIPELINE TYPES
// ================================================

export interface PrintableItem {
  id: string
  name: string
  quantity: number
  price: number
  product_id: string
  category_id: string
  category_name?: string
  product_types?: string[]
  course_number?: number
  modifiers?: Array<{
    name: string
    price_adjustment: number
  }>
  created_at: string
}

export interface SortedPrintSection {
  section_name: string
  section_type: SortRuleType
  items: PrintableItem[]
  sort_order: number
}

export interface PrintJob {
  id: string
  printer_id: string
  order_id: string
  receipt_type: 'kitchen' | 'customer'
  sections: SortedPrintSection[]
  total_items: number
  created_at: string
}

// ================================================
// UI CONFIGURATION TYPES
// ================================================

export interface PrinterFormData {
  name: string
  display_name: string
  printer_type: PrinterProfile['printer_type']
  connection_string: string
  paper_width: number
  supports_cut: boolean
  cut_command: CutCommandType
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
  rule_config: SortRuleConfig
  is_active: boolean
}

// ================================================
// API RESPONSE TYPES
// ================================================

export interface PrinterConfigResponse {
  printer_id: string
  printer_name: string
  printer_type: string
  connection_string: string
  paper_width: number
  cut_command: string
  print_kitchen_receipts: boolean
  print_customer_receipts: boolean
  assigned_rooms: string[]
  assigned_categories: string[]
  sort_rules: any[] // JSONB from database
}

// ================================================
// UTILITY TYPES
// ================================================

export interface CutCommandInfo {
  type: CutCommandType
  name: string
  description: string
  esc_sequence: string
}

export const CUT_COMMANDS: Record<CutCommandType, CutCommandInfo> = {
  ESC_d_1: {
    type: 'ESC_d_1',
    name: 'ESC d 1 (Recommended)',
    description: 'Standard partial cut - works with TSP100',
    esc_sequence: '\\x1B\\x64\\x01'
  },
  ESC_d_3: {
    type: 'ESC_d_3',
    name: 'ESC d 3',
    description: 'Feed + partial cut',
    esc_sequence: '\\x1B\\x64\\x03'
  },
  GS_V_66_0: {
    type: 'GS_V_66_0',
    name: 'GS V 66 0',
    description: 'Standard GS partial cut',
    esc_sequence: '\\x1D\\x56\\x42\\x00'
  },
  GS_V_1_0: {
    type: 'GS_V_1_0',
    name: 'GS V 1 0',
    description: 'Alternative GS partial cut',
    esc_sequence: '\\x1D\\x56\\x01\\x00'
  },
  RAW_1D_56_01_00: {
    type: 'RAW_1D_56_01_00',
    name: 'Raw Hex Command',
    description: 'Raw hex partial cut command',
    esc_sequence: '\\x1D\\x56\\x01\\x00'
  }
}

// ================================================
// SORT RULE TEMPLATES
// ================================================

export const SORT_RULE_TEMPLATES: Array<{
  name: string
  type: SortRuleType
  config: SortRuleConfig
  description: string
}> = [
  {
    name: 'Drinks First',
    type: 'by_product_type',
    config: { values: ['drinks'], sort_direction: 'asc' },
    description: 'Print all drinks before other items'
  },
  {
    name: 'Course Order',
    type: 'by_course',
    config: { course_numbers: [1, 2, 3], sort_direction: 'asc' },
    description: 'Print by course: Starter → Main → Dessert'
  },
  {
    name: 'Category Priority',
    type: 'by_category',
    config: { sort_direction: 'asc' },
    description: 'Use category print_sort_index for ordering'
  },
  {
    name: 'Food Types',
    type: 'by_product_type',
    config: { values: ['starters', 'food', 'desserts'], sort_direction: 'asc' },
    description: 'Group by food types in order'
  }
]
