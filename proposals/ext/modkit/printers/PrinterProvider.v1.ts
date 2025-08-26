/**
 * Printer Provider Interface v1.0
 * 
 * Defines the contract for all printer implementations.
 * This interface allows for pluggable printer backends (WebPRNT, USB, Bluetooth, etc.)
 */

export interface PrinterOptions {
  /** Printer connection settings */
  url?: string
  /** Paper width in characters (default: 48) */
  paperWidth?: number
  /** Enable/disable automatic paper cut */
  autoCut?: boolean
  /** Additional printer-specific options */
  [key: string]: any
}

export interface PrinterProvider {
  /**
   * Print a receipt with the given lines
   * @param lines Array of text lines to print
   * @param opts Printer-specific options
   */
  printReceipt(lines: string[], opts?: PrinterOptions): Promise<void>

  /**
   * Test printer connectivity
   * @param opts Connection options
   */
  testConnection?(opts?: PrinterOptions): Promise<boolean>

  /**
   * Get printer status information
   */
  getStatus?(): Promise<{
    online: boolean
    paperStatus: 'ok' | 'low' | 'out'
    errors: string[]
  }>
}

/**
 * Printer configuration for kitchen/bar assignments
 */
export interface PrinterConfig {
  id: string
  name: string
  type: 'webprnt' | 'usb' | 'bluetooth' | 'ethernet'
  connectionString: string // URL for WebPRNT, device path for USB, etc.
  
  /** Rooms this printer is responsible for */
  assignedRooms: string[]
  
  /** Product categories this printer should handle */
  assignedCategories: string[]
  
  /** Product types this printer should handle */
  assignedProductTypes: string[]
  
  /** Whether this printer is active */
  enabled: boolean
  
  /** Printer-specific settings */
  settings: PrinterOptions
}
