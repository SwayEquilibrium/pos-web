/**
 * Star WebPRNT Provider v1.0
 * 
 * Implementation of PrinterProvider for Star mC-Print2 and compatible printers
 * using the Star WebPRNT SDK over HTTP/HTTPS.
 */

import { PrinterProvider, PrinterOptions } from '../PrinterProvider.v1'

/**
 * Extended options for Star WebPRNT with cutting preferences
 */
export interface StarWebPRNTOptions extends PrinterOptions {
  cutMethod?: 'webprnt' | 'escpos' | 'both' | 'none'
  cutType?: 'partial' | 'full'
  feedLinesBeforeCut?: number
  feedLinesAfterCut?: number
}

/**
 * Dynamic script loader for Star WebPRNT SDK
 */
async function loadScript(src: string): Promise<void> {
  // Check if script is already loaded
  if (document.querySelector(`script[src="${src}"]`)) return

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.body.appendChild(script)
  })
}

/**
 * Load Star WebPRNT SDK scripts
 */
async function loadStarWebPRNTSDK(): Promise<void> {
  try {
    await loadScript('/vendor/webprnt/StarWebPrintBuilder.js')
    await loadScript('/vendor/webprnt/StarWebPrintTrader.js')
  } catch (error) {
    throw new Error(
      'Failed to load Star WebPRNT SDK. Please ensure StarWebPrintBuilder.js and StarWebPrintTrader.js are in public/vendor/webprnt/'
    )
  }
}

/**
 * Star WebPRNT Provider Implementation
 */
export class StarWebPRNTProvider implements PrinterProvider {
  private sdkLoaded = false

  /**
   * Ensure SDK is loaded before use
   */
  private async ensureSDKLoaded(): Promise<void> {
    if (this.sdkLoaded) return

    await loadStarWebPRNTSDK()
    
    // Verify the global objects are available
    if (!(window as any).StarWebPrintBuilder || !(window as any).StarWebPrintTrader) {
      throw new Error('Star WebPRNT SDK not properly loaded')
    }

    this.sdkLoaded = true
  }

  /**
   * Print receipt using Star WebPRNT with enhanced cutting options
   */
  async printReceipt(lines: string[], opts: StarWebPRNTOptions = {}): Promise<void> {
    await this.ensureSDKLoaded()

    const {
      url = process.env.NEXT_PUBLIC_PRINTER_URL,
      paperWidth = 48,
      autoCut = true,
      cutMethod = 'both', // Use both WebPRNT and ESC/POS for maximum compatibility
      cutType = 'partial',
      feedLinesBeforeCut = 2,
      feedLinesAfterCut = 0
    } = opts

    if (!url) {
      throw new Error('Printer URL not configured. Set NEXT_PUBLIC_PRINTER_URL or provide url in options.')
    }

    try {
      // @ts-ignore - Star WebPRNT SDK types not available
      const builder = new (window as any).StarWebPrintBuilder()
      
      // Initialize printer with proper settings
      builder.createInitializationElement({ 
        reset: true,
        type: 'initialize'
      })
      
      // Add some spacing and ensure content is substantial enough
      builder.createTextElement({ data: '\n' })
      
      // Add each line with proper formatting
      lines.forEach(line => {
        if (line.trim() === '') {
          // Empty line
          builder.createTextElement({ data: '\n' })
        } else {
          builder.createTextElement({ 
            data: line + '\n',
            emphasis: line.includes('TEST') || line.includes('---'),
            invert: false,
            underline: line.includes('---'),
            alignment: 'left'
          })
        }
      })

      // Add extra spacing before cut
      builder.createTextElement({ data: '\n\n' })
      
      // Apply cutting based on configuration
      if (autoCut && cutMethod !== 'none') {
        // Add feed before cutting to ensure paper comes out properly
        if (feedLinesBeforeCut > 0) {
          builder.createFeedElement({ line: feedLinesBeforeCut })
        }
        
        // Method 1: Use WebPRNT's createCutPaperElement
        if (cutMethod === 'webprnt' || cutMethod === 'both') {
          builder.createCutPaperElement({ 
            type: cutType, 
            feed: true 
          })
        }
        
        // Method 2: Use manual ESC/POS cut commands for better compatibility
        if (cutMethod === 'escpos' || cutMethod === 'both') {
          if (cutType === 'partial') {
            // ESC 'm' (1B 6D) is the standard partial cut command for Star printers
            builder.createTextElement({ 
              data: String.fromCharCode(0x1B, 0x6D) // ESC m - partial cut
            })
          } else {
            // ESC 'i' (1B 69) is the full cut command
            builder.createTextElement({ 
              data: String.fromCharCode(0x1B, 0x69) // ESC i - full cut
            })
          }
        }
        
        // Add feed after cutting if specified
        if (feedLinesAfterCut > 0) {
          builder.createFeedElement({ line: feedLinesAfterCut })
        }
      }

      // Create trader and send
      // @ts-ignore - Star WebPRNT SDK types not available
      const trader = new (window as any).StarWebPrintTrader({ url })
      
      const request = builder.toString()
      
      return new Promise<void>((resolve, reject) => {
        // Set timeout for the print request
        const timeout = setTimeout(() => {
          reject(new Error(`Print timeout: No response from printer at ${url}`))
        }, 10000) // 10 second timeout

        trader.onReceive = (response: any) => {
          clearTimeout(timeout)
          console.log('Printer response:', response)
          console.log('Response type:', typeof response)
          console.log('Response keys:', response ? Object.keys(response) : 'null')
          
          // Star WebPRNT can return different response formats
          // Check for various success indicators
          if (response) {
            // Check for explicit success
            if (response.tradeResult === 'Success' || 
                response.success === true || 
                response.success === 'true' ||
                (typeof response === 'string' && response.includes('success>true'))) {
              resolve()
              return
            }
            
            // If we have a response but no clear success/failure, treat as success
            // (Some Star printers just return status without explicit success flag)
            if (response.status || response.code !== undefined || response.tradeResult) {
              console.log('Treating response as success based on status/code presence')
              resolve()
              return
            }
          }
          
          const errorMsg = response ? (response.tradeResult || response.error || 'Unknown response format') : 'No response from printer'
          reject(new Error(`Print failed: ${errorMsg}`))
        }

        trader.onError = (error: any) => {
          clearTimeout(timeout)
          console.error('Printer error:', error)
          console.error('Error type:', typeof error)
          console.error('Error keys:', error ? Object.keys(error) : 'null')
          
          const errorMsg = error ? (error.status || error.message || JSON.stringify(error)) : 'Connection failed'
          reject(new Error(`Print error: ${errorMsg}`))
        }

        try {
          trader.sendMessage({ request })
        } catch (error) {
          clearTimeout(timeout)
          reject(new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      })

    } catch (error) {
      throw new Error(`Star WebPRNT print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Print both customer receipt and kitchen order with partial cuts between
   */
  async printDualReceipt(
    customerLines: string[], 
    kitchenLines: string[], 
    opts: StarWebPRNTOptions = {}
  ): Promise<void> {
    await this.ensureSDKLoaded()

    const {
      url = process.env.NEXT_PUBLIC_PRINTER_URL,
      cutMethod = 'escpos', // Use ESC/POS for reliable cutting
      cutType = 'partial',
      feedLinesBeforeCut = 2
    } = opts

    if (!url) {
      throw new Error('Printer URL not configured. Set NEXT_PUBLIC_PRINTER_URL or provide url in options.')
    }

    try {
      // @ts-ignore - Star WebPRNT SDK types not available
      const builder = new (window as any).StarWebPrintBuilder()
      
      // Initialize printer
      builder.createInitializationElement({ 
        reset: true,
        type: 'initialize'
      })
      
      // === CUSTOMER RECEIPT ===
      builder.createTextElement({ data: '\n' })
      
      customerLines.forEach(line => {
        if (line.trim() === '') {
          builder.createTextElement({ data: '\n' })
        } else {
          builder.createTextElement({ 
            data: line + '\n',
            emphasis: line.includes('RECEIPT') || line.includes('TOTAL') || line.includes('---'),
            alignment: 'left'
          })
        }
      })

      // Add spacing and partial cut after customer receipt
      builder.createTextElement({ data: '\n\n' })
      if (feedLinesBeforeCut > 0) {
        builder.createFeedElement({ line: feedLinesBeforeCut })
      }
      
      // Partial cut using ESC/POS command (1B 6D)
      if (cutMethod === 'escpos' || cutMethod === 'both') {
        builder.createTextElement({ 
          data: String.fromCharCode(0x1B, 0x6D) // ESC m - partial cut
        })
      }
      
      // === KITCHEN ORDER ===
      builder.createTextElement({ data: '\n\n' })
      
      kitchenLines.forEach(line => {
        if (line.trim() === '') {
          builder.createTextElement({ data: '\n' })
        } else {
          builder.createTextElement({ 
            data: line + '\n',
            emphasis: line.includes('KITCHEN') || line.includes('ORDER') || line.includes('---'),
            alignment: 'left'
          })
        }
      })

      // Final spacing and cut after kitchen order
      builder.createTextElement({ data: '\n\n' })
      if (feedLinesBeforeCut > 0) {
        builder.createFeedElement({ line: feedLinesBeforeCut })
      }
      
      // Final partial cut
      if (cutMethod === 'escpos' || cutMethod === 'both') {
        builder.createTextElement({ 
          data: String.fromCharCode(0x1B, 0x6D) // ESC m - partial cut
        })
      }

      // Create trader and send
      // @ts-ignore - Star WebPRNT SDK types not available
      const trader = new (window as any).StarWebPrintTrader({ url })
      
      const request = builder.toString()
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Dual print timeout: No response from printer at ${url}`))
        }, 15000) // 15 second timeout for dual printing

        trader.onReceive = (response: any) => {
          clearTimeout(timeout)
          console.log('Dual printer response:', response)
          
          if (response) {
            if (response.tradeResult === 'Success' || 
                response.success === true || 
                response.success === 'true' ||
                (typeof response === 'string' && response.includes('success>true'))) {
              resolve()
              return
            }
            
            if (response.status || response.code !== undefined || response.tradeResult) {
              console.log('Treating dual print response as success based on status/code presence')
              resolve()
              return
            }
          }
          
          const errorMsg = response ? (response.tradeResult || response.error || 'Unknown response format') : 'No response from printer'
          reject(new Error(`Dual print failed: ${errorMsg}`))
        }

        trader.onError = (error: any) => {
          clearTimeout(timeout)
          console.error('Dual printer error:', error)
          const errorMsg = error ? (error.status || error.message || JSON.stringify(error)) : 'Connection failed'
          reject(new Error(`Dual print error: ${errorMsg}`))
        }

        try {
          trader.sendMessage({ request })
        } catch (error) {
          clearTimeout(timeout)
          reject(new Error(`Failed to send dual print message: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      })

    } catch (error) {
      throw new Error(`Star WebPRNT dual print failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Test printer connectivity
   */
  async testConnection(opts: StarWebPRNTOptions = {}): Promise<boolean> {
    try {
      await this.printReceipt([
        '--- PRINTER TEST ---',
        '',
        'Connection: OK',
        'Time: ' + new Date().toLocaleString(),
        '',
        'Star WebPRNT Working!',
        ''
      ], opts)
      return true
    } catch (error) {
      console.error('Printer connection test failed:', error)
      return false
    }
  }

  /**
   * Get printer status (basic implementation)
   * Note: Star WebPRNT has limited status reporting capabilities
   */
  async getStatus(): Promise<{ online: boolean; paperStatus: 'ok' | 'low' | 'out'; errors: string[] }> {
    try {
      const isOnline = await this.testConnection()
      return {
        online: isOnline,
        paperStatus: 'ok', // WebPRNT doesn't provide detailed paper status
        errors: []
      }
    } catch (error) {
      return {
        online: false,
        paperStatus: 'ok',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

// Export singleton instance
export const starWebPRNTProvider = new StarWebPRNTProvider()

// Auto-register with registry if available
try {
  const { registerPrinterProvider } = require('../registry.v1')
  registerPrinterProvider('webprnt', starWebPRNTProvider)
} catch (error) {
  // Registry not available, ignore
}
