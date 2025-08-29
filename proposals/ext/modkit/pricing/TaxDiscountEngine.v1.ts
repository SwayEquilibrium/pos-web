// Tax and Discount Engine v1.0
// Pure functions for pricing calculations with pluggable rules

export interface PricingContext {
  tenantId: string
  locationId: string
  customerId?: string
  customerGroupId?: string
  timestamp: Date
  orderType: 'dine_in' | 'takeaway' | 'delivery'
}

export interface LineItem {
  id: string
  productId: string
  name: string
  category: string
  basePrice: number // minor units
  quantity: number
  modifiers?: Array<{
    id: string
    name: string
    price: number // minor units
    taxable: boolean
  }>
  taxCategory: string
  discountCategory?: string
  metadata?: Record<string, any>
}

export interface TaxRule {
  id: string
  name: string
  rate: number // percentage (e.g., 25.0 for 25%)
  type: 'vat' | 'sales_tax' | 'service_charge'
  category: string // matches LineItem.taxCategory
  jurisdiction?: string
  validFrom: Date
  validUntil?: Date
  active: boolean
  compoundable: boolean // Can be applied on top of other taxes
  metadata?: Record<string, any>
}

export interface DiscountRule {
  id: string
  name: string
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'category_discount'
  value: number // percentage or amount in minor units
  conditions: {
    minQuantity?: number
    minAmount?: number // minor units
    categories?: string[]
    products?: string[]
    customerGroups?: string[]
    timeRanges?: Array<{
      start: string // HH:MM format
      end: string
      days: number[] // 0=Sunday, 6=Saturday
    }>
    orderTypes?: Array<'dine_in' | 'takeaway' | 'delivery'>
  }
  stackable: boolean
  maxApplications?: number // Per order
  validFrom: Date
  validUntil?: Date
  active: boolean
  priority: number // Higher number = higher priority
  metadata?: Record<string, any>
}

export interface PricingCalculation {
  lineItems: Array<{
    id: string
    baseAmount: number // minor units
    modifierAmount: number // minor units
    subtotal: number // minor units
    discounts: Array<{
      ruleId: string
      name: string
      amount: number // minor units (positive)
      type: DiscountRule['type']
    }>
    discountTotal: number // minor units
    taxableAmount: number // minor units
    taxes: Array<{
      ruleId: string
      name: string
      rate: number
      amount: number // minor units
      jurisdiction?: string
    }>
    taxTotal: number // minor units
    totalAmount: number // minor units
  }>
  
  summary: {
    subtotal: number // minor units
    totalDiscounts: number // minor units
    taxableAmount: number // minor units
    totalTax: number // minor units
    grandTotal: number // minor units
  }
  
  appliedDiscounts: Array<{
    ruleId: string
    name: string
    totalAmount: number // minor units
    itemsAffected: string[] // line item IDs
  }>
  
  appliedTaxes: Array<{
    ruleId: string
    name: string
    rate: number
    totalAmount: number // minor units
    jurisdiction?: string
  }>
  
  metadata: {
    calculatedAt: Date
    context: PricingContext
    warnings?: string[]
  }
}

export interface TaxDiscountEngine {
  readonly name: string
  readonly version: string
  readonly supportedJurisdictions: string[]
  
  // Tax calculation
  calculateTaxes(
    lineItems: LineItem[],
    taxRules: TaxRule[],
    context: PricingContext
  ): Promise<{
    lineItems: Array<{
      id: string
      taxableAmount: number
      taxes: Array<{
        ruleId: string
        name: string
        rate: number
        amount: number
      }>
      taxTotal: number
    }>
    totalTax: number
    appliedRules: string[]
  }>
  
  // Discount calculation
  calculateDiscounts(
    lineItems: LineItem[],
    discountRules: DiscountRule[],
    context: PricingContext
  ): Promise<{
    lineItems: Array<{
      id: string
      applicableDiscounts: Array<{
        ruleId: string
        name: string
        amount: number
        reason: string
      }>
      discountTotal: number
    }>
    totalDiscounts: number
    appliedRules: string[]
    skippedRules: Array<{
      ruleId: string
      reason: string
    }>
  }>
  
  // Combined pricing calculation
  calculatePricing(
    lineItems: LineItem[],
    taxRules: TaxRule[],
    discountRules: DiscountRule[],
    context: PricingContext
  ): Promise<PricingCalculation>
  
  // Rule validation
  validateTaxRule(rule: TaxRule): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  validateDiscountRule(rule: DiscountRule): {
    valid: boolean
    errors: string[]
    warnings?: string[]
  }
  
  // Rule testing
  testTaxRule(
    rule: TaxRule,
    sampleItems: LineItem[],
    context: PricingContext
  ): Promise<{
    applicable: boolean
    estimatedTax: number
    affectedItems: string[]
  }>
  
  testDiscountRule(
    rule: DiscountRule,
    sampleItems: LineItem[],
    context: PricingContext
  ): Promise<{
    applicable: boolean
    estimatedDiscount: number
    affectedItems: string[]
    conditions: Record<string, boolean>
  }>
  
  // Utility functions
  formatAmount(amount: number, currency: string): string
  parseAmount(formatted: string, currency: string): number
  
  // Health check
  healthCheck(): Promise<{
    healthy: boolean
    details?: string
  }>
}

// Default implementation with Danish tax rules
export class DanishTaxDiscountEngine implements TaxDiscountEngine {
  readonly name = 'danish-tax-engine'
  readonly version = '1.0.0'
  readonly supportedJurisdictions = ['DK']
  
  async calculateTaxes(lineItems: LineItem[], taxRules: TaxRule[], context: PricingContext) {
    const results = lineItems.map(item => {
      const itemTotal = item.basePrice * item.quantity + 
        (item.modifiers?.reduce((sum, mod) => sum + mod.price * item.quantity, 0) || 0)
      
      const applicableRules = taxRules.filter(rule => 
        rule.active && 
        rule.category === item.taxCategory &&
        new Date() >= rule.validFrom &&
        (!rule.validUntil || new Date() <= rule.validUntil)
      )
      
      const taxes = applicableRules.map(rule => {
        const taxAmount = Math.round(itemTotal * (rule.rate / 100))
        return {
          ruleId: rule.id,
          name: rule.name,
          rate: rule.rate,
          amount: taxAmount
        }
      })
      
      return {
        id: item.id,
        taxableAmount: itemTotal,
        taxes,
        taxTotal: taxes.reduce((sum, tax) => sum + tax.amount, 0)
      }
    })
    
    return {
      lineItems: results,
      totalTax: results.reduce((sum, item) => sum + item.taxTotal, 0),
      appliedRules: [...new Set(results.flatMap(item => item.taxes.map(tax => tax.ruleId)))]
    }
  }
  
  async calculateDiscounts(lineItems: LineItem[], discountRules: DiscountRule[], context: PricingContext) {
    // Sort rules by priority (higher first)
    const sortedRules = discountRules
      .filter(rule => rule.active)
      .sort((a, b) => b.priority - a.priority)
    
    const results = lineItems.map(item => ({
      id: item.id,
      applicableDiscounts: [] as any[],
      discountTotal: 0
    }))
    
    const appliedRules: string[] = []
    const skippedRules: Array<{ ruleId: string; reason: string }> = []
    
    for (const rule of sortedRules) {
      // Check time conditions
      if (!this.isRuleActiveNow(rule, context)) {
        skippedRules.push({ ruleId: rule.id, reason: 'Outside valid time range' })
        continue
      }
      
      // Check customer group conditions
      if (rule.conditions.customerGroups && 
          (!context.customerGroupId || !rule.conditions.customerGroups.includes(context.customerGroupId))) {
        skippedRules.push({ ruleId: rule.id, reason: 'Customer group not eligible' })
        continue
      }
      
      // Apply discount to eligible items
      for (const result of results) {
        const item = lineItems.find(li => li.id === result.id)!
        
        if (this.isItemEligible(item, rule, context)) {
          const discount = this.calculateItemDiscount(item, rule)
          if (discount > 0) {
            result.applicableDiscounts.push({
              ruleId: rule.id,
              name: rule.name,
              amount: discount,
              reason: `${rule.type} discount applied`
            })
            result.discountTotal += discount
          }
        }
      }
      
      appliedRules.push(rule.id)
    }
    
    return {
      lineItems: results,
      totalDiscounts: results.reduce((sum, item) => sum + item.discountTotal, 0),
      appliedRules,
      skippedRules
    }
  }
  
  async calculatePricing(lineItems: LineItem[], taxRules: TaxRule[], discountRules: DiscountRule[], context: PricingContext): Promise<PricingCalculation> {
    // First calculate discounts
    const discountResults = await this.calculateDiscounts(lineItems, discountRules, context)
    
    // Then calculate taxes on discounted amounts
    const adjustedItems = lineItems.map((item, index) => {
      const discountTotal = discountResults.lineItems[index].discountTotal
      const adjustedPrice = Math.max(0, item.basePrice - Math.round(discountTotal / item.quantity))
      
      return {
        ...item,
        basePrice: adjustedPrice
      }
    })
    
    const taxResults = await this.calculateTaxes(adjustedItems, taxRules, context)
    
    // Combine results
    const calculatedItems = lineItems.map((item, index) => {
      const baseAmount = item.basePrice * item.quantity
      const modifierAmount = item.modifiers?.reduce((sum, mod) => sum + mod.price * item.quantity, 0) || 0
      const subtotal = baseAmount + modifierAmount
      
      const discounts = discountResults.lineItems[index].applicableDiscounts
      const discountTotal = discountResults.lineItems[index].discountTotal
      
      const taxes = taxResults.lineItems[index].taxes
      const taxTotal = taxResults.lineItems[index].taxTotal
      
      const taxableAmount = Math.max(0, subtotal - discountTotal)
      const totalAmount = taxableAmount + taxTotal
      
      return {
        id: item.id,
        baseAmount,
        modifierAmount,
        subtotal,
        discounts,
        discountTotal,
        taxableAmount,
        taxes,
        taxTotal,
        totalAmount
      }
    })
    
    const summary = {
      subtotal: calculatedItems.reduce((sum, item) => sum + item.subtotal, 0),
      totalDiscounts: calculatedItems.reduce((sum, item) => sum + item.discountTotal, 0),
      taxableAmount: calculatedItems.reduce((sum, item) => sum + item.taxableAmount, 0),
      totalTax: calculatedItems.reduce((sum, item) => sum + item.taxTotal, 0),
      grandTotal: calculatedItems.reduce((sum, item) => sum + item.totalAmount, 0)
    }
    
    return {
      lineItems: calculatedItems,
      summary,
      appliedDiscounts: this.groupDiscountsByRule(calculatedItems),
      appliedTaxes: this.groupTaxesByRule(calculatedItems),
      metadata: {
        calculatedAt: new Date(),
        context
      }
    }
  }
  
  private isRuleActiveNow(rule: DiscountRule, context: PricingContext): boolean {
    const now = context.timestamp
    
    // Check date range
    if (now < rule.validFrom || (rule.validUntil && now > rule.validUntil)) {
      return false
    }
    
    // Check time ranges if specified
    if (rule.conditions.timeRanges?.length) {
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const currentDay = now.getDay()
      
      const isInTimeRange = rule.conditions.timeRanges.some(range => {
        if (range.days && !range.days.includes(currentDay)) return false
        
        const [startHour, startMin] = range.start.split(':').map(Number)
        const [endHour, endMin] = range.end.split(':').map(Number)
        const startTime = startHour * 60 + startMin
        const endTime = endHour * 60 + endMin
        
        return currentTime >= startTime && currentTime <= endTime
      })
      
      if (!isInTimeRange) return false
    }
    
    return true
  }
  
  private isItemEligible(item: LineItem, rule: DiscountRule, context: PricingContext): boolean {
    // Check category conditions
    if (rule.conditions.categories?.length && !rule.conditions.categories.includes(item.category)) {
      return false
    }
    
    // Check product conditions
    if (rule.conditions.products?.length && !rule.conditions.products.includes(item.productId)) {
      return false
    }
    
    // Check order type conditions
    if (rule.conditions.orderTypes?.length && !rule.conditions.orderTypes.includes(context.orderType)) {
      return false
    }
    
    return true
  }
  
  private calculateItemDiscount(item: LineItem, rule: DiscountRule): number {
    const itemTotal = item.basePrice * item.quantity
    
    switch (rule.type) {
      case 'percentage':
        return Math.round(itemTotal * (rule.value / 100))
      
      case 'fixed_amount':
        return Math.min(rule.value * item.quantity, itemTotal)
      
      default:
        return 0
    }
  }
  
  private groupDiscountsByRule(items: any[]) {
    const grouped: Record<string, any> = {}
    
    items.forEach(item => {
      item.discounts.forEach((discount: any) => {
        if (!grouped[discount.ruleId]) {
          grouped[discount.ruleId] = {
            ruleId: discount.ruleId,
            name: discount.name,
            totalAmount: 0,
            itemsAffected: []
          }
        }
        grouped[discount.ruleId].totalAmount += discount.amount
        grouped[discount.ruleId].itemsAffected.push(item.id)
      })
    })
    
    return Object.values(grouped)
  }
  
  private groupTaxesByRule(items: any[]) {
    const grouped: Record<string, any> = {}
    
    items.forEach(item => {
      item.taxes.forEach((tax: any) => {
        if (!grouped[tax.ruleId]) {
          grouped[tax.ruleId] = {
            ruleId: tax.ruleId,
            name: tax.name,
            rate: tax.rate,
            totalAmount: 0,
            jurisdiction: tax.jurisdiction
          }
        }
        grouped[tax.ruleId].totalAmount += tax.amount
      })
    })
    
    return Object.values(grouped)
  }
  
  validateTaxRule(rule: TaxRule) {
    const errors: string[] = []
    
    if (!rule.name) errors.push('Tax rule name is required')
    if (rule.rate < 0 || rule.rate > 100) errors.push('Tax rate must be between 0 and 100')
    if (!rule.category) errors.push('Tax category is required')
    if (rule.validFrom > (rule.validUntil || new Date('2099-12-31'))) {
      errors.push('Valid from date must be before valid until date')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  validateDiscountRule(rule: DiscountRule) {
    const errors: string[] = []
    
    if (!rule.name) errors.push('Discount rule name is required')
    if (rule.value < 0) errors.push('Discount value cannot be negative')
    if (rule.type === 'percentage' && rule.value > 100) {
      errors.push('Percentage discount cannot exceed 100%')
    }
    
    return { valid: errors.length === 0, errors }
  }
  
  async testTaxRule(rule: TaxRule, sampleItems: LineItem[], context: PricingContext) {
    const results = await this.calculateTaxes(sampleItems, [rule], context)
    
    return {
      applicable: results.appliedRules.includes(rule.id),
      estimatedTax: results.totalTax,
      affectedItems: results.lineItems.filter(item => item.taxTotal > 0).map(item => item.id)
    }
  }
  
  async testDiscountRule(rule: DiscountRule, sampleItems: LineItem[], context: PricingContext) {
    const results = await this.calculateDiscounts(sampleItems, [rule], context)
    
    return {
      applicable: results.appliedRules.includes(rule.id),
      estimatedDiscount: results.totalDiscounts,
      affectedItems: results.lineItems.filter(item => item.discountTotal > 0).map(item => item.id),
      conditions: {
        timeValid: this.isRuleActiveNow(rule, context),
        itemsEligible: sampleItems.some(item => this.isItemEligible(item, rule, context))
      }
    }
  }
  
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount / 100) // Convert from minor units
  }
  
  parseAmount(formatted: string, currency: string): number {
    const cleaned = formatted.replace(/[^\d,-]/g, '').replace(',', '.')
    return Math.round(parseFloat(cleaned) * 100) // Convert to minor units
  }
  
  async healthCheck() {
    return {
      healthy: true,
      details: 'Danish tax and discount engine operational'
    }
  }
}




