'use client'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export type NewOrderItem = {
  product_id: string
  qty: number
  unit_price?: number
  kitchen_note?: string
  sort_bucket?: number
  course_no?: number
  added_at?: number // Timestamp for preventing duplicates
  modifiers?: { 
    modifier_id: string
    modifier_name: string
    price_adjustment: number
  }[]
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (params: { type: 'dine_in'|'takeaway', table_id?: string|null, pin_required?: boolean, items: NewOrderItem[] }) => {
      console.log('Creating order with params:', params)
      
      const payload = {
        p_type: params.type,
        p_table_id: params.table_id ?? null,
        p_pin_required: params.pin_required ?? false,
        p_items: params.items.map(i => ({
          product_id: i.product_id,
          qty: i.qty,
          unit_price: i.unit_price,
          kitchen_note: i.kitchen_note,
          sort_bucket: i.sort_bucket ?? 0,
          course_no: i.course_no ?? 1,
          modifiers: i.modifiers ?? []
        }))
      }
      
      console.log('RPC payload:', payload)
      
      const { data, error } = await supabase.rpc('create_order', payload)
      
      console.log('RPC response - data:', data, 'error:', error)
      
      if (error) {
        console.error('Supabase RPC error:', error)
        throw new Error(`Database error: ${error.message || 'Unknown error'}`)
      }
      
      // Auto-print kitchen receipt if printer is enabled
      if (typeof window !== 'undefined') {
        try {
          const { flags } = await import('@/src/config/flags')
          if (flags.printerCloudPRNTV1 || flags.printerWebPRNTV1) {
            console.log('🖨️ Auto-printing kitchen receipt for order:', data)
            await autoPrintKitchenReceipt({
              orderId: data as string,
              orderType: params.type,
              tableId: params.table_id,
              items: params.items
            })
          }
        } catch (printError) {
          console.error('❌ Auto-print failed (order still created):', printError)
          // Don't throw - printing failure shouldn't break order creation
        }
      }
      
      return data as string // order_id
    }
  })
}

/**
 * Auto-print kitchen receipt after order creation
 */
async function autoPrintKitchenReceipt(orderData: {
  orderId: string
  orderType: 'dine_in' | 'takeaway'
  tableId?: string | null
  items: NewOrderItem[]
}) {
  try {
    const { flags } = await import('@/src/config/flags')
    
    if (flags.printerCloudPRNTV1) {
      // CloudPRNT with ESC/POS format
      const { buildESCPOSReceipt } = await import('@/proposals/ext/modkit/printers/receipts/escposReceipt.v1')
      
      // Convert order items to receipt format with category information
      const receiptItems = await Promise.all(orderData.items.map(async (item) => {
        // Try to get product and category information
        let productName = `Product ${item.product_id.slice(0, 8)}...`
        let categoryName = 'Other Items'
        let categoryId = ''
        
        try {
          // Import supabase to get product details
          const { supabase } = await import('@/lib/supabaseClient')
          const { data: product } = await supabase
            .from('products')
            .select(`
              name,
              categories (
                id,
                name
              )
            `)
            .eq('id', item.product_id)
            .single()
          
          if (product) {
            productName = product.name
            if (product.categories) {
              categoryName = product.categories.name
              categoryId = product.categories.id
            }
          }
        } catch (error) {
          console.warn('Could not fetch product details:', error)
        }
        
        return {
          name: productName,
          quantity: item.qty,
          price: item.unit_price || 0,
          modifiers: item.kitchen_note ? [item.kitchen_note] : [],
          productType: 'food',
          categoryId,
          categoryName
        }
      }))
      
      // Build structured kitchen receipt with category grouping
      const escposReceipt = buildESCPOSReceipt(receiptItems, {
        type: 'kitchen',
        orderReference: orderData.orderType === 'dine_in' 
          ? `Table ${orderData.tableId || 'Unknown'}`
          : `#${orderData.orderId.slice(-6).toUpperCase()}`,
        headerText: orderData.orderType === 'takeaway' ? 'TAKEAWAY ORDER' : undefined,
        showPricesOnKitchen: false
      })
      
      // Send to CloudPRNT
      await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId: 'tsp100-kitchen',
          payload: escposReceipt,
          contentType: 'application/vnd.star.starprnt',
          orderId: orderData.orderId,
          receiptType: 'kitchen'
        })
      })
      
    } else if (flags.printerWebPRNTV1) {
      // Fallback to WebPRNT
      const { starWebPRNTProvider } = await import('@/proposals/ext/modkit/printers/providers/StarWebPRNT.v1')
      const { buildTableReceipt, buildTakeawayReceipt } = await import('@/proposals/ext/modkit/printers/receipts/basicReceipt.v1')
      
      // Convert order items to receipt format
      const receiptItems = orderData.items.map(item => ({
        name: `Product ${item.product_id.slice(0, 8)}...`,
        quantity: item.qty,
        price: item.unit_price || 0,
        modifiers: item.kitchen_note ? [item.kitchen_note] : [],
        productType: 'food'
      }))
      
      let receiptLines: string[]
      
      if (orderData.orderType === 'dine_in') {
        const tableNumber = orderData.tableId || 'Unknown'
        receiptLines = buildTableReceipt(receiptItems, tableNumber, 'kitchen')
      } else {
        const orderNumber = orderData.orderId.slice(-6).toUpperCase()
        receiptLines = buildTakeawayReceipt(receiptItems, orderNumber, 'Customer', 'kitchen')
      }
      
      await starWebPRNTProvider.printReceipt(receiptLines, {
        url: process.env.NEXT_PUBLIC_PRINTER_URL,
        autoCut: true
      })
    }
    
    console.log('✅ Kitchen receipt printed successfully for order:', orderData.orderId)
    
  } catch (error) {
    console.error('❌ Kitchen receipt printing failed:', error)
    throw error
  }
}

export function useFireCourse() {
  return useMutation({
    mutationFn: async (args: { order_id: string, course_no: number }) => {
      const { error } = await supabase.rpc('fire_course', { p_order: args.order_id, p_course: args.course_no })
      if (error) throw error
      return true
    }
  })
}

export function useFireNextCourse() {
  return useMutation({
    mutationFn: async (order_id: string) => {
      const { data, error } = await supabase.rpc('fire_next_course', { p_order: order_id })
      if (error) throw error
      return data as number | null
    }
  })
}
