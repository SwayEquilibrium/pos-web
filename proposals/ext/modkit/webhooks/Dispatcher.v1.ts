// Webhook Dispatcher v1.0
// Pluggable webhook delivery system with retry logic

export interface WebhookContext {
  tenantId: string
  locationId?: string
  userId: string
  correlationId: string
}

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  secret: string
  active: boolean
  events: string[] // Event types to subscribe to
  headers?: Record<string, string>
  timeout: number // seconds
  retryAttempts: number
  retryBackoffMs: number
  verifySSL: boolean
  metadata?: Record<string, any>
}

export interface WebhookEvent {
  id: string
  type: string
  version: string
  timestamp: Date
  tenantId: string
  locationId?: string
  data: any
  metadata?: Record<string, any>
}

export interface WebhookDelivery {
  id: string
  endpointId: string
  eventId: string
  attempt: number
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  requestUrl: string
  requestHeaders: Record<string, string>
  requestBody: string
  responseStatus?: number
  responseHeaders?: Record<string, string>
  responseBody?: string
  duration?: number // milliseconds
  error?: string
  createdAt: Date
  deliveredAt?: Date
  nextRetryAt?: Date
}

export interface WebhookStats {
  endpointId: string
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  avgResponseTime: number
  lastDelivery?: Date
  successRate: number
}

export interface WebhookDispatcher {
  readonly name: string
  readonly version: string
  readonly supportedEvents: string[]
  
  // Endpoint management
  createEndpoint(
    endpoint: Omit<WebhookEndpoint, 'id'>,
    context: WebhookContext
  ): Promise<WebhookEndpoint>
  
  updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpoint>,
    context: WebhookContext
  ): Promise<WebhookEndpoint>
  
  deleteEndpoint(
    endpointId: string,
    context: WebhookContext
  ): Promise<void>
  
  getEndpoints(context: WebhookContext): Promise<WebhookEndpoint[]>
  
  getEndpoint(
    endpointId: string,
    context: WebhookContext
  ): Promise<WebhookEndpoint>
  
  // Event dispatch
  dispatchEvent(
    event: WebhookEvent,
    context: WebhookContext
  ): Promise<{
    success: boolean
    deliveries: Array<{
      endpointId: string
      deliveryId: string
      status: 'queued' | 'delivered' | 'failed'
    }>
    error?: string
  }>
  
  // Delivery management
  getDeliveries(
    filters: {
      endpointId?: string
      eventId?: string
      status?: WebhookDelivery['status']
      dateFrom?: Date
      dateTo?: Date
      limit?: number
    },
    context: WebhookContext
  ): Promise<WebhookDelivery[]>
  
  getDelivery(
    deliveryId: string,
    context: WebhookContext
  ): Promise<WebhookDelivery>
  
  retryDelivery(
    deliveryId: string,
    context: WebhookContext
  ): Promise<WebhookDelivery>
  
  cancelDelivery(
    deliveryId: string,
    context: WebhookContext
  ): Promise<void>
  
  // Endpoint testing
  testEndpoint(
    endpointId: string,
    sampleEvent?: WebhookEvent,
    context?: WebhookContext
  ): Promise<{
    success: boolean
    responseStatus?: number
    responseTime?: number
    error?: string
  }>
  
  validateEndpoint(endpoint: Partial<WebhookEndpoint>): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  // Statistics and monitoring
  getEndpointStats(
    endpointId: string,
    timeRange: { start: Date; end: Date },
    context: WebhookContext
  ): Promise<WebhookStats>
  
  getSystemStats(
    timeRange: { start: Date; end: Date },
    context: WebhookContext
  ): Promise<{
    totalEvents: number
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    avgResponseTime: number
    topFailingEndpoints: Array<{
      endpointId: string
      name: string
      failureRate: number
    }>
  }>
  
  // Security and verification
  generateSignature(payload: string, secret: string): string
  verifySignature(payload: string, signature: string, secret: string): boolean
  
  // Health check
  healthCheck(context: WebhookContext): Promise<{
    healthy: boolean
    details?: string
    queueDepth?: number
    avgDeliveryTime?: number
  }>
}

// Registry for webhook dispatchers
export class WebhookDispatcherRegistry {
  private dispatchers = new Map<string, WebhookDispatcher>()
  private defaultDispatcher?: string
  
  register(dispatcher: WebhookDispatcher): void {
    if (this.dispatchers.has(dispatcher.name)) {
      throw new Error(`Webhook dispatcher '${dispatcher.name}' already registered`)
    }
    this.dispatchers.set(dispatcher.name, dispatcher)
  }
  
  get(name: string): WebhookDispatcher {
    const dispatcher = this.dispatchers.get(name)
    if (!dispatcher) {
      throw new Error(`Webhook dispatcher '${name}' not found`)
    }
    return dispatcher
  }
  
  getDefault(): WebhookDispatcher {
    if (!this.defaultDispatcher) {
      throw new Error('No default webhook dispatcher set')
    }
    return this.get(this.defaultDispatcher)
  }
  
  setDefault(name: string): void {
    if (!this.dispatchers.has(name)) {
      throw new Error(`Cannot set unknown dispatcher '${name}' as default`)
    }
    this.defaultDispatcher = name
  }
  
  list(): WebhookDispatcher[] {
    return Array.from(this.dispatchers.values())
  }
}

// Default HTTP-based webhook dispatcher
export class HTTPWebhookDispatcher implements WebhookDispatcher {
  readonly name = 'http-webhook'
  readonly version = '1.0.0'
  readonly supportedEvents = [
    'order.created',
    'order.updated',
    'order.completed',
    'order.cancelled',
    'payment.processed',
    'payment.failed',
    'payment.refunded',
    'reservation.created',
    'reservation.updated',
    'reservation.cancelled'
  ]
  
  async createEndpoint(endpoint: Omit<WebhookEndpoint, 'id'>, context: WebhookContext): Promise<WebhookEndpoint> {
    const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Validate URL
    try {
      new URL(endpoint.url)
    } catch {
      throw new Error('Invalid webhook URL')
    }
    
    const newEndpoint: WebhookEndpoint = {
      id,
      ...endpoint,
      timeout: endpoint.timeout || 30,
      retryAttempts: endpoint.retryAttempts || 3,
      retryBackoffMs: endpoint.retryBackoffMs || 1000,
      verifySSL: endpoint.verifySSL !== false
    }
    
    // In real implementation, save to database
    console.log(`Created webhook endpoint ${id} for tenant ${context.tenantId}`)
    
    return newEndpoint
  }
  
  async updateEndpoint(endpointId: string, updates: Partial<WebhookEndpoint>, context: WebhookContext): Promise<WebhookEndpoint> {
    // Mock implementation - in real version, update in database
    throw new Error('Method not implemented')
  }
  
  async deleteEndpoint(endpointId: string, context: WebhookContext): Promise<void> {
    // Mock implementation - in real version, soft delete in database
    console.log(`Deleted webhook endpoint ${endpointId}`)
  }
  
  async getEndpoints(context: WebhookContext): Promise<WebhookEndpoint[]> {
    // Mock implementation - in real version, fetch from database
    return []
  }
  
  async getEndpoint(endpointId: string, context: WebhookContext): Promise<WebhookEndpoint> {
    throw new Error('Endpoint not found')
  }
  
  async dispatchEvent(event: WebhookEvent, context: WebhookContext) {
    const endpoints = await this.getEndpoints(context)
    const relevantEndpoints = endpoints.filter(ep => 
      ep.active && ep.events.includes(event.type)
    )
    
    const deliveries = await Promise.all(
      relevantEndpoints.map(async (endpoint) => {
        try {
          const delivery = await this.deliverWebhook(event, endpoint, context)
          return {
            endpointId: endpoint.id,
            deliveryId: delivery.id,
            status: delivery.status as 'queued' | 'delivered' | 'failed'
          }
        } catch (error) {
          return {
            endpointId: endpoint.id,
            deliveryId: '',
            status: 'failed' as const
          }
        }
      })
    )
    
    return {
      success: deliveries.some(d => d.status === 'delivered'),
      deliveries
    }
  }
  
  private async deliverWebhook(
    event: WebhookEvent,
    endpoint: WebhookEndpoint,
    context: WebhookContext
  ): Promise<WebhookDelivery> {
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    // Prepare payload
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      version: event.version,
      timestamp: event.timestamp.toISOString(),
      data: event.data
    })
    
    // Generate signature
    const signature = this.generateSignature(payload, endpoint.secret)
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'POS-Webhook/1.0',
      'X-Webhook-Signature': signature,
      'X-Webhook-ID': deliveryId,
      'X-Webhook-Timestamp': timestamp.toString(),
      ...endpoint.headers
    }
    
    const delivery: WebhookDelivery = {
      id: deliveryId,
      endpointId: endpoint.id,
      eventId: event.id,
      attempt: 1,
      status: 'pending',
      requestUrl: endpoint.url,
      requestHeaders: headers,
      requestBody: payload,
      createdAt: new Date()
    }
    
    try {
      const startTime = Date.now()
      
      // Make HTTP request (mock implementation)
      const response = await this.makeHttpRequest(endpoint.url, {
        method: 'POST',
        headers,
        body: payload,
        timeout: endpoint.timeout * 1000
      })
      
      delivery.status = response.status >= 200 && response.status < 300 ? 'success' : 'failed'
      delivery.responseStatus = response.status
      delivery.responseHeaders = response.headers
      delivery.responseBody = response.body
      delivery.duration = Date.now() - startTime
      delivery.deliveredAt = new Date()
      
    } catch (error) {
      delivery.status = 'failed'
      delivery.error = error instanceof Error ? error.message : 'Unknown error'
      delivery.duration = Date.now() - startTime
    }
    
    return delivery
  }
  
  private async makeHttpRequest(url: string, options: any): Promise<any> {
    // Mock HTTP request - in real implementation, use fetch or axios
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"success": true}'
    }
  }
  
  async getDeliveries(filters: any, context: WebhookContext): Promise<WebhookDelivery[]> {
    // Mock implementation
    return []
  }
  
  async getDelivery(deliveryId: string, context: WebhookContext): Promise<WebhookDelivery> {
    throw new Error('Delivery not found')
  }
  
  async retryDelivery(deliveryId: string, context: WebhookContext): Promise<WebhookDelivery> {
    throw new Error('Method not implemented')
  }
  
  async cancelDelivery(deliveryId: string, context: WebhookContext): Promise<void> {
    // Mock implementation
  }
  
  async testEndpoint(endpointId: string, sampleEvent?: WebhookEvent, context?: WebhookContext) {
    const testEvent: WebhookEvent = sampleEvent || {
      id: 'test_event',
      type: 'test.ping',
      version: '1.0',
      timestamp: new Date(),
      tenantId: context?.tenantId || 'test',
      data: { message: 'Test webhook delivery' }
    }
    
    try {
      // In real implementation, fetch endpoint and test delivery
      return {
        success: true,
        responseStatus: 200,
        responseTime: 150
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      }
    }
  }
  
  validateEndpoint(endpoint: Partial<WebhookEndpoint>) {
    const errors: string[] = []
    
    if (!endpoint.name) errors.push('Endpoint name is required')
    if (!endpoint.url) {
      errors.push('Endpoint URL is required')
    } else {
      try {
        new URL(endpoint.url)
      } catch {
        errors.push('Invalid URL format')
      }
    }
    
    if (!endpoint.secret) errors.push('Webhook secret is required')
    if (endpoint.timeout && endpoint.timeout > 300) {
      errors.push('Timeout cannot exceed 300 seconds')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  async getEndpointStats(endpointId: string, timeRange: any, context: WebhookContext): Promise<WebhookStats> {
    // Mock implementation
    return {
      endpointId,
      totalDeliveries: 156,
      successfulDeliveries: 142,
      failedDeliveries: 14,
      avgResponseTime: 245,
      successRate: 91.0
    }
  }
  
  async getSystemStats(timeRange: any, context: WebhookContext) {
    return {
      totalEvents: 1250,
      totalDeliveries: 3750,
      successfulDeliveries: 3420,
      failedDeliveries: 330,
      avgResponseTime: 285,
      topFailingEndpoints: [
        {
          endpointId: 'wh_123',
          name: 'Legacy System',
          failureRate: 15.2
        }
      ]
    }
  }
  
  generateSignature(payload: string, secret: string): string {
    // In real implementation, use HMAC-SHA256
    const crypto = require('crypto')
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
  }
  
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return signature === expectedSignature
  }
  
  async healthCheck(context: WebhookContext) {
    return {
      healthy: true,
      details: 'HTTP webhook dispatcher operational',
      queueDepth: 0,
      avgDeliveryTime: 250
    }
  }
}

export const webhookRegistry = new WebhookDispatcherRegistry()


