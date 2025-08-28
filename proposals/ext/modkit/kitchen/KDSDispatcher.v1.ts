// Kitchen Display System (KDS) Dispatcher v1.0
// Interface for routing orders to kitchen displays

export interface KDSContext {
  tenantId: string
  locationId: string
  userId: string
  correlationId: string
}

export interface KDSStation {
  id: string
  name: string
  type: 'prep' | 'grill' | 'fryer' | 'salad' | 'dessert' | 'drinks' | 'expo'
  location: string
  displayConfig: {
    columns: number
    maxOrders: number
    autoAdvance: boolean
    showTimes: boolean
    colorCoding: boolean
  }
  categories: string[] // Product categories handled by this station
  active: boolean
  lastHeartbeat?: Date
}

export interface KDSOrderItem {
  id: string
  orderId: string
  orderNumber: string
  itemName: string
  quantity: number
  modifiers: string[]
  specialInstructions?: string
  allergens?: string[]
  priority: 'normal' | 'rush' | 'vip'
  estimatedTime: number // minutes
  startedAt?: Date
  completedAt?: Date
  station: string
  course: number
}

export interface KDSOrder {
  id: string
  orderNumber: string
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  table?: string
  customer?: string
  items: KDSOrderItem[]
  receivedAt: Date
  estimatedReady: Date
  status: 'new' | 'in_progress' | 'ready' | 'completed'
  priority: 'normal' | 'rush' | 'vip'
  specialInstructions?: string
}

export interface KDSMessage {
  id: string
  type: 'order_received' | 'order_updated' | 'item_started' | 'item_completed' | 'order_ready' | 'system_message'
  stationId?: string // If targeted to specific station
  orderId?: string
  data: any
  timestamp: Date
  expiresAt?: Date
}

export interface KDSDispatcher {
  readonly name: string
  readonly version: string
  readonly supportedStations: KDSStation['type'][]
  
  // Station management
  getStations(context: KDSContext): Promise<KDSStation[]>
  
  getStationStatus(
    stationId: string,
    context: KDSContext
  ): Promise<{
    online: boolean
    orderCount: number
    avgWaitTime: number // minutes
    lastActivity: Date
    errors?: string[]
  }>
  
  // Order dispatch
  dispatchOrder(
    order: KDSOrder,
    context: KDSContext
  ): Promise<{
    success: boolean
    dispatchedTo: string[] // station IDs
    estimatedReady: Date
    error?: string
  }>
  
  updateOrderStatus(
    orderId: string,
    status: KDSOrder['status'],
    context: KDSContext
  ): Promise<void>
  
  updateItemStatus(
    itemId: string,
    status: 'started' | 'completed',
    context: KDSContext
  ): Promise<void>
  
  // Real-time messaging
  sendMessage(
    message: KDSMessage,
    context: KDSContext
  ): Promise<{
    success: boolean
    deliveredTo: string[] // station IDs
    error?: string
  }>
  
  // Station communication
  heartbeat(
    stationId: string,
    status: {
      orderCount: number
      lastOrderTime?: Date
      errors?: string[]
    },
    context: KDSContext
  ): Promise<void>
  
  // Analytics and monitoring
  getStationMetrics(
    stationId: string,
    timeRange: { start: Date; end: Date },
    context: KDSContext
  ): Promise<{
    ordersProcessed: number
    avgProcessingTime: number // minutes
    peakOrderCount: number
    utilizationPercentage: number
    errorCount: number
  }>
  
  getKitchenPerformance(
    timeRange: { start: Date; end: Date },
    context: KDSContext
  ): Promise<{
    totalOrders: number
    avgTicketTime: number // minutes
    onTimePercentage: number
    stationBottlenecks: Array<{
      stationId: string
      avgWaitTime: number
      backlogCount: number
    }>
  }>
  
  // Configuration
  validateConfiguration(config: Record<string, any>): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  healthCheck(context: KDSContext): Promise<{
    healthy: boolean
    details?: string
    stationHealth: Record<string, boolean>
  }>
}

// Stub implementation for interface demonstration
export class MockKDSDispatcher implements KDSDispatcher {
  readonly name = 'mock-kds'
  readonly version = '1.0.0'
  readonly supportedStations: KDSStation['type'][] = ['prep', 'grill', 'expo']
  
  async getStations(context: KDSContext): Promise<KDSStation[]> {
    // Return mock stations
    return [
      {
        id: 'prep-1',
        name: 'Prep Station',
        type: 'prep',
        location: 'Kitchen',
        displayConfig: {
          columns: 3,
          maxOrders: 12,
          autoAdvance: false,
          showTimes: true,
          colorCoding: true
        },
        categories: ['salads', 'appetizers'],
        active: true
      }
    ]
  }
  
  async getStationStatus(stationId: string, context: KDSContext) {
    return {
      online: true,
      orderCount: 3,
      avgWaitTime: 8,
      lastActivity: new Date()
    }
  }
  
  async dispatchOrder(order: KDSOrder, context: KDSContext) {
    return {
      success: true,
      dispatchedTo: ['prep-1', 'grill-1'],
      estimatedReady: new Date(Date.now() + 15 * 60 * 1000)
    }
  }
  
  async updateOrderStatus(orderId: string, status: KDSOrder['status'], context: KDSContext) {
    // Mock implementation
  }
  
  async updateItemStatus(itemId: string, status: 'started' | 'completed', context: KDSContext) {
    // Mock implementation
  }
  
  async sendMessage(message: KDSMessage, context: KDSContext) {
    return {
      success: true,
      deliveredTo: ['prep-1', 'grill-1']
    }
  }
  
  async heartbeat(stationId: string, status: any, context: KDSContext) {
    // Mock implementation
  }
  
  async getStationMetrics(stationId: string, timeRange: any, context: KDSContext) {
    return {
      ordersProcessed: 45,
      avgProcessingTime: 12,
      peakOrderCount: 8,
      utilizationPercentage: 75,
      errorCount: 2
    }
  }
  
  async getKitchenPerformance(timeRange: any, context: KDSContext) {
    return {
      totalOrders: 156,
      avgTicketTime: 18,
      onTimePercentage: 87,
      stationBottlenecks: [
        {
          stationId: 'grill-1',
          avgWaitTime: 22,
          backlogCount: 5
        }
      ]
    }
  }
  
  validateConfiguration(config: Record<string, any>) {
    return { valid: true, errors: [] }
  }
  
  async healthCheck(context: KDSContext) {
    return {
      healthy: true,
      stationHealth: {
        'prep-1': true,
        'grill-1': true
      }
    }
  }
}


