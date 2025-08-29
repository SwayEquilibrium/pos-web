import { NextRequest, NextResponse } from 'next/server'
import ThermalPrinter from 'node-thermal-printer'

export async function POST(request: NextRequest) {
  try {
    const { printerIP, printData, printType = 'kitchen' } = await request.json()
    
    if (!printerIP || !printData) {
      return NextResponse.json({ 
        error: 'Printer IP and print data are required' 
      }, { status: 400 })
    }
    
    console.log(`🖨️ Printing ${printType} order to ${printerIP}`)
    console.log('📋 Print data:', printData)
    
    // Create printer instance
    const printer = new ThermalPrinter.printer({
      type: ThermalPrinter.types.STAR,
      interface: `tcp://${printerIP}:9100`,
      options: {
        timeout: 5000
      }
    })
    
    try {
      // Build simple receipt content
      let receiptContent = ''
      
      if (printType === 'kitchen') {
        // Kitchen order format
        receiptContent = buildKitchenOrder(printData)
      } else {
        // Customer receipt format
        receiptContent = buildCustomerReceipt(printData)
      }
      
      console.log('📋 Receipt content:', receiptContent)
      
      // Send to printer
      printer.alignCenter()
      printer.bold(true)
      printer.println(receiptContent)
      printer.bold(false)
      printer.alignLeft()
      printer.cut()
      
      await printer.execute()
      
      console.log('✅ Print job completed successfully')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Print job completed',
        printerIP,
        printType
      })
      
    } catch (printError) {
      console.error('❌ Printing failed:', printError)
      return NextResponse.json({ 
        error: `Printing failed: ${printError instanceof Error ? printError.message : 'Unknown error'}`,
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

// Simple kitchen order builder
function buildKitchenOrder(printData: any): string {
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
  lines.push('')
  lines.push('')
  lines.push('')
  
  return lines.join('\n')
}

// Simple customer receipt builder
function buildCustomerReceipt(printData: any): string {
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
      lines.push(`   ${item.unitPrice?.toFixed(2) || '0.00'} DKK each`)
      lines.push(`   ${itemTotal.toFixed(2)} DKK`)
      lines.push('')
    })
  }
  
  lines.push('--- TOTAL ---')
  lines.push(`TOTAL: ${total.toFixed(2)} DKK`)
  lines.push('')
  lines.push('Thank you for your order!')
  lines.push('Please come again!')
  lines.push('')
  lines.push('')
  lines.push('')
  
  return lines.join('\n')
}

