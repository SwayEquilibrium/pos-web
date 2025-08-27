// Fulfillment Provider SPI v1.0
// Pluggable order fulfillment and delivery scheduling

export interface FulfillmentSlot {
  id: string
  startTime: Date
  endTime: Date
  capacity: number
  available: number
  type: 'pickup' | 'delivery'
  location?: string
}

export interface FulfillmentRequest {
  orderId: string
  orderType: 'pickup' | 'delivery'
  requestedTime?: Date
  customerInfo: {
    name: string
    phone?: string
    address?: string
  }
  items: {
    productId: string
    quantity: number
    preparationTime: number // minutes
  }[]
}

export interface FulfillmentResult {
  success: boolean
  fulfillmentId: string
  scheduledSlot: FulfillmentSlot
  estimatedReady: Date
  instructions?: string
  error?: string
}

export interface DeliveryInfo {
  address: string
  coordinates?: { lat: number; lng: number }
  deliveryFee: number
  estimatedDuration: number // minutes
}

export interface FulfillmentProvider {
  readonly name: string
  readonly version: string
  readonly supportedTypes: ('pickup' | 'delivery')[]
  
  // Slot management
  getAvailableSlots(date: Date, type: 'pickup' | 'delivery'): Promise<FulfillmentSlot[]>
  reserveSlot(slotId: string, orderId: string): Promise<boolean>
  releaseSlot(slotId: string, orderId: string): Promise<boolean>
  
  // Fulfillment scheduling
  scheduleFulfillment(request: FulfillmentRequest): Promise<FulfillmentResult>
  updateFulfillment(fulfillmentId: string, updates: Partial<FulfillmentRequest>): Promise<FulfillmentResult>
  cancelFulfillment(fulfillmentId: string, reason: string): Promise<boolean>
  
  // Delivery specific (if supported)
  calculateDeliveryFee?(address: string): Promise<number>
  getDeliveryEstimate?(address: string): Promise<DeliveryInfo>
  
  // Status tracking
  getFulfillmentStatus(fulfillmentId: string): Promise<{
    status: 'scheduled' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'
    estimatedReady: Date
    actualReady?: Date
    notes?: string
  }>
  
  // Configuration
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] }
}

