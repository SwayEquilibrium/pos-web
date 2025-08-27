/**
 * Simple Printer Repository v1.0
 * 
 * Simplified version without complex functions or mock data
 */

import { supabase } from '@/lib/supabaseClient'

interface PrinterProfile {
  id: string
  company_id: string
  name: string
  display_name: string
  printer_type: 'CloudPRNT' | 'WebPRNT' | 'USB' | 'Bluetooth'
  connection_string: string
  brand: 'Star' | 'Epson' | 'Generic'
  paper_width: number
  supports_cut: boolean
  cut_command_hex: string
  cut_command_name: string
  print_kitchen_receipts: boolean
  print_customer_receipts: boolean
  auto_print_on_order: boolean
  auto_print_on_payment: boolean
  is_active: boolean
  is_default: boolean
  last_test_at?: string
  last_test_result?: string
  created_at: string
  updated_at: string
}

interface PrinterFormData {
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
  assigned_product_types: string[]
}

// ================================================
// SIMPLE PRINTER REPOSITORY
// ================================================

export class PrinterRepository {
  
  /**
   * Get all printer profiles
   */
  static async getAllPrinters(): Promise<PrinterProfile[]> {
    const { data, error } = await supabase
      .from('printer_profiles')
      .select('*')
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('Error fetching printers:', error)
      throw new Error(`Failed to fetch printers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get printer by ID
   */
  static async getPrinter(printerId: string): Promise<PrinterProfile | null> {
    const { data, error } = await supabase
      .from('printer_profiles')
      .select('*')
      .eq('id', printerId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching printer:', error)
      return null
    }

    return data
  }

  /**
   * Create or update printer
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

    // Update assignments if printer was saved successfully
    if (result?.id) {
      await this.updateRoomAssignments(result.id, formData.assigned_rooms)
      await this.updateProductTypeAssignments(result.id, formData.assigned_product_types)
    }

    return result
  }

  /**
   * Update room assignments
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
   * Update category assignments
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
   * Test printer connection
   */
  static async testPrinter(printerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const printer = await this.getPrinter(printerId)
      if (!printer) {
        return { success: false, message: 'Printer not found' }
      }

      // Build simple test content
      const ESC = String.fromCharCode(27)
      const cutCommand = this.getCutCommandString(printer.cut_command_hex)
      
      const testContent = [
        ESC + '@', // Initialize
        '\n*** PRINTER TEST ***\n\n',
        `Printer: ${printer.display_name}\n`,
        `Time: ${new Date().toLocaleString()}\n`,
        '\nTest successful!\n',
        '\n\n',
        cutCommand
      ].join('')

      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: printer.name,
          payload: testContent,
          contentType: 'application/vnd.star.starprnt',
          receiptType: 'printer-test'
        })
      })

      if (response.ok) {
        // Update test result
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
   * Convert hex to ESC/POS string
   */
  static getCutCommandString(hex: string): string {
    try {
      // Convert hex string to bytes then to string
      const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
      return String.fromCharCode(...bytes)
    } catch (error) {
      console.error('Invalid cut command hex:', hex, error)
      // Fall back to working ESC d 1
      return String.fromCharCode(0x1B, 0x64, 0x01)
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

  /**
   * Get room assignments for a printer
   */
  static async getRoomAssignments(printerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('printer_room_assignments')
      .select('room_id')
      .eq('printer_id', printerId)

    if (error) return []
    return data.map(item => item.room_id)
  }

  /**
   * Update product type assignments
   */
  static async updateProductTypeAssignments(printerId: string, productTypeIds: string[]): Promise<void> {
    // Delete existing assignments
    await supabase
      .from('printer_product_type_assignments')
      .delete()
      .eq('printer_id', printerId)

    // Insert new assignments
    if (productTypeIds.length > 0) {
      const assignments = productTypeIds.map(productTypeId => ({
        printer_id: printerId,
        product_type_id: productTypeId
      }))

      const { error } = await supabase
        .from('printer_product_type_assignments')
        .insert(assignments)

      if (error) {
        throw new Error(`Failed to update product type assignments: ${error.message}`)
      }
    }
  }

  /**
   * Get product type assignments for a printer
   */
  static async getProductTypeAssignments(printerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('printer_product_type_assignments')
      .select('product_type_id')
      .eq('printer_id', printerId)

    if (error) return []
    return data.map(item => item.product_type_id)
  }

}
