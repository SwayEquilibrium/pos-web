/**
 * Enhanced Printer Repository v2.0
 * 
 * Refactored based on feedback with pragmatic improvements
 */

import { supabase } from '@/lib/supabaseClient'
import type {
  PrinterProfile,
  PrinterConfig,
  PrinterSortRule,
  ProductType,
  Course,
  PrinterFormData,
  SortRuleFormData,
  PrintableItem,
  SortedPrintSection,
  ResolvedProduct,
  ReceiptBuildOptions,
  ReceiptContent
} from '@/lib/types/printer.enhanced'
import { hexToBytes, bytesToHex, hexToEscPosString, CUT_COMMANDS, COMPANY_CONTEXT } from '@/lib/types/printer.enhanced'

// ================================================
// ENHANCED PRINTER REPOSITORY
// ================================================

export class PrinterRepository {
  
  /**
   * Get current company ID from auth context
   */
  private static getCompanyId(): string {
    return COMPANY_CONTEXT.getCurrentCompanyId()
  }

  /**
   * Get all printer profiles for current company
   */
  static async getAllPrinters(): Promise<PrinterProfile[]> {
    const { data, error } = await supabase
      .from('printer_profiles')
      .select('*')
      .eq('company_id', this.getCompanyId())
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('Error fetching printers:', error)
      throw new Error(`Failed to fetch printers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get enhanced printer configuration with separated rules
   */
  static async getPrinterConfig(printerId: string): Promise<PrinterConfig | null> {
    const { data, error } = await supabase
      .rpc('get_printer_config_enhanced', { p_printer_id: printerId })

    if (error) {
      console.error('Error fetching printer config:', error)
      throw new Error(`Failed to fetch printer config: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    const config = data[0]

    // Parse the sort rules and separate by scope
    const allRules = (config.sort_rules || []) as PrinterSortRule[]
    const sectionRules = allRules.filter(rule => rule.rule_scope === 'section')
    const withinSectionRules = allRules.filter(rule => rule.rule_scope === 'within_section')

    return {
      printer: {
        id: config.printer_id,
        company_id: config.company_id,
        name: config.printer_name,
        display_name: config.display_name,
        printer_type: config.printer_type,
        connection_string: config.connection_string,
        brand: config.brand || 'Star', // Default to Star since that's what works
        paper_width: config.paper_width,
        supports_cut: config.supports_cut,
        cut_command_hex: config.cut_command_hex || '1B6401', // Default to working ESC d 1
        cut_command_name: config.cut_command_name || 'ESC d 1 (Partial Cut)',
        print_kitchen_receipts: config.print_kitchen_receipts,
        print_customer_receipts: config.print_customer_receipts,
        auto_print_on_order: config.auto_print_on_order,
        auto_print_on_payment: config.auto_print_on_payment,
        is_active: config.is_active,
        is_default: config.is_default,
        last_test_at: config.last_test_at,
        last_test_result: config.last_test_result,
        created_at: config.created_at,
        updated_at: config.updated_at
      },
      assigned_rooms: config.assigned_rooms || [],
      assigned_categories: config.assigned_categories || [],
      section_rules: sectionRules,
      within_section_rules: withinSectionRules
    }
  }

  /**
   * Create or update printer with enhanced fields
   */
  static async upsertPrinter(formData: PrinterFormData, printerId?: string): Promise<PrinterProfile> {
    const printerData = {
      name: formData.name,
      display_name: formData.display_name,
      printer_type: formData.printer_type,
      brand: formData.brand,
      connection_string: formData.connection_string,
      paper_width: formData.paper_width,
      supports_cut: formData.supports_cut,
      cut_command_hex: formData.cut_command_hex,
      cut_command_name: formData.cut_command_name,
      print_kitchen_receipts: formData.print_kitchen_receipts,
      print_customer_receipts: formData.print_customer_receipts,
      auto_print_on_order: formData.auto_print_on_order,
      auto_print_on_payment: formData.auto_print_on_payment,
      company_id: this.getCompanyId(),
      updated_at: new Date().toISOString()
    }

    let result

    if (printerId) {
      // Update existing
      const { data, error } = await supabase
        .from('printer_profiles')
        .update(printerData)
        .eq('id', printerId)
        .select()
        .single()

      if (error) throw new Error(`Failed to update printer: ${error.message}`)
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('printer_profiles')
        .insert({ ...printerData, created_at: new Date().toISOString() })
        .select()
        .single()

      if (error) throw new Error(`Failed to create printer: ${error.message}`)
      result = data
    }

    // Update assignments
    if (result?.id) {
      await this.updateRoomAssignments(result.id, formData.assigned_rooms)
      await this.updateCategoryAssignments(result.id, formData.assigned_categories)
    }

    return result
  }

  /**
   * Update printer room assignments
   */
  static async updateRoomAssignments(printerId: string, roomIds: string[]): Promise<void> {
    // Delete existing assignments
    await supabase
      .from('printer_room_assignments')
      .delete()
      .eq('printer_id', printerId)

    // Insert new assignments
    if (roomIds.length > 0) {
      const assignments = roomIds.map(roomId => ({
        printer_id: printerId,
        room_id: roomId
      }))

      const { error } = await supabase
        .from('printer_room_assignments')
        .insert(assignments)

      if (error) {
        throw new Error(`Failed to update room assignments: ${error.message}`)
      }
    }
  }

  /**
   * Update printer category assignments
   */
  static async updateCategoryAssignments(printerId: string, categoryIds: string[]): Promise<void> {
    // Delete existing assignments
    await supabase
      .from('printer_category_assignments')
      .delete()
      .eq('printer_id', printerId)

    // Insert new assignments
    if (categoryIds.length > 0) {
      const assignments = categoryIds.map(categoryId => ({
        printer_id: printerId,
        category_id: categoryId
      }))

      const { error } = await supabase
        .from('printer_category_assignments')
        .insert(assignments)

      if (error) {
        throw new Error(`Failed to update category assignments: ${error.message}`)
      }
    }
  }

  /**
   * Update sort rules with scope separation
   */
  static async updateSortRules(
    printerId: string, 
    sectionRules: SortRuleFormData[], 
    withinSectionRules: SortRuleFormData[]
  ): Promise<void> {
    // Combine rules with their scopes and order
    const allRules = [
      ...sectionRules.map((rule, index) => ({
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        rule_scope: 'section' as const,
        rule_order: index,
        rule_config: rule.rule_config,
        is_active: rule.is_active
      })),
      ...withinSectionRules.map((rule, index) => ({
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        rule_scope: 'within_section' as const,
        rule_order: index + 1000, // Offset to separate from section rules
        rule_config: rule.rule_config,
        is_active: rule.is_active
      }))
    ]

    const { error } = await supabase
      .rpc('update_printer_sort_rules_enhanced', {
        p_printer_id: printerId,
        p_rules: JSON.stringify(allRules)
      })

    if (error) {
      throw new Error(`Failed to update sort rules: ${error.message}`)
    }
  }

  /**
   * Test printer with enhanced cut command handling
   */
  static async testPrinter(printerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getPrinterConfig(printerId)
      if (!config) {
        return { success: false, message: 'Printer not found' }
      }

      // Build test content with proper cut command
      const testContent = this.buildTestReceipt({
        mode: 'text', // Use text mode for CloudPRNT
        brand: config.printer.brand,
        paper_width: config.printer.paper_width,
        cut_command_hex: config.printer.cut_command_hex,
        include_cut: true
      })

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: config.printer.name,
          payload: testContent.content,
          contentType: 'application/vnd.star.starprnt',
          receiptType: 'printer-test'
        })
      })

      if (response.ok) {
        await supabase
          .from('printer_profiles')
          .update({
            last_test_at: new Date().toISOString(),
            last_test_result: 'success'
          })
          .eq('id', printerId)

        return { success: true, message: 'Test print sent successfully' }
      } else {
        const error = await response.text()
        
        await supabase
          .from('printer_profiles')
          .update({
            last_test_at: new Date().toISOString(),
            last_test_result: `failed: ${error}`
          })
          .eq('id', printerId)

        return { success: false, message: `Test failed: ${error}` }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await supabase
        .from('printer_profiles')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_result: `error: ${errorMessage}`
        })
        .eq('id', printerId)

      return { success: false, message: errorMessage }
    }
  }

  /**
   * Build test receipt with proper formatting
   */
  static buildTestReceipt(options: ReceiptBuildOptions): ReceiptContent {
    const ESC = String.fromCharCode(27)
    
    const lines = [
      ESC + '@', // Initialize printer
      '\n*** PRINTER TEST ***\n\n',
      `Brand: ${options.brand}\n`,
      `Paper Width: ${options.paper_width}\n`,
      `Time: ${new Date().toLocaleString()}\n`,
      '\nThis is a test print to verify\n',
      'your printer is working correctly.\n',
      '\nIf you can read this and the\n',
      'paper cuts properly, everything\n',
      'is working as expected!\n',
      '\n--- TEST COMPLETE ---\n',
      '\n\n'
    ]

    if (options.include_cut && options.cut_command_hex) {
      if (options.mode === 'text') {
        // Convert hex to ESC/POS string for text mode (CloudPRNT)
        lines.push(hexToEscPosString(options.cut_command_hex))
      } else {
        // For binary mode, we'd handle this differently
        // But for now, CloudPRNT uses text mode
        lines.push(hexToEscPosString(options.cut_command_hex))
      }
    }

    return {
      mode: options.mode,
      content: lines.join(''),
      estimated_lines: lines.length
    }
  }

  /**
   * Get cut command as bytes for binary operations
   */
  static getCutCommandBytes(cutCommandHex: string): Uint8Array {
    try {
      return hexToBytes(cutCommandHex)
    } catch (error) {
      console.error('Invalid cut command hex:', cutCommandHex, error)
      // Fall back to working ESC d 1
      return hexToBytes('1B6401')
    }
  }

  /**
   * Delete printer (soft delete)
   */
  static async deletePrinter(printerId: string): Promise<void> {
    const { error } = await supabase
      .from('printer_profiles')
      .update({ is_active: false })
      .eq('id', printerId)

    if (error) {
      throw new Error(`Failed to delete printer: ${error.message}`)
    }
  }
}

// ================================================
// ENHANCED PRODUCT TYPE REPOSITORY
// ================================================

export class ProductTypeRepository {
  
  static async getAllProductTypes(): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('company_id', COMPANY_CONTEXT.getCurrentCompanyId())
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      throw new Error(`Failed to fetch product types: ${error.message}`)
    }

    return data || []
  }

  static async getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('company_id', COMPANY_CONTEXT.getCurrentCompanyId())
      .eq('is_active', true)
      .order('course_number')

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`)
    }

    return data || []
  }

  /**
   * Resolve a product to its primary product type name
   */
  static async resolveProductType(productId: string): Promise<string> {
    const { data, error } = await supabase
      .from('product_type_assignments')
      .select(`
        product_types (
          name
        )
      `)
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single()

    if (error || !data) {
      // No primary type assigned, return default
      return 'food'
    }

    return (data as any).product_types?.name || 'food'
  }

  /**
   * Resolve multiple products to their resolved information
   */
  static async resolveProducts(productIds: string[]): Promise<ResolvedProduct[]> {
    if (productIds.length === 0) return []

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category_id,
        categories (
          name,
          print_sort_index
        ),
        product_type_assignments!inner (
          is_primary,
          product_types (
            name
          )
        )
      `)
      .in('id', productIds)
      .eq('product_type_assignments.is_primary', true)

    if (error) {
      throw new Error(`Failed to resolve products: ${error.message}`)
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      category_name: (item as any).categories?.name || 'Unknown',
      product_type_name: (item as any).product_type_assignments?.[0]?.product_types?.name || 'food',
      print_sort_index: (item as any).categories?.print_sort_index || 0
    }))
  }
}

// ================================================
// ENHANCED PRINTING PIPELINE
// ================================================

export class PrintingPipelineRepository {
  
  /**
   * Enhanced deterministic sorting with scope separation
   */
  static sortItemsByRules(
    items: PrintableItem[], 
    sectionRules: PrinterSortRule[],
    withinSectionRules: PrinterSortRule[]
  ): SortedPrintSection[] {
    
    if (sectionRules.length === 0) {
      // No section rules - create one section with all items
      const sortedItems = this.applySortingRules([...items], withinSectionRules)
      
      return [{
        section_name: 'All Items',
        section_type: 'by_category',
        items: sortedItems,
        sort_order: 0
      }]
    }

    const sections: SortedPrintSection[] = []
    let remainingItems = [...items]
    
    // Apply section rules to create sections
    sectionRules
      .filter(rule => rule.is_active)
      .sort((a, b) => a.rule_order - b.rule_order)
      .forEach((rule, index) => {
        const sectionItems: PrintableItem[] = []
        
        switch (rule.rule_type) {
          case 'by_product_type':
            if (rule.rule_config.values) {
              rule.rule_config.values.forEach(productType => {
                const matchingItems = remainingItems.filter(item => 
                  item.product_type_name === productType
                )
                sectionItems.push(...matchingItems)
                remainingItems = remainingItems.filter(item => 
                  item.product_type_name !== productType
                )
              })
            }
            break

          case 'by_course':
            if (rule.rule_config.course_numbers) {
              rule.rule_config.course_numbers.forEach(courseNumber => {
                const matchingItems = remainingItems.filter(item => 
                  item.course_number === courseNumber
                )
                sectionItems.push(...matchingItems)
                remainingItems = remainingItems.filter(item => 
                  item.course_number !== courseNumber
                )
              })
            }
            break

          case 'by_category':
            // Group by category
            const categoryGroups = new Map<string, PrintableItem[]>()
            remainingItems.forEach(item => {
              const key = item.category_name
              if (!categoryGroups.has(key)) {
                categoryGroups.set(key, [])
              }
              categoryGroups.get(key)!.push(item)
            })
            
            // Add all items from categories
            categoryGroups.forEach(items => {
              sectionItems.push(...items)
            })
            remainingItems = []
            break
        }

        if (sectionItems.length > 0) {
          // Apply within-section sorting to items in this section
          const sortedSectionItems = this.applySortingRules(sectionItems, withinSectionRules)

          sections.push({
            section_name: rule.rule_name,
            section_type: rule.rule_type,
            items: sortedSectionItems,
            sort_order: index
          })
        }
      })

    // Add any remaining items to a final section
    if (remainingItems.length > 0) {
      const sortedRemainingItems = this.applySortingRules(remainingItems, withinSectionRules)

      sections.push({
        section_name: 'Other Items',
        section_type: 'by_category',
        items: sortedRemainingItems,
        sort_order: sections.length
      })
    }

    return sections
  }

  /**
   * Apply within-section sorting rules deterministically
   */
  private static applySortingRules(items: PrintableItem[], rules: PrinterSortRule[]): PrintableItem[] {
    if (rules.length === 0) {
      // Default stable sort: category print_sort_index, then name, then created_at
      return [...items].sort((a, b) => {
        // Primary: category print_sort_index
        if (a.print_sort_index !== b.print_sort_index) {
          return a.print_sort_index - b.print_sort_index
        }
        
        // Secondary: alphabetical by name
        const nameCompare = a.name.localeCompare(b.name)
        if (nameCompare !== 0) return nameCompare
        
        // Tertiary: creation time for stability
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
    }

    // Apply each within-section rule
    return [...items].sort((a, b) => {
      for (const rule of rules.filter(r => r.is_active).sort((x, y) => x.rule_order - y.rule_order)) {
        let comparison = 0

        switch (rule.rule_type) {
          case 'by_category':
            comparison = a.print_sort_index - b.print_sort_index
            break

          case 'by_priority':
            comparison = a.name.localeCompare(b.name)
            break

          case 'by_manual_order':
            if (rule.rule_config.category_order) {
              const aIndex = rule.rule_config.category_order.indexOf(a.category_id)
              const bIndex = rule.rule_config.category_order.indexOf(b.category_id)
              comparison = (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
            }
            break
        }

        if (comparison !== 0) {
          return rule.rule_config.sort_direction === 'desc' ? -comparison : comparison
        }
      }

      // Final stable sort by created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }

  /**
   * Build receipt with enhanced options
   */
  static buildSortedReceipt(
    sections: SortedPrintSection[],
    orderReference: string,
    receiptType: 'kitchen' | 'customer',
    options: ReceiptBuildOptions
  ): ReceiptContent {
    
    if (options.mode === 'text') {
      return this.buildTextReceipt(sections, orderReference, receiptType, options)
    } else {
      return this.buildBinaryReceipt(sections, orderReference, receiptType, options)
    }
  }

  /**
   * Build text-based receipt (for CloudPRNT)
   */
  private static buildTextReceipt(
    sections: SortedPrintSection[],
    orderReference: string,
    receiptType: 'kitchen' | 'customer',
    options: ReceiptBuildOptions
  ): ReceiptContent {
    const ESC = String.fromCharCode(27)
    
    const receiptLines = [
      ESC + '@', // Initialize printer
      '\n',
      `*** ${receiptType.toUpperCase()} RECEIPT ***\n`,
      '--------------------------------\n',
      `Order: ${orderReference}\n`,
      `Time: ${new Date().toLocaleString()}\n`,
      '--------------------------------\n',
      '\n'
    ]

    // Add each section
    sections.forEach((section, sectionIndex) => {
      if (section.items.length === 0) return

      // Section header
      receiptLines.push(`--- ${section.section_name.toUpperCase()} ---\n`)
      
      // Items in section
      section.items.forEach(item => {
        receiptLines.push(`${item.quantity}x ${item.name}\n`)
        
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(modifier => {
            receiptLines.push(`  + ${modifier.name}\n`)
          })
        }
        
        receiptLines.push('\n')
      })

      // Section separator (except for last section)
      if (sectionIndex < sections.length - 1) {
        receiptLines.push('\n')
      }
    })

    // Footer
    receiptLines.push(
      '--------------------------------\n',
      `Total Items: ${sections.reduce((sum, section) => sum + section.items.length, 0)}\n`,
      '\n\n'
    )

    // Add cut command if requested
    if (options.include_cut && options.cut_command_hex) {
      receiptLines.push(hexToEscPosString(options.cut_command_hex))
    }

    return {
      mode: 'text',
      content: receiptLines.join(''),
      estimated_lines: receiptLines.length
    }
  }

  /**
   * Build binary receipt (for future binary printer support)
   */
  private static buildBinaryReceipt(
    sections: SortedPrintSection[],
    orderReference: string,
    receiptType: 'kitchen' | 'customer',
    options: ReceiptBuildOptions
  ): ReceiptContent {
    // For now, convert text to binary
    // In the future, this could build proper binary ESC/POS commands
    const textReceipt = this.buildTextReceipt(sections, orderReference, receiptType, {
      ...options,
      mode: 'text'
    })
    
    const encoder = new TextEncoder()
    const textBytes = encoder.encode(textReceipt.content as string)
    
    // Add binary cut command if requested
    if (options.include_cut && options.cut_command_hex) {
      const cutBytes = hexToBytes(options.cut_command_hex)
      const combined = new Uint8Array(textBytes.length + cutBytes.length)
      combined.set(textBytes)
      combined.set(cutBytes, textBytes.length)
      
      return {
        mode: 'binary',
        content: combined,
        estimated_lines: textReceipt.estimated_lines
      }
    }

    return {
      mode: 'binary',
      content: textBytes,
      estimated_lines: textReceipt.estimated_lines
    }
  }
}
