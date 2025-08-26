/**
 * Star CloudPRNT Provider v1.0
 * 
 * CloudPRNT implementation for Star printers using polling-based architecture.
 * More reliable than WebPRNT as it doesn't require direct HTTP access to printers.
 */

import { PrinterProvider } from '../PrinterProvider.v1'

export interface CloudPRNTOptions {
  printerId?: string
  contentType?: string
  orderId?: string
  receiptType?: string
}

export class StarCloudPRNTProvider implements PrinterProvider {
  private defaultPrinterId: string

  constructor(defaultPrinterId: string = 'tsp100-kitchen') {
    this.defaultPrinterId = defaultPrinterId
  }

  /**
   * Print receipt by enqueuing job in CloudPRNT queue
   */
  async printReceipt(lines: string[], opts: CloudPRNTOptions = {}): Promise<void> {
    const printerId = opts.printerId || this.defaultPrinterId
    const payload = lines.join('\n')

    console.log(`🖨️ Enqueuing CloudPRNT job for printer: ${printerId}`)

    try {
      const response = await fetch('/api/cloudprnt/enqueue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerId,
          payload,
          contentType: opts.contentType || 'text/plain',
          orderId: opts.orderId,
          receiptType: opts.receiptType
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`CloudPRNT enqueue failed: ${error.error || response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ CloudPRNT job enqueued: ${result.jobId}`)

    } catch (error) {
      console.error('❌ CloudPRNT print failed:', error)
      throw new Error(`CloudPRNT print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Test connection by enqueuing a simple test job
   */
  async testConnection(opts: CloudPRNTOptions = {}): Promise<boolean> {
    try {
      const testLines = [
        '*** CLOUDPRNT TEST ***',
        '',
        'Connection: OK',
        `Time: ${new Date().toLocaleString()}`,
        `Printer: ${opts.printerId || this.defaultPrinterId}`,
        '',
        'Star CloudPRNT Working!',
        '',
        '*** END TEST ***'
      ]

      await this.printReceipt(testLines, {
        ...opts,
        receiptType: 'test'
      })

      return true
    } catch (error) {
      console.error('CloudPRNT connection test failed:', error)
      return false
    }
  }

  /**
   * Get printer status by checking recent job queue
   */
  async getStatus(opts: CloudPRNTOptions = {}): Promise<any> {
    const printerId = opts.printerId || this.defaultPrinterId

    try {
      const response = await fetch(`/api/cloudprnt/enqueue?printerId=${printerId}`)
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        printerId,
        connected: true,
        queuedJobs: data.jobs?.filter((j: any) => j.status === 'QUEUED').length || 0,
        recentJobs: data.jobs?.length || 0,
        summary: data.summary,
        lastPolled: data.timestamp
      }

    } catch (error) {
      console.error('CloudPRNT status check failed:', error)
      return {
        printerId,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Print kitchen receipt with proper formatting
   */
  async printKitchenReceipt(
    orderItems: Array<{
      name: string
      quantity: number
      modifiers?: string[]
      course?: number
    }>,
    orderInfo: {
      orderId: string
      tableId?: string | null
      orderNumber?: string
      orderType?: 'dine_in' | 'takeaway'
      customerName?: string
    },
    opts: CloudPRNTOptions = {}
  ): Promise<void> {
    const lines: string[] = []

    // Header
    lines.push('================================')
    lines.push('       KITCHEN ORDER')
    lines.push('================================')
    lines.push('')

    // Order info
    if (orderInfo.orderType === 'dine_in' && orderInfo.tableId) {
      lines.push(`TABLE: ${orderInfo.tableId}`)
    } else if (orderInfo.orderType === 'takeaway') {
      lines.push(`TAKEAWAY: ${orderInfo.orderNumber || orderInfo.orderId.slice(-6)}`)
      if (orderInfo.customerName) {
        lines.push(`Customer: ${orderInfo.customerName}`)
      }
    }
    
    lines.push(`Time: ${new Date().toLocaleString()}`)
    lines.push(`Order: ${orderInfo.orderId.slice(-8)}`)
    lines.push('')
    lines.push('--------------------------------')

    // Items grouped by course
    const itemsByCourse = orderItems.reduce((acc, item) => {
      const course = item.course || 1
      if (!acc[course]) acc[course] = []
      acc[course].push(item)
      return acc
    }, {} as Record<number, typeof orderItems>)

    Object.keys(itemsByCourse)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(courseStr => {
        const course = parseInt(courseStr)
        const items = itemsByCourse[course]

        if (Object.keys(itemsByCourse).length > 1) {
          lines.push(`*** COURSE ${course} ***`)
          lines.push('')
        }

        items.forEach(item => {
          lines.push(`${item.quantity}x ${item.name}`)
          
          if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(modifier => {
              lines.push(`   - ${modifier}`)
            })
          }
          lines.push('')
        })
      })

    // Footer
    lines.push('--------------------------------')
    if (orderInfo.orderType === 'dine_in' && orderInfo.tableId) {
      lines.push(`TABLE: ${orderInfo.tableId}`)
    } else if (orderInfo.orderType === 'takeaway') {
      lines.push(`TAKEAWAY: ${orderInfo.orderNumber || orderInfo.orderId.slice(-6)}`)
    }
    lines.push('================================')

    await this.printReceipt(lines, {
      ...opts,
      orderId: orderInfo.orderId,
      receiptType: 'kitchen'
    })
  }
}

// Default instance
export const starCloudPRNTProvider = new StarCloudPRNTProvider('tsp100-kitchen')
