// ================================================
// PRICING REPOSITORY
// Product prices and tax codes
// ================================================

import { supabase } from '@/lib/supabaseClient'
import type { 
  ProductPrice, 
  TaxCode, 
  UpsertProductParams,
  PriceContext
} from '@/lib/types/menu'
import { MenuRepositoryError } from '@/lib/types/menu'

// ================================================
// TAX CODES
// ================================================

export async function getTaxCodes(): Promise<TaxCode[]> {
  try {
    const { data, error } = await supabase
      .from('tax_codes')
      .select('*')
      .order('name')

    if (error) throw new MenuRepositoryError('Failed to fetch tax codes', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching tax codes', 'UNKNOWN_ERROR', error)
  }
}

export async function getTaxCode(id: string): Promise<TaxCode | null> {
  try {
    const { data, error } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new MenuRepositoryError('Failed to fetch tax code', 'FETCH_ERROR', error)
    }
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching tax code', 'UNKNOWN_ERROR', error)
  }
}

export async function createTaxCode(taxCodeData: { name: string; rate: number }): Promise<TaxCode> {
  try {
    const { data, error } = await supabase
      .from('tax_codes')
      .insert({
        name: taxCodeData.name,
        rate: taxCodeData.rate
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to create tax code', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error creating tax code', 'UNKNOWN_ERROR', error)
  }
}

export async function updateTaxCode(id: string, updates: { name?: string; rate?: number }): Promise<TaxCode> {
  try {
    const { data, error } = await supabase
      .from('tax_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to update tax code', 'UPDATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error updating tax code', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteTaxCode(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tax_codes')
      .delete()
      .eq('id', id)

    if (error) throw new MenuRepositoryError('Failed to delete tax code', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting tax code', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// PRODUCT PRICES
// ================================================

export async function getProductPrices(productId: string): Promise<ProductPrice[]> {
  try {
    const { data, error } = await supabase
      .from('product_prices')
      .select('*')
      .eq('product_id', productId)
      .order('context')

    if (error) throw new MenuRepositoryError('Failed to fetch product prices', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching product prices', 'UNKNOWN_ERROR', error)
  }
}

export async function getProductPrice(productId: string, context: PriceContext): Promise<ProductPrice | null> {
  try {
    const { data, error } = await supabase
      .from('product_prices')
      .select('*')
      .eq('product_id', productId)
      .eq('context', context)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new MenuRepositoryError('Failed to fetch product price', 'FETCH_ERROR', error)
    }
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching product price', 'UNKNOWN_ERROR', error)
  }
}

export async function upsertProductPrice(priceData: {
  product_id: string
  context: PriceContext
  price: number
  tax_code_id?: string | null
}): Promise<ProductPrice> {
  try {
    const { data, error } = await supabase
      .from('product_prices')
      .upsert({
        product_id: priceData.product_id,
        context: priceData.context,
        price: priceData.price,
        tax_code_id: priceData.tax_code_id || null
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to upsert product price', 'UPSERT_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error upserting product price', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteProductPrice(productId: string, context: PriceContext): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_prices')
      .delete()
      .eq('product_id', productId)
      .eq('context', context)

    if (error) throw new MenuRepositoryError('Failed to delete product price', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting product price', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteAllProductPrices(productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_prices')
      .delete()
      .eq('product_id', productId)

    if (error) throw new MenuRepositoryError('Failed to delete all product prices', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting all product prices', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// COMBINED OPERATIONS
// ================================================

/**
 * Upsert product with prices atomically using the database RPC function
 */
export async function upsertProductWithPrices(params: UpsertProductParams): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('upsert_product_with_prices', {
      p_product_id: params.product_id || null,
      p_name: params.name,
      p_category_id: params.category_id || null,
      p_product_group_id: params.product_group_id || null,
      p_description: params.description || null,
      p_dine_in_price: params.dine_in_price || 0,
      p_dine_in_tax: params.dine_in_tax || null,
      p_takeaway_price: params.takeaway_price || 0,
      p_takeaway_tax: params.takeaway_tax || null
    })

    if (error) throw new MenuRepositoryError('Failed to upsert product with prices', 'RPC_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error upserting product with prices', 'UNKNOWN_ERROR', error)
  }
}

/**
 * Get all pricing contexts for a product
 */
export async function getProductPricingByContext(productId: string): Promise<Record<PriceContext, ProductPrice | null>> {
  try {
    const prices = await getProductPrices(productId)
    
    const result: Record<PriceContext, ProductPrice | null> = {
      dine_in: null,
      takeaway: null
    }

    prices.forEach(price => {
      if (price.context === 'dine_in' || price.context === 'takeaway') {
        result[price.context] = price
      }
    })

    return result
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching product pricing by context', 'UNKNOWN_ERROR', error)
  }
}

/**
 * Bulk update prices for multiple products
 */
export async function bulkUpdateProductPrices(updates: Array<{
  product_id: string
  context: PriceContext
  price: number
  tax_code_id?: string | null
}>): Promise<ProductPrice[]> {
  try {
    const { data, error } = await supabase
      .from('product_prices')
      .upsert(updates)
      .select()

    if (error) throw new MenuRepositoryError('Failed to bulk update product prices', 'BULK_UPDATE_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error bulk updating product prices', 'UNKNOWN_ERROR', error)
  }
}
