/**
 * Printer Registry v1.0
 * 
 * Manages printer provider registration and retrieval.
 * Allows for runtime registration of different printer implementations.
 */

import { PrinterProvider, PrinterConfig } from './PrinterProvider.v1'

// Global registry of printer providers by type
const printerProviders: Record<string, PrinterProvider> = {}

// Global registry of printer configurations
const printerConfigs: Record<string, PrinterConfig> = {}

/**
 * Register a printer provider implementation
 */
export function registerPrinterProvider(type: string, provider: PrinterProvider): void {
  printerProviders[type] = provider
}

/**
 * Get a printer provider by type
 */
export function getPrinterProvider(type: string): PrinterProvider | undefined {
  return printerProviders[type]
}

/**
 * Get all registered printer provider types
 */
export function getRegisteredProviderTypes(): string[] {
  return Object.keys(printerProviders)
}

/**
 * Register a printer configuration
 */
export function registerPrinterConfig(config: PrinterConfig): void {
  printerConfigs[config.id] = config
}

/**
 * Get a printer configuration by ID
 */
export function getPrinterConfig(id: string): PrinterConfig | undefined {
  return printerConfigs[id]
}

/**
 * Get all printer configurations
 */
export function getAllPrinterConfigs(): PrinterConfig[] {
  return Object.values(printerConfigs)
}

/**
 * Get printers assigned to a specific room
 */
export function getPrintersForRoom(roomId: string): PrinterConfig[] {
  return Object.values(printerConfigs).filter(
    config => config.enabled && config.assignedRooms.includes(roomId)
  )
}

/**
 * Get printers assigned to a specific category
 */
export function getPrintersForCategory(category: string): PrinterConfig[] {
  return Object.values(printerConfigs).filter(
    config => config.enabled && config.assignedCategories.includes(category)
  )
}

/**
 * Get printers assigned to a specific product type
 */
export function getPrintersForProductType(productType: string): PrinterConfig[] {
  return Object.values(printerConfigs).filter(
    config => config.enabled && config.assignedProductTypes.includes(productType)
  )
}

/**
 * Update a printer configuration
 */
export function updatePrinterConfig(id: string, updates: Partial<PrinterConfig>): boolean {
  if (!printerConfigs[id]) return false
  
  printerConfigs[id] = { ...printerConfigs[id], ...updates }
  return true
}

/**
 * Remove a printer configuration
 */
export function removePrinterConfig(id: string): boolean {
  if (!printerConfigs[id]) return false
  
  delete printerConfigs[id]
  return true
}

/**
 * Print to all printers matching the given criteria
 */
export async function printToMatchingPrinters(
  lines: string[],
  criteria: {
    roomId?: string
    category?: string
    productType?: string
  }
): Promise<{ success: string[], failed: string[] }> {
  const matchingConfigs = Object.values(printerConfigs).filter(config => {
    if (!config.enabled) return false
    
    if (criteria.roomId && !config.assignedRooms.includes(criteria.roomId)) return false
    if (criteria.category && !config.assignedCategories.includes(criteria.category)) return false
    if (criteria.productType && !config.assignedProductTypes.includes(criteria.productType)) return false
    
    return true
  })

  const results = await Promise.allSettled(
    matchingConfigs.map(async config => {
      const provider = getPrinterProvider(config.type)
      if (!provider) throw new Error(`No provider for printer type: ${config.type}`)
      
      await provider.printReceipt(lines, {
        ...config.settings,
        url: config.connectionString
      })
      
      return config.id
    })
  )

  const success: string[] = []
  const failed: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      success.push(result.value)
    } else {
      failed.push(matchingConfigs[index].id)
      console.error(`Printer ${matchingConfigs[index].id} failed:`, result.reason)
    }
  })

  return { success, failed }
}
