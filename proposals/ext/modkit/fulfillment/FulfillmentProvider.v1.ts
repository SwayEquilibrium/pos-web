// Fulfillment Provider SPI v1.0
// Pluggable order fulfillment and delivery scheduling

export interface FulfillmentContext {
  tenantId: string
  locationId: string
  userId: string
  correlationId: string
}

export interface TimeSlot {
  startTime: Date
  endTime: Date
  duration: number // minutes
}

export interface FulfillmentSlot {
  id: string
  date: Date
  timeSlot: TimeSlot
  type: 'pickup' | 'delivery' | 'dine_in'
  maxCapacity: number
  currentBookings: number
  available: number
  preparationTime: number // minutes
  location?: {
    id: string
    name: string
    address: string
  }
  deliveryZone?: {
    id: string
    name: string
    radius: number // meters
    fee: number // minor units
  }
  metadata?: Record<string, any>
}

export interface FulfillmentRequest {
  context: FulfillmentContext
  orderId: string
  orderType: 'pickup' | 'delivery' | 'dine_in'
  requestedTime?: Date
  slotId?: string // If pre-selected
  
  customer: {
    name: string
    phone?: string
    email?: string
    address?: {
      street: string
      city: string
      postalCode: string
      country: string
      coordinates?: { lat: number; lng: number }
    }
  }
  
  items: Array<{
    productId: string
    name: string
    quantity: number
    preparationTime: number // minutes
    category: string
    specialInstructions?: string
  }>
  
  specialRequirements?: {
    allergens?: string[]
    dietary?: string[]
    instructions?: string
  }
}

export interface FulfillmentResult {
  success: boolean
  fulfillmentId: string
  scheduledSlot: FulfillmentSlot
  estimatedReady: Date
  estimatedDelivery?: Date
  confirmationCode: string
  instructions?: string
  deliveryFee?: number
  error?: {
    code: string
    message: string
    suggestedSlots?: FulfillmentSlot[]
  }
}

export interface FulfillmentStatus {
  fulfillmentId: string
  status: 'scheduled' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
  estimatedReady: Date
  actualReady?: Date
  estimatedDelivery?: Date
  actualDelivery?: Date
  location?: {
    lat: number
    lng: number
    updatedAt: Date
  }
  notes?: string
  timeline: Array<{
    status: string
    timestamp: Date
    notes?: string
    userId?: string
  }>
}

export interface DeliveryQuote {
  canDeliver: boolean
  fee: number // minor units
  estimatedDuration: number // minutes
  distance: number // meters
  zone?: {
    id: string
    name: string
  }
  restrictions?: string[]
}

export interface FulfillmentProvider {
  readonly name: string
  readonly version: string
  readonly supportedTypes: Array<'pickup' | 'delivery' | 'dine_in'>
  readonly supportedLocations: string[] // location IDs
  
  // Slot management
  getAvailableSlots(
    context: FulfillmentContext,
    filters: {
      date: Date
      type: 'pickup' | 'delivery' | 'dine_in'
      partySize?: number
      duration?: number
    }
  ): Promise<FulfillmentSlot[]>
  
  quoteSlots(
    context: FulfillmentContext,
    request: Omit<FulfillmentRequest, 'slotId'>
  ): Promise<{
    availableSlots: FulfillmentSlot[]
    recommendedSlot?: FulfillmentSlot
    totalPreparationTime: number
  }>
  
  reserveSlot(
    slotId: string, 
    orderId: string, 
    context: FulfillmentContext
  ): Promise<{
    success: boolean
    reservationId?: string
    expiresAt?: Date
    error?: string
  }>
  
  releaseSlot(
    slotId: string, 
    orderId: string, 
    context: FulfillmentContext
  ): Promise<boolean>
  
  // Fulfillment scheduling
  scheduleFulfillment(request: FulfillmentRequest): Promise<FulfillmentResult>
  
  updateFulfillment(
    fulfillmentId: string, 
    updates: Partial<FulfillmentRequest>,
    context: FulfillmentContext
  ): Promise<FulfillmentResult>
  
  cancelFulfillment(
    fulfillmentId: string, 
    reason: string,
    context: FulfillmentContext
  ): Promise<{
    success: boolean
    refundEligible: boolean
    cancellationFee?: number
  }>
  
  // Status tracking
  getFulfillmentStatus(
    fulfillmentId: string,
    context: FulfillmentContext
  ): Promise<FulfillmentStatus>
  
  updateFulfillmentStatus(
    fulfillmentId: string,
    status: FulfillmentStatus['status'],
    notes?: string,
    context?: FulfillmentContext
  ): Promise<void>
  
  // Delivery specific (optional)
  quoteDelivery?(
    address: string,
    context: FulfillmentContext
  ): Promise<DeliveryQuote>
  
  trackDelivery?(
    fulfillmentId: string,
    context: FulfillmentContext
  ): Promise<{
    currentLocation?: { lat: number; lng: number }
    estimatedArrival: Date
    driverInfo?: {
      name: string
      phone: string
      photo?: string
    }
  }>
  
  // Capacity management
  getCapacityUtilization(
    context: FulfillmentContext,
    dateRange: { start: Date; end: Date }
  ): Promise<Array<{
    date: Date
    type: 'pickup' | 'delivery' | 'dine_in'
    totalCapacity: number
    bookedCapacity: number
    utilizationPercentage: number
  }>>
  
  // Configuration and health
  validateConfiguration(config: Record<string, any>): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  healthCheck(context: FulfillmentContext): Promise<{
    healthy: boolean
    details?: string
    capabilities: {
      canSchedule: boolean
      canTrack: boolean
      canDeliver: boolean
    }
  }>
}
