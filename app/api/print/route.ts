import { NextRequest, NextResponse } from 'next/server'
import ThermalPrinter from 'node-thermal-printer'

// Debug endpoint to test printing without connecting to actual printer
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const test = searchParams.get('test')

  if (test === 'kitchen') {
    const testData = {
      orderId: 'test-123',
      orderNumber: 'TEST-001',
      tableName: 'Test Table',
      items: [
        { name: 'Burger', quantity: 2, unitPrice: 50, totalPrice: 100 },
        { name: 'Fries', quantity: 1, unitPrice: 25, totalPrice: 25, specialInstructions: 'Extra crispy' }
      ]
    }

    const receipt = buildKitchenOrderText(testData)
    return NextResponse.json({
      success: true,
      message: 'Kitchen order preview',
      receipt: receipt,
      data: testData
    })
  }

  if (test === 'print-test') {
    // Test printing to user's printer
    const testData = {
      orderId: 'test-print-123',
      orderNumber: 'PRINT-TEST-001',
      tableName: 'Printer Test',
      items: [
        { name: 'Test Burger', quantity: 1, unitPrice: 25, totalPrice: 25 },
        { name: 'Test Fries', quantity: 1, unitPrice: 15, totalPrice: 15 }
      ]
    }

    try {
      // Test direct printing to the user's printer
      const printer = new ThermalPrinter.printer({
        type: ThermalPrinter.types.STAR,
        interface: 'tcp://192.168.8.192:9100',
        options: {
          timeout: 5000
        },
        width: 48,
        removeSpecialCharacters: false,
        lineCharacter: '-'
      })

      printer.clear()
      printer.newLine()

      // Print test header
      printer.alignCenter()
      printer.bold(true)
      printer.println('*** PRINTER TEST ***')
      printer.bold(false)
      printer.newLine()

      printer.alignLeft()
      printer.println('If you can read this,')
      printer.println('the printer is working!')
      printer.println('')
      printer.println(`Test Time: ${new Date().toLocaleString()}`)
      printer.println(`Printer IP: 192.168.8.192`)

      printer.newLine()
      printer.cut()

      await printer.execute()

      return NextResponse.json({
        success: true,
        message: 'Printer test completed successfully!',
        printerIP: '192.168.8.192',
        testData
      })
    } catch (error) {
      console.error('Printer test failed:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Printer test failed',
        printerIP: '192.168.8.192'
      }, { status: 500 })
    }
  }

  if (test === 'printers') {
    // Check current printer configuration
    try {
      const { createClient } = require('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wncxwhcscvqxkenllzsw.supabase.co'
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3h3aGNzY3ZxeGtlbmxsenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE0MTksImV4cCI6MjA3MTYyNzQxOX0.LxLNnK7fJtSjqLJfK_ulebArNpp-EPd0P9vGJbg7fkI'

      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: printers, error } = await supabase
        .from('printers')
        .select('*')
        .eq('is_active', true)

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
          message: 'Failed to fetch printers'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Current printer configuration',
        printers: printers || [],
        totalActive: printers?.length || 0
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to check printer configuration'
      }, { status: 500 })
    }
  }

  if (test === 'receipt') {
    const testData = {
      orderId: 'test-123',
      orderNumber: 'TEST-001',
      tableName: 'Test Table',
      items: [
        { name: 'Burger', quantity: 2, unitPrice: 50, totalPrice: 100 },
        { name: 'Fries', quantity: 1, unitPrice: 25, totalPrice: 25 }
      ]
    }

    const receipt = buildCustomerReceiptText(testData)
    return NextResponse.json({
      success: true,
      message: 'Customer receipt preview',
      receipt: receipt,
      data: testData
    })
  }

  return NextResponse.json({
    message: 'Print API Test Endpoints',
    endpoints: {
      'GET /api/print?test=kitchen': 'Preview kitchen order format',
      'GET /api/print?test=receipt': 'Preview customer receipt format',
      'GET /api/print?test=printers': 'Check current printer configuration',
      'GET /api/print?test=print-test': 'Test printing to your printer (192.168.8.192)',
      'POST /api/print': 'Print to thermal printer'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const {
      printerIP,
      printData,
      printType = 'kitchen',
      useQueue = false,
      jobId
    } = await request.json()

    if (!printerIP || !printData) {
      return NextResponse.json({
        error: 'Printer IP and print data are required'
      }, { status: 400 })
    }

    console.log(`🖨️ Processing ${printType} order to ${printerIP}${useQueue ? ' (queued)' : ' (direct)'}`)
    console.log('📋 Print data:', printData)

    // If using queue, create a print job instead of printing directly
    if (useQueue) {
      const { createPrintJob, generateIdempotencyKey, generateContentHash } = await import('@/lib/repos/printJobs.repo')
      const { getPrinterByConnectionString, createPrinter } = await import('@/lib/repos/printers.repo')

      const content = JSON.stringify({
        ...printData,
        printerIP,
        printType,
        processedAt: new Date().toISOString()
      })

      const contentHash = generateContentHash(content)
      const idempotencyKey = generateIdempotencyKey(printType, printerIP, printData.orderId, contentHash)

      // Try to find existing printer by connection string (IP address)
      let printer = await getPrinterByConnectionString(printerIP)

      // If printer doesn't exist in database, create a temporary printer record
      if (!printer) {
        console.log(`📝 Creating temporary printer record for IP: ${printerIP}`)
        try {
          printer = await createPrinter({
            name: `Printer ${printerIP}`,
            display_name: `Printer ${printerIP}`,
            printer_type: 'STAR', // Default to STAR thermal printer
            connection_string: printerIP,
            brand: 'Unknown',
            paper_width: 48,
            supports_cut: true,
            cut_command_hex: '1B69',
            cut_command_name: 'STAR',
            print_kitchen_receipts: true,
            print_customer_receipts: true,
            auto_print_on_order: false,
            auto_print_on_payment: false,
            is_active: true,
            is_default: false
          })
          console.log(`✅ Created printer record: ${printer.id}`)
        } catch (createError) {
          console.error('❌ Failed to create printer record:', createError)
          return NextResponse.json({
            error: 'Failed to create printer record',
            printerIP
          }, { status: 500 })
        }
      }

      const job = await createPrintJob({
        idempotencyKey,
        printerId: printer.id,
        jobType: printType as 'receipt' | 'kitchen' | 'label' | 'custom',
        contentType: 'application/json',
        payload: content,
        renderedContent: content,
        orderId: printData.orderId,
        tableId: printData.tableId,
        metadata: {
          originalRequest: { printerIP, printData, printType },
          source: 'api/print'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Print job queued successfully',
        jobId: job.id,
        status: job.status,
        queued: true
      })
    }

    // Create thermal printer instance
    const printer = new ThermalPrinter.printer({
      type: ThermalPrinter.types.STAR,
      interface: `tcp://${printerIP}:9100`,
      options: {
        timeout: 10000
      },
      width: 48, // 48 character width (standard thermal printer)
      removeSpecialCharacters: false,
      lineCharacter: '-'
    })

    try {
      // Initialize printer
      printer.clear()
      printer.newLine()

      // Build and print receipt content
      if (printType === 'kitchen') {
        await printKitchenOrder(printer, printData)
      } else {
        await printCustomerReceipt(printer, printData)
      }

      // Cut paper and finalize
      printer.cut()
      printer.newLine()
      printer.newLine()

      // Execute the print job
      await printer.execute()

      console.log('✅ Print job completed successfully')

      return NextResponse.json({
        success: true,
        message: 'Print job completed successfully',
        printerIP,
        printType,
        timestamp: new Date().toISOString()
      })

    } catch (printError) {
      console.error('❌ Printing failed:', printError)

      // Try to provide helpful error messages
      let errorMessage = 'Unknown error'
      if (printError instanceof Error) {
        if (printError.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to printer - check IP address and network'
        } else if (printError.message.includes('timeout')) {
          errorMessage = 'Printer connection timeout - printer may be offline'
        } else {
          errorMessage = printError.message
        }
      }

      return NextResponse.json({
        error: `Printing failed: ${errorMessage}`,
        printerIP,
        printType
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json({ 
      error: 'Server error' 
    }, { status: 500 })
  }
}

// Print kitchen order using thermal printer
async function printKitchenOrder(printer: any, printData: any) {
  // Header
  printer.alignCenter()
  printer.bold(true)
  printer.println('*** KITCHEN ORDER ***')
  printer.bold(false)
  printer.newLine()

  // Order info
  printer.alignLeft()
  printer.println(`Order: ${printData.orderNumber || printData.orderId || 'Unknown'}`)
  printer.println(`Table: ${printData.tableName || 'Unknown'}`)
  printer.println(`Time: ${new Date().toLocaleString('da-DK')}`)
  printer.newLine()

  // Separator
  printer.println(''.padEnd(48, '-'))
  printer.newLine()

  // Items
  if (printData.items && printData.items.length > 0) {
    printData.items.forEach((item: any) => {
      printer.println(`${item.quantity}x ${item.name}`)
      if (item.specialInstructions) {
        printer.println(`   Note: ${item.specialInstructions}`)
      }
      printer.newLine()
    })
  }

  // Footer
  printer.println(''.padEnd(48, '-'))
  printer.println('Please prepare this order')
  printer.println('Thank you!')
}

// Print customer receipt using thermal printer
async function printCustomerReceipt(printer: any, printData: any) {
  // Header
  printer.alignCenter()
  printer.bold(true)
  printer.println('*** RECEIPT ***')
  printer.bold(false)
  printer.newLine()

  // Order info
  printer.alignLeft()
  printer.println(`Order: ${printData.orderNumber || printData.orderId || 'Unknown'}`)
  printer.println(`Table: ${printData.tableName || 'Unknown'}`)
  printer.println(`Time: ${new Date().toLocaleString('da-DK')}`)
  printer.newLine()

  // Separator
  printer.println(''.padEnd(48, '-'))
  printer.newLine()

  // Items with prices
  let total = 0
  if (printData.items && printData.items.length > 0) {
    printData.items.forEach((item: any) => {
      const itemTotal = item.totalPrice || (item.quantity * item.unitPrice)
      total += itemTotal

      printer.println(`${item.quantity}x ${item.name}`)
      printer.println(`   ${(item.unitPrice || 0).toFixed(2)} DKK each`)
      printer.println(`   ${itemTotal.toFixed(2)} DKK`)
      printer.newLine()
    })
  }

  // Total
  printer.println(''.padEnd(48, '-'))
  printer.bold(true)
  printer.println(`TOTAL: ${total.toFixed(2)} DKK`)
  printer.bold(false)
  printer.newLine()

  // Footer
  printer.println('Thank you for your order!')
  printer.println('Please come again!')
}

// Text preview functions for debugging
function buildKitchenOrderText(printData: any): string {
  const lines = [
    '*** KITCHEN ORDER ***',
    '',
    `Order: ${printData.orderNumber || printData.orderId || 'Unknown'}`,
    `Table: ${printData.tableName || 'Unknown'}`,
    `Time: ${new Date().toLocaleString('da-DK')}`,
    '',
    '--- ITEMS ---',
    ''
  ]

  // Add items
  if (printData.items && printData.items.length > 0) {
    printData.items.forEach((item: any) => {
      lines.push(`${item.quantity}x ${item.name}`)
      if (item.specialInstructions) {
        lines.push(`   Note: ${item.specialInstructions}`)
      }
      lines.push('')
    })
  }

  lines.push('--- END ---')
  lines.push('')
  lines.push('Please prepare this order')
  lines.push('Thank you!')

  return lines.join('\n')
}

function buildCustomerReceiptText(printData: any): string {
  const lines = [
    '*** RECEIPT ***',
    '',
    `Order: ${printData.orderNumber || printData.orderId || 'Unknown'}`,
    `Table: ${printData.tableName || 'Unknown'}`,
    `Time: ${new Date().toLocaleString('da-DK')}`,
    '',
    '--- ITEMS ---',
    ''
  ]

  let total = 0

  // Add items with prices
  if (printData.items && printData.items.length > 0) {
    printData.items.forEach((item: any) => {
      const itemTotal = item.totalPrice || (item.quantity * item.unitPrice)
      total += itemTotal

      lines.push(`${item.quantity}x ${item.name}`)
      lines.push(`   ${(item.unitPrice || 0).toFixed(2)} DKK each`)
      lines.push(`   ${itemTotal.toFixed(2)} DKK`)
      lines.push('')
    })
  }

  lines.push('--- TOTAL ---')
  lines.push(`TOTAL: ${total.toFixed(2)} DKK`)
  lines.push('')
  lines.push('Thank you for your order!')
  lines.push('Please come again!')

  return lines.join('\n')
}

