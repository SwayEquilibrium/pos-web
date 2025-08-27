/**
 * Printer Repository v1.0
 * 
 * Repository layer for printer management - no direct Supabase calls in components
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
  PrinterConfigResponse,
  PrintableItem,
  SortedPrintSection
} from '@/lib/types/printer'

// ================================================
// PRINTER PROFILES
// ================================================

export class PrinterRepository {
  
  /**
   * Get all printer profiles for a company
   */
  static async getAllPrinters(companyId: string = '00000000-0000-0000-0000-000000000000'): Promise<PrinterProfile[]> {
    const { data, error } = await supabase
      .from('printer_profiles')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('Error fetching printers:', error)
      throw new Error(`Failed to fetch printers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get printer configuration with all assignments and rules
   */
  static async getPrinterConfig(printerId: string): Promise<PrinterConfig | null> {
    const { data, error } = await supabase
      .rpc('get_printer_config', { p_printer_id: printerId })

    if (error) {
      console.error('Error fetching printer config:', error)
      throw new Error(`Failed to fetch printer config: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    const config = data[0] as PrinterConfigResponse

    return {
      printer: {
        id: config.printer_id,
        company_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from context
        name: config.printer_name,
        display_name: config.printer_name,
        printer_type: config.printer_type as PrinterProfile['printer_type'],
        connection_string: config.connection_string,
        paper_width: config.paper_width,
        supports_cut: true,
        cut_command: config.cut_command as PrinterProfile['cut_command'],
        print_kitchen_receipts: config.print_kitchen_receipts,
        print_customer_receipts: config.print_customer_receipts,
        auto_print_on_order: true,
        auto_print_on_payment: false,
        is_active: true,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      assigned_rooms: config.assigned_rooms,
      assigned_categories: config.assigned_categories,
      sort_rules: config.sort_rules || []
    }
  }

  /**
   * Create or update a printer profile
   */
  static async upsertPrinter(formData: PrinterFormData, printerId?: string): Promise<PrinterProfile> {
    const printerData = {
      name: formData.name,
      display_name: formData.display_name,
      printer_type: formData.printer_type,
      connection_string: formData.connection_string,
      paper_width: formData.paper_width,
      supports_cut: formData.supports_cut,
      cut_command: formData.cut_command,
      print_kitchen_receipts: formData.print_kitchen_receipts,
      print_customer_receipts: formData.print_customer_receipts,
      auto_print_on_order: formData.auto_print_on_order,
      auto_print_on_payment: formData.auto_print_on_payment,
      company_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from context
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

    // Update room assignments
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
   * Update printer sort rules
   */
  static async updateSortRules(printerId: string, rules: SortRuleFormData[]): Promise<void> {
    const rulesData = rules.map((rule, index) => ({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      rule_order: index,
      rule_config: rule.rule_config,
      is_active: rule.is_active
    }))

    const { error } = await supabase
      .rpc('update_printer_sort_rules', {
        p_printer_id: printerId,
        p_rules: JSON.stringify(rulesData)
      })

    if (error) {
      throw new Error(`Failed to update sort rules: ${error.message}`)
    }
  }

  /**
   * Test printer connection
   */
  static async testPrinter(printerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getPrinterConfig(printerId)
      if (!config) {
        return { success: false, message: 'Printer not found' }
      }

      // Send test print job
      const testContent = [
        String.fromCharCode(27) + '@', // Initialize
        '\n*** PRINTER TEST ***\n\n',
        `Printer: ${config.printer.display_name}\n`,
        `Time: ${new Date().toLocaleString()}\n`,
        '\nTest successful!\n',
        '\n\n',
        this.getCutCommand(config.printer.cut_command) // Use configured cut command
      ].join('')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: config.printer.name,
          payload: testContent,
          contentType: 'application/vnd.star.starprnt',
          receiptType: 'printer-test'
        })
      })

      if (response.ok) {
        // Update test result in database
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
        
        // Update test result in database
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
      
      // Update test result in database
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
   * Get ESC/POS cut command string
   */
  static getCutCommand(cutCommandType: PrinterProfile['cut_command']): string {
    switch (cutCommandType) {
      case 'ESC_d_1':
        return String.fromCharCode(0x1B, 0x64, 0x01) // ESC d 1
      case 'ESC_d_3':
        return String.fromCharCode(0x1B, 0x64, 0x03) // ESC d 3
      case 'GS_V_66_0':
        return String.fromCharCode(0x1D, 0x56, 0x42, 0x00) // GS V 66 0
      case 'GS_V_1_0':
        return String.fromCharCode(0x1D, 0x56, 0x01, 0x00) // GS V 1 0
      case 'RAW_1D_56_01_00':
        return String.fromCharCode(0x1D, 0x56, 0x01, 0x00) // Raw hex
      default:
        return String.fromCharCode(0x1B, 0x64, 0x01) // Default to ESC d 1
    }
  }

  /**
   * Delete printer
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
// PRODUCT TYPES & COURSES
// ================================================

export class ProductTypeRepository {
  
  static async getAllProductTypes(companyId: string = '00000000-0000-0000-0000-000000000000'): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('product_types')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      throw new Error(`Failed to fetch product types: ${error.message}`)
    }

    return data || []
  }

  static async getAllCourses(companyId: string = '00000000-0000-0000-0000-000000000000'): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('course_number')

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`)
    }

    return data || []
  }
}

// ================================================
// PRINTING PIPELINE
// ================================================

export class PrintingPipelineRepository {
  
  /**
   * Sort items according to printer rules
   */
  static sortItemsByRules(items: PrintableItem[], sortRules: PrinterSortRule[]): SortedPrintSection[] {
    if (sortRules.length === 0) {
      // No rules - return items in a single section sorted by category
      const sortedItems = [...items].sort((a, b) => {
        return (a.category_name || '').localeCompare(b.category_name || '')
      })

      return [{
        section_name: 'All Items',
        section_type: 'by_category',
        items: sortedItems,
        sort_order: 0
      }]
    }

    const sections: SortedPrintSection[] = []
    let remainingItems = [...items]
    
    // Apply each rule in order
    sortRules
      .filter(rule => rule.is_active)
      .sort((a, b) => a.rule_order - b.rule_order)
      .forEach((rule, index) => {
        const sectionItems: PrintableItem[] = []
        
        switch (rule.rule_type) {
          case 'by_product_type':
            if (rule.rule_config.values) {
              rule.rule_config.values.forEach(productType => {
                const matchingItems = remainingItems.filter(item => 
                  item.product_types?.includes(productType)
                )
                sectionItems.push(...matchingItems)
                remainingItems = remainingItems.filter(item => 
                  !item.product_types?.includes(productType)
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
            // Sort remaining items by category print_sort_index
            sectionItems.push(...remainingItems)
            remainingItems = []
            break
        }

        if (sectionItems.length > 0) {
          // Sort items within section by category name, then created_at
          sectionItems.sort((a, b) => {
            const categoryCompare = (a.category_name || '').localeCompare(b.category_name || '')
            if (categoryCompare !== 0) return categoryCompare
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })

          sections.push({
            section_name: rule.rule_name,
            section_type: rule.rule_type,
            items: sectionItems,
            sort_order: index
          })
        }
      })

    // Add any remaining items to a final section
    if (remainingItems.length > 0) {
      remainingItems.sort((a, b) => {
        const categoryCompare = (a.category_name || '').localeCompare(b.category_name || '')
        if (categoryCompare !== 0) return categoryCompare
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      sections.push({
        section_name: 'Other Items',
        section_type: 'by_category',
        items: remainingItems,
        sort_order: sections.length
      })
    }

    return sections
  }

  /**
   * Build receipt content with sorted sections
   */
  static buildSortedReceipt(
    sections: SortedPrintSection[],
    orderReference: string,
    receiptType: 'kitchen' | 'customer',
    cutCommand: string
  ): string {
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
      '\n\n',
      cutCommand // Use the configured cut command
    )

    return receiptLines.join('')
  }
}
