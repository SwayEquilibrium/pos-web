// Slot Quoting Engine v1.0
// Intelligent slot recommendation based on capacity and constraints

import { FulfillmentProvider, FulfillmentSlot, FulfillmentRequest, FulfillmentContext } from './FulfillmentProvider.v1'

export interface SlotQuoteOptions {
  preferredTime?: Date
  maxWaitTime?: number // minutes
  allowAlternatives: boolean
  prioritizeSpeed: boolean // vs. cost optimization
}

export interface SlotQuote {
  slot: FulfillmentSlot
  score: number // 0-100, higher is better
  reasons: string[]
  alternatives?: FulfillmentSlot[]
  pricing?: {
    baseFee: number
    rushFee?: number
    deliveryFee?: number
    totalFee: number
  }
}

export interface SlotQuoteResult {
  success: boolean
  recommendedSlots: SlotQuote[]
  totalPreparationTime: number
  earliestAvailable: Date
  error?: string
}

export class SlotQuotingEngine {
  constructor(private provider: FulfillmentProvider) {}
  
  async quoteSlots(
    context: FulfillmentContext,
    request: Omit<FulfillmentRequest, 'slotId'>,
    options: SlotQuoteOptions = { allowAlternatives: true, prioritizeSpeed: false }
  ): Promise<SlotQuoteResult> {
    try {
      // Calculate total preparation time
      const totalPrepTime = this.calculatePreparationTime(request.items)
      
      // Get available slots
      const availableSlots = await this.provider.getAvailableSlots(context, {
        date: request.requestedTime || new Date(),
        type: request.orderType,
        partySize: request.items.reduce((sum, item) => sum + item.quantity, 0)
      })
      
      if (availableSlots.length === 0) {
        return {
          success: false,
          recommendedSlots: [],
          totalPreparationTime: totalPrepTime,
          earliestAvailable: new Date(Date.now() + totalPrepTime * 60 * 1000),
          error: 'No available slots found'
        }
      }
      
      // Score and rank slots
      const quotes = await Promise.all(
        availableSlots.map(slot => this.scoreSlot(slot, request, options, context))
      )
      
      // Sort by score (highest first)
      const sortedQuotes = quotes
        .filter(quote => quote.score > 0)
        .sort((a, b) => b.score - a.score)
      
      // Find earliest available
      const earliestSlot = availableSlots
        .sort((a, b) => a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime())[0]
      
      return {
        success: true,
        recommendedSlots: sortedQuotes.slice(0, 5), // Top 5 recommendations
        totalPreparationTime: totalPrepTime,
        earliestAvailable: earliestSlot?.timeSlot.startTime || new Date()
      }
    } catch (error) {
      return {
        success: false,
        recommendedSlots: [],
        totalPreparationTime: 0,
        earliestAvailable: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  private calculatePreparationTime(items: FulfillmentRequest['items']): number {
    // Use maximum preparation time (parallel cooking assumption)
    return Math.max(...items.map(item => item.preparationTime), 15) // minimum 15 min
  }
  
  private async scoreSlot(
    slot: FulfillmentSlot,
    request: Omit<FulfillmentRequest, 'slotId'>,
    options: SlotQuoteOptions,
    context: FulfillmentContext
  ): Promise<SlotQuote> {
    let score = 100
    const reasons: string[] = []
    
    // Capacity utilization (prefer less crowded slots)
    const utilization = slot.currentBookings / slot.maxCapacity
    if (utilization < 0.5) {
      score += 10
      reasons.push('Low utilization - faster service')
    } else if (utilization > 0.8) {
      score -= 20
      reasons.push('High utilization - may be slower')
    }
    
    // Time preference matching
    if (options.preferredTime) {
      const timeDiff = Math.abs(
        slot.timeSlot.startTime.getTime() - options.preferredTime.getTime()
      )
      const hoursDiff = timeDiff / (1000 * 60 * 60)
      
      if (hoursDiff < 0.5) {
        score += 20
        reasons.push('Matches preferred time')
      } else if (hoursDiff > 2) {
        score -= Math.min(30, hoursDiff * 5)
        reasons.push(`${hoursDiff.toFixed(1)} hours from preferred time`)
      }
    }
    
    // Rush hour penalties/bonuses
    const hour = slot.timeSlot.startTime.getHours()
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20)) {
      // Peak hours
      if (options.prioritizeSpeed) {
        score -= 15
        reasons.push('Peak hours - may be busier')
      } else {
        score += 5
        reasons.push('Peak hours - fresh preparation')
      }
    }
    
    // Delivery distance (if applicable)
    if (request.orderType === 'delivery' && slot.deliveryZone) {
      if (slot.deliveryZone.radius < 2000) { // Within 2km
        score += 10
        reasons.push('Short delivery distance')
      } else if (slot.deliveryZone.radius > 5000) { // Over 5km
        score -= 10
        reasons.push('Long delivery distance')
      }
    }
    
    // Preparation time buffer
    const now = new Date()
    const timeUntilSlot = slot.timeSlot.startTime.getTime() - now.getTime()
    const requiredPrepTime = this.calculatePreparationTime(request.items) * 60 * 1000
    
    if (timeUntilSlot < requiredPrepTime) {
      score = 0 // Not feasible
      reasons.push('Insufficient preparation time')
    } else if (timeUntilSlot > requiredPrepTime * 2) {
      score += 5
      reasons.push('Ample preparation time')
    }
    
    // Calculate pricing
    const pricing = this.calculateSlotPricing(slot, request, options)
    
    return {
      slot,
      score: Math.max(0, score),
      reasons,
      pricing
    }
  }
  
  private calculateSlotPricing(
    slot: FulfillmentSlot,
    request: Omit<FulfillmentRequest, 'slotId'>,
    options: SlotQuoteOptions
  ) {
    let baseFee = 0
    let rushFee = 0
    let deliveryFee = slot.deliveryZone?.fee || 0
    
    // Rush hour surcharge
    const hour = slot.timeSlot.startTime.getHours()
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20)) {
      rushFee = Math.floor(deliveryFee * 0.2) // 20% rush surcharge
    }
    
    // Peak capacity surcharge
    const utilization = slot.currentBookings / slot.maxCapacity
    if (utilization > 0.8) {
      rushFee += Math.floor(deliveryFee * 0.1) // 10% high-demand surcharge
    }
    
    return {
      baseFee,
      rushFee: rushFee > 0 ? rushFee : undefined,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      totalFee: baseFee + rushFee + deliveryFee
    }
  }
}

// Utility function for easy integration
export async function quoteTakeawaySlots(
  provider: FulfillmentProvider,
  context: FulfillmentContext,
  request: Omit<FulfillmentRequest, 'slotId'>,
  options?: SlotQuoteOptions
): Promise<SlotQuoteResult> {
  const engine = new SlotQuotingEngine(provider)
  return engine.quoteSlots(context, request, options)
}


