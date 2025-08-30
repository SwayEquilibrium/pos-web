import { supabase } from '@/lib/supabaseClient'

// ================================================
// MENU REPOSITORY - CONSOLIDATED MENU OPERATIONS
// ================================================

// Types
export interface Category {
  id: string
  parent_id?: string | null
  name: string
  description?: string
  sort_index?: number
  print_sort_index?: number
  active?: boolean
  color?: string
  emoji?: string
  image_url?: string
  image_thumbnail_url?: string
  display_style?: 'emoji' | 'icon' | 'text'
  created_at: string
  updated_at: string
  children?: Category[]
}

export interface Product {
  id: string
  name: string
  category_id?: string | null
  product_group_id?: string | null
  description?: string
  active?: boolean
  color?: string
  emoji?: string
  image_url?: string
  image_thumbnail_url?: string
  display_style?: 'emoji' | 'icon' | 'text'
  allergens?: string[]
  nutritional_info?: any
  created_at: string
  updated_at: string
}

export interface ProductGroup {
  id: string
  name: string
  description?: string
  active?: boolean
  sort_index?: number
  created_at: string
  updated_at: string
}

export interface TaxCode {
  id: string
  name: string
  code: string
  rate: number
  description?: string
  active?: boolean
  created_at: string
  updated_at: string
}

export interface ProductPrice {
  id: string
  product_id: string
  context: 'dine_in' | 'takeaway' | 'delivery'
  price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ModifierGroup {
  id: string
  name: string
  description?: string
  required?: boolean
  min_selections?: number
  max_selections?: number
  active?: boolean
  sort_index?: number
  created_at: string
  updated_at: string
}

export interface Modifier {
  id: string
  group_id: string
  name: string
  description?: string
  price_delta?: number
  active?: boolean
  sort_index?: number
  created_at: string
  updated_at: string
}

export interface Menucard {
  id: string
  name: string
  description?: string
  active?: boolean
  sort_index?: number
  created_at: string
  updated_at: string
}

// ================================================
// CATEGORIES
// ================================================

export async function getCategories(options?: {
  menucardId?: string
  parentId?: string
  categoryId?: string
  active?: boolean
}): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('id, name, description, parent_id, sort_index, print_sort_index, active, color, emoji, display_style, image_url, image_thumbnail_url, created_at, updated_at')
    .order('sort_index', { ascending: true })

  if (options?.menucardId) {
    query = query.eq('menucard_id', options.menucardId)
  }

  if (options?.parentId !== undefined) {
    if (options.parentId === null) {
      query = query.is('parent_id', null)
    } else {
      query = query.eq('parent_id', options.parentId)
    }
  }

  if (options?.categoryId) {
    query = query.eq('id', options.categoryId)
  }

  if (options?.active !== undefined) {
    query = query.eq('active', options.active)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getCategories] Query error:', error)
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data || []
}

export async function getCategory(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, parent_id, sort_index, print_sort_index, active, color, emoji, display_style, image_url, image_thumbnail_url, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getCategory] Query error:', error)
    throw new Error(`Failed to fetch category: ${error.message}`)
  }

  return data
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
  // Provide sensible defaults for optional fields
  const categoryWithDefaults = {
    ...category,
    sort_index: category.sort_index ?? 0,
    print_sort_index: category.print_sort_index ?? 0,
    active: category.active ?? true
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(categoryWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createCategory] Insert error:', error)
    throw new Error(`Failed to create category: ${error.message}`)
  }

  return data
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateCategory] Update error:', error)
    throw new Error(`Failed to update category: ${error.message}`)
  }

  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteCategory] Delete error:', error)
    throw new Error(`Failed to delete category: ${error.message}`)
  }
}

export async function reorderCategories(categoryIds: string[]): Promise<void> {
  const updates = categoryIds.map((id, index) => ({
    id,
    sort_index: index
  }))

  const { error } = await supabase
    .from('categories')
    .upsert(updates)

  if (error) {
    console.error('[reorderCategories] Update error:', error)
    throw new Error(`Failed to reorder categories: ${error.message}`)
  }
}

// ================================================
// PRODUCTS
// ================================================

// Diagnostic function to check database connectivity
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (error) {
      return { connected: false, error: error.message }
    }
    
    return { connected: true }
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function getProducts(options?: {
  menucardId?: string
  categoryId?: string
  active?: boolean
}): Promise<Product[]> {
  try {
    console.log('[getProducts] Starting query with options:', options)
    
    // First check if the table exists and is accessible
    console.log('[getProducts] Checking table accessibility...')
    const { error: tableCheckError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (tableCheckError) {
      console.error('[getProducts] Table check error:', {
        message: tableCheckError.message,
        details: tableCheckError.details,
        hint: tableCheckError.hint,
        code: tableCheckError.code
      })
      throw new Error(`Products table not accessible: ${tableCheckError.message}`)
    }
    
    console.log('[getProducts] Table accessible, building query...')

    // Following our rules: adapt to current schema instead of fighting it
    // Now includes product groups and images since we added them
    let query = supabase
      .from('products')
      .select('id, name, description, category_id, product_group_id, active, color, emoji, display_style, image_url, image_thumbnail_url, sort_index, created_at, updated_at')
      .order('sort_index', { ascending: true })

    if (options?.menucardId) {
      query = query.eq('menucard_id', options.menucardId)
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId)
    }

    if (options?.active !== undefined) {
      query = query.eq('active', options.active)
    }

    console.log('[getProducts] Executing query...')
    const { data, error } = await query

    if (error) {
      console.error('[getProducts] Query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    console.log('[getProducts] Query successful, returning data:', data?.length || 0, 'records')
    return data || []
  } catch (err) {
    console.error('[getProducts] Unexpected error:', err)
    throw err
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, category_id, active, color, emoji, display_style, image_url, image_thumbnail_url, sort_index, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getProduct] Query error:', error)
    throw new Error(`Failed to fetch product: ${error.message}`)
  }

  return data
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  // Provide sensible defaults for optional fields
  const productWithDefaults = {
    ...product,
    active: product.active ?? true
  }

  const { data, error } = await supabase
    .from('products')
    .insert(productWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createProduct] Insert error:', error)
    throw new Error(`Failed to create product: ${error.message}`)
  }

  return data
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateProduct] Update error:', error)
    throw new Error(`Failed to update product: ${error.message}`)
  }

  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteProduct] Delete error:', error)
    throw new Error(`Failed to delete product: ${error.message}`)
  }
}

export async function reorderProducts(productIds: string[]): Promise<void> {
  const updates = productIds.map((id, index) => ({
    id,
    sort_index: index
  }))

  const { error } = await supabase
    .from('products')
    .upsert(updates)

  if (error) {
    console.error('[reorderProducts] Update error:', error)
    throw new Error(`Failed to reorder products: ${error.message}`)
  }
}



// ================================================
// PRODUCT PRICING
// ================================================

export async function getProductPricing(productId: string): Promise<ProductPrice[]> {
  const { data, error } = await supabase
    .from('product_prices')
    .select('*')
    .eq('product_id', productId)
    .eq('active', true)

  if (error) {
    console.error('[getProductPricing] Query error:', error)
    throw new Error(`Failed to fetch product pricing: ${error.message}`)
  }

  return data || []
}

export async function getProductPricingByContext(productId: string, context: 'dine_in' | 'takeaway' | 'delivery'): Promise<ProductPrice | null> {
  const { data, error } = await supabase
    .from('product_prices')
    .select('*')
    .eq('product_id', productId)
    .eq('context', context)
    .eq('active', true)
    .single()

  if (error) {
    console.error('[getProductPricingByContext] Query error:', error)
    throw new Error(`Failed to fetch product pricing: ${error.message}`)
  }

  return data
}

export async function updateProductPricing(productId: string, context: 'dine_in' | 'takeaway' | 'delivery', price: number): Promise<ProductPrice> {
  const { data, error } = await supabase
    .from('product_prices')
    .upsert({
      product_id: productId,
      context,
      price,
      active: true
    })
    .select()
    .single()

  if (error) {
    console.error('[updateProductPricing] Upsert error:', error)
    throw new Error(`Failed to update product pricing: ${error.message}`)
  }

  return data
}

// ================================================
// MODIFIER GROUPS
// ================================================

export async function getModifierGroups(options?: {
  active?: boolean
}): Promise<ModifierGroup[]> {
  let query = supabase
    .from('modifier_groups')
    .select('id, name, description, required, min_selections, max_selections, active, sort_index, created_at, updated_at')
    .order('sort_index', { ascending: true })

  if (options?.active !== undefined) {
    query = query.eq('active', options.active)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getModifierGroups] Query error:', error)
    throw new Error(`Failed to fetch modifier groups: ${error.message}`)
  }

  return data || []
}

export async function getModifierGroup(id: string): Promise<ModifierGroup | null> {
  const { data, error } = await supabase
    .from('modifier_groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getModifierGroup] Query error:', error)
    throw new Error(`Failed to fetch modifier group: ${error.message}`)
  }

  return data
}

export async function createModifierGroup(group: Omit<ModifierGroup, 'id' | 'created_at' | 'updated_at'>): Promise<ModifierGroup> {
  // Provide sensible defaults for optional fields
  const groupWithDefaults = {
    ...group,
    required: group.required ?? false,
    min_selections: group.min_selections ?? 0,
    max_selections: group.max_selections ?? 1,
    active: group.active ?? true,
    sort_index: group.sort_index ?? 0
  }

  const { data, error } = await supabase
    .from('modifier_groups')
    .insert(groupWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createModifierGroup] Insert error:', error)
    throw new Error(`Failed to create modifier group: ${error.message}`)
  }

  return data
}

export async function updateModifierGroup(id: string, updates: Partial<ModifierGroup>): Promise<ModifierGroup> {
  const { data, error } = await supabase
    .from('modifier_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateModifierGroup] Update error:', error)
    throw new Error(`Failed to update modifier group: ${error.message}`)
  }

  return data
}

export async function deleteModifierGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('modifier_groups')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteModifierGroup] Delete error:', error)
    throw new Error(`Failed to delete modifier group: ${error.message}`)
  }
}

// ================================================
// MODIFIERS
// ================================================

export async function getModifiers(options?: {
  groupId?: string
  active?: boolean
}): Promise<Modifier[]> {
  let query = supabase
    .from('modifiers')
    .select('id, name, description, group_id, price_delta, active, sort_index, created_at, updated_at')
    .order('sort_index', { ascending: true })

  if (options?.groupId) {
    query = query.eq('group_id', options.groupId)
  }

  if (options?.active !== undefined) {
    query = query.eq('active', options.active)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getModifiers] Query error:', error)
    throw new Error(`Failed to fetch modifiers: ${error.message}`)
  }

  return data || []
}

export async function getModifier(id: string): Promise<Modifier | null> {
  const { data, error } = await supabase
    .from('modifiers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getModifier] Query error:', error)
    throw new Error(`Failed to fetch modifier: ${error.message}`)
  }

  return data
}

export async function createModifier(modifier: Omit<Modifier, 'id' | 'created_at' | 'updated_at'>): Promise<Modifier> {
  // Provide sensible defaults for optional fields
  const modifierWithDefaults = {
    ...modifier,
    price_delta: modifier.price_delta ?? 0,
    active: modifier.active ?? true,
    sort_index: modifier.sort_index ?? 0
  }

  const { data, error } = await supabase
    .from('modifiers')
    .insert(modifierWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createModifier] Insert error:', error)
    throw new Error(`Failed to create modifier: ${error.message}`)
  }

  return data
}

export async function updateModifier(id: string, updates: Partial<Modifier>): Promise<Modifier> {
  const { data, error } = await supabase
    .from('modifiers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateModifier] Update error:', error)
    throw new Error(`Failed to update modifier: ${error.message}`)
  }

  return data
}

export async function deleteModifier(id: string): Promise<void> {
  const { error } = await supabase
    .from('modifiers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteModifier] Delete error:', error)
    throw new Error(`Failed to delete modifier: ${error.message}`)
  }
}

// ================================================
// MENUCARDS
// ================================================

export async function getMenucards(): Promise<Menucard[]> {
  const { data, error } = await supabase
    .from('menucards')
    .select('*')
    .eq('active', true)
    .order('sort_index', { ascending: true })

  if (error) {
    console.error('[getMenucards] Query error:', error)
    throw new Error(`Failed to fetch menucards: ${error.message}`)
  }

  return data || []
}

export async function getMenucard(id: string): Promise<Menucard | null> {
  const { data, error } = await supabase
    .from('menucards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getMenucard] Query error:', error)
    throw new Error(`Failed to fetch menucard: ${error.message}`)
  }

  return data
}

export async function createMenucard(menucard: Omit<Menucard, 'id' | 'created_at' | 'updated_at'>): Promise<Menucard> {
  // Provide sensible defaults for optional fields
  const menucardWithDefaults = {
    ...menucard,
    active: menucard.active ?? true,
    sort_index: menucard.sort_index ?? 0
  }

  const { data, error } = await supabase
    .from('menucards')
    .insert(menucardWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createMenucard] Insert error:', error)
    throw new Error(`Failed to create menucard: ${error.message}`)
  }

  return data
}

export async function updateMenucard(id: string, updates: Partial<Menucard>): Promise<Menucard> {
  const { data, error } = await supabase
    .from('menucards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateMenucard] Update error:', error)
    throw new Error(`Failed to update menucard: ${error.message}`)
  }

  return data
}

export async function deleteMenucard(id: string): Promise<void> {
  const { error } = await supabase
    .from('menucards')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteMenucard] Delete error:', error)
    throw new Error(`Failed to delete menucard: ${error.message}`)
  }
}

export async function reorderMenucards(updates: { id: string; sort_index: number }[]): Promise<void> {
  const { error } = await supabase
    .from('menucards')
    .upsert(updates)

  if (error) {
    console.error('[reorderMenucards] Update error:', error)
    throw new Error(`Failed to reorder menucards: ${error.message}`)
  }
}

// ================================================
// PRODUCT GROUPS
// ================================================

export async function getProductGroups(): Promise<ProductGroup[]> {
  const { data, error } = await supabase
    .from('product_groups')
    .select('*')
    .eq('active', true)
    .order('sort_index', { ascending: true })

  if (error) {
    console.error('[getProductGroups] Query error:', error)
    throw new Error(`Failed to fetch product groups: ${error.message}`)
  }

  return data || []
}

export async function getProductGroup(id: string): Promise<ProductGroup | null> {
  const { data, error } = await supabase
    .from('product_groups')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()

  if (error) {
    console.error('[getProductGroup] Query error:', error)
    if (error.code === 'PGRST116') {
      // No rows found
      return null
    }
    throw new Error(`Failed to fetch product group: ${error.message}`)
  }

  return data
}

export async function createProductGroup(group: Omit<ProductGroup, 'id' | 'created_at' | 'updated_at'>): Promise<ProductGroup> {
  const groupWithDefaults = {
    ...group,
    active: group.active ?? true,
    sort_index: group.sort_index ?? 0
  }

  const { data, error } = await supabase
    .from('product_groups')
    .insert(groupWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createProductGroup] Insert error:', error)
    throw new Error(`Failed to create product group: ${error.message}`)
  }

  return data
}

export async function updateProductGroup(id: string, updates: Partial<ProductGroup>): Promise<ProductGroup> {
  const { data, error } = await supabase
    .from('product_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateProductGroup] Update error:', error)
    throw new Error(`Failed to update product group: ${error.message}`)
  }

  return data
}

export async function deleteProductGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('product_groups')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteProductGroup] Delete error:', error)
    throw new Error(`Failed to delete product group: ${error.message}`)
  }
}

// ================================================
// TAX CODES
// ================================================

export async function getTaxCodes(): Promise<TaxCode[]> {
  const { data, error } = await supabase
    .from('tax_codes')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('[getTaxCodes] Query error:', error)
    throw new Error(`Failed to fetch tax codes: ${error.message}`)
  }

  return data || []
}

export async function getTaxCode(id: string): Promise<TaxCode | null> {
  const { data, error } = await supabase
    .from('tax_codes')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()

  if (error) {
    console.error('[getTaxCode] Query error:', error)
    if (error.code === 'PGRST116') {
      // No rows found
      return null
    }
    throw new Error(`Failed to fetch tax code: ${error.message}`)
  }

  return data
}

export async function createTaxCode(taxCode: Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>): Promise<TaxCode> {
  const taxCodeWithDefaults = {
    ...taxCode,
    active: taxCode.active ?? true
  }

  const { data, error } = await supabase
    .from('tax_codes')
    .insert(taxCodeWithDefaults)
    .select()
    .single()

  if (error) {
    console.error('[createTaxCode] Insert error:', error)
    throw new Error(`Failed to create tax code: ${error.message}`)
  }

  return data
}

export async function updateTaxCode(id: string, updates: Partial<TaxCode>): Promise<TaxCode> {
  const { data, error } = await supabase
    .from('tax_codes')
    .update(updates)
    .select()
    .single()

  if (error) {
    console.error('[updateTaxCode] Update error:', error)
    throw new Error(`Failed to update tax code: ${error.message}`)
  }

  return data
}

export async function deleteTaxCode(id: string): Promise<void> {
  const { error } = await supabase
    .from('tax_codes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteTaxCode] Delete error:', error)
    throw new Error(`Failed to delete tax code: ${error.message}`)
  }
}

// ================================================
// PRICING FUNCTIONS
// ================================================

export async function getPricing(options?: {
  productId?: string
  context?: 'dine_in' | 'takeaway' | 'delivery'
  active?: boolean
}): Promise<ProductPrice[]> {
  let query = supabase
    .from('product_prices')
    .select(`
      *,
      product:products(id, name),
      tax_code:tax_codes(id, name, rate)
    `)
    .order('created_at', { ascending: false })

  if (options?.productId) {
    query = query.eq('product_id', options.productId)
  }

  if (options?.context) {
    query = query.eq('context', options.context)
  }

  if (options?.active !== undefined) {
    query = query.eq('active', options.active)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getPricing] Query error:', error)
    throw new Error(`Failed to fetch pricing: ${error.message}`)
  }

  return data || []
}





// ================================================
// UTILITY FUNCTIONS
// ================================================

export async function getCategoryHierarchy(menucardId?: string): Promise<Category[]> {
  const categories = await getCategories({ menucardId, active: true })
  
  // Build hierarchy
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []
  
  categories.forEach(category => {
    categoryMap.set(category.id, category)
  })
  
  categories.forEach(category => {
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(category)
      }
    } else {
      rootCategories.push(category)
    }
  })
  
  return rootCategories
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return getProducts({ categoryId, active: true })
}

export async function getModifiersByGroup(groupId: string): Promise<Modifier[]> {
  return getModifiers({ groupId, active: true })
}

export async function getProductModifiers(productId: string): Promise<any[]> {
  // This would typically join product_modifier_groups with modifiers
  // For now, return empty array - this should be implemented based on your schema
  const { data, error } = await supabase
    .from('product_modifier_groups')
    .select(`
      *,
      modifier_group:modifier_groups(
        *,
        modifiers(*)
      )
    `)
    .eq('product_id', productId)

  if (error) {
    console.error('[getProductModifiers] Query error:', error)
    throw new Error(`Failed to fetch product modifiers: ${error.message}`)
  }

  // Transform the data to match ProductModifier interface
  const modifiers: any[] = []
  data?.forEach(pmg => {
    if (pmg.modifier_group?.modifiers) {
      pmg.modifier_group.modifiers.forEach((modifier: any) => {
        modifiers.push({
          modifier_id: modifier.id,
          modifier_name: modifier.name,
          modifier_price: modifier.price_delta,
          group_id: pmg.modifier_group.id,
          group_name: pmg.modifier_group.name,
          group_type: pmg.modifier_group.required ? 'variant' : 'addon',
          required: pmg.modifier_group.required,
          min_selections: pmg.modifier_group.min_selections,
          max_selections: pmg.modifier_group.max_selections,
        })
      })
    }
  })

  return modifiers
}

// ================================================
// PRODUCT-MODIFIER RELATIONSHIPS
// ================================================

export async function getProductModifierGroups(productId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('product_modifier_groups')
    .select(`
      *,
      modifier_group:modifier_groups(
        *,
        modifiers(*)
      )
    `)
    .eq('product_id', productId)
    .eq('active', true)
    .order('sort_index', { ascending: true })

  if (error) {
    console.error('[getProductModifierGroups] Query error:', error)
    throw new Error(`Failed to fetch product modifier groups: ${error.message}`)
  }

  return data || []
}

export async function attachModifierGroupToProduct(
  productId: string, 
  groupId: string, 
  sortIndex: number, 
  isRequired: boolean
): Promise<void> {
  const { error } = await supabase
    .from('product_modifier_groups')
    .insert({
      product_id: productId,
      modifier_group_id: groupId,
      sort_index: sortIndex,
      required: isRequired,
      active: true
    })

  if (error) {
    console.error('[attachModifierGroupToProduct] Insert error:', error)
    throw new Error(`Failed to attach modifier group: ${error.message}`)
  }
}

export async function detachModifierGroupFromProduct(productId: string, groupId: string): Promise<void> {
  const { error } = await supabase
    .from('product_modifier_groups')
    .delete()
    .eq('product_id', productId)
    .eq('modifier_group_id', groupId)

  if (error) {
    console.error('[detachModifierGroupFromProduct] Delete error:', error)
    throw new Error(`Failed to detach modifier group: ${error.message}`)
  }
}

export async function reorderProductModifierGroups(productId: string, groupIds: string[]): Promise<void> {
  const updates = groupIds.map((groupId, index) => ({
    product_id: productId,
    modifier_group_id: groupId,
    sort_index: index
  }))

  const { error } = await supabase
    .from('product_modifier_groups')
    .upsert(updates)

  if (error) {
    console.error('[reorderProductModifierGroups] Update error:', error)
    throw new Error(`Failed to reorder product modifier groups: ${error.message}`)
  }
}

// ================================================
// DIAGNOSTIC FUNCTIONS
// ================================================

export async function diagnoseDatabaseState(): Promise<{
  tables: string[]
  modifiersTable: {
    exists: boolean
    columns: string[]
    rowCount: number
    sampleData: any[]
  }
  modifierGroupsTable: {
    exists: boolean
    columns: string[]
    rowCount: number
    sampleData: any[]
  }
  productsTable: {
    exists: boolean
    columns: string[]
    rowCount: number
    sampleData: any[]
  }
}> {
  const result: {
    tables: string[]
    modifiersTable: {
      exists: boolean
      columns: string[]
      rowCount: number
      sampleData: any[]
    }
    modifierGroupsTable: {
      exists: boolean
      columns: string[]
      rowCount: number
      sampleData: any[]
    }
    productsTable: {
      exists: boolean
      columns: string[]
      rowCount: number
      sampleData: any[]
    }
  } = {
    tables: [],
    modifiersTable: { exists: false, columns: [], rowCount: 0, sampleData: [] },
    modifierGroupsTable: { exists: false, columns: [], rowCount: 0, sampleData: [] },
    productsTable: { exists: false, columns: [], rowCount: 0, sampleData: [] }
  }

  try {
    // Get all tables
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (!tablesError && tablesData) {
      result.tables = tablesData.map(t => t.table_name)
    }

    // Check modifiers table
    try {
      const { data: modifiersData, error: modifiersError } = await supabase
        .from('modifiers')
        .select('*')
        .limit(5)
      
      if (!modifiersError && modifiersData) {
        result.modifiersTable.exists = true
        result.modifiersTable.rowCount = modifiersData.length
        result.modifiersTable.sampleData = modifiersData
        
        // Get column info
        if (modifiersData.length > 0) {
          result.modifiersTable.columns = Object.keys(modifiersData[0])
        }
      }
    } catch (err) {
      console.log('[diagnose] Modifiers table check failed:', err)
    }

    // Check modifier_groups table
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('modifier_groups')
        .select('*')
        .limit(5)
      
      if (!groupsError && groupsData) {
        result.modifierGroupsTable.exists = true
        result.modifierGroupsTable.rowCount = groupsData.length
        result.modifierGroupsTable.sampleData = groupsData
        
        if (groupsData.length > 0) {
          result.modifierGroupsTable.columns = Object.keys(groupsData[0])
        }
      }
    } catch (err) {
      console.log('[diagnose] Modifier groups table check failed:', err)
    }

    // Check products table
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5)
      
      if (!productsError && productsData) {
        result.productsTable.exists = true
        result.productsTable.rowCount = productsData.length
        result.productsTable.sampleData = productsData
        
        if (productsData.length > 0) {
          result.productsTable.columns = Object.keys(productsData[0])
        }
      }
    } catch (err) {
      console.log('[diagnose] Products table check failed:', err)
    }

  } catch (err) {
    console.error('[diagnose] Database diagnosis failed:', err)
  }

  return result
}

// ================================================
// MENUCARD CATEGORY MANAGEMENT
// ================================================

export async function getMenucardCategories(menucardId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('menucard_categories')
    .select('category_id')
    .eq('menucard_id', menucardId)
    .order('sort_index', { ascending: true })

  if (error) {
    console.error('[getMenucardCategories] Query error:', error)
    throw new Error(`Failed to fetch menucard categories: ${error.message}`)
  }

  const categoryIds = data?.map(item => item.category_id) || []
  console.log('[getMenucardCategories] Found category IDs for menucard', menucardId, ':', categoryIds)

  return categoryIds
}

export async function updateMenucardCategories(
  menucardId: string, 
  categoryIds: string[]
): Promise<void> {
  // First, delete existing relationships
  const { error: deleteError } = await supabase
    .from('menucard_categories')
    .delete()
    .eq('menucard_id', menucardId)

  if (deleteError) {
    console.error('[updateMenucardCategories] Delete error:', deleteError)
    throw new Error(`Failed to clear menucard categories: ${deleteError.message}`)
  }

  // If no categories to add, we're done
  if (categoryIds.length === 0) return

  // Insert new relationships with sort_index
  const relationships = categoryIds.map((categoryId, index) => ({
    menucard_id: menucardId,
    category_id: categoryId,
    sort_index: index
  }))

  const { error: insertError } = await supabase
    .from('menucard_categories')
    .insert(relationships)

  if (insertError) {
    console.error('[updateMenucardCategories] Insert error:', insertError)
    throw new Error(`Failed to add menucard categories: ${insertError.message}`)
  }
}

export async function setActiveMenucard(menucardId: string): Promise<void> {
  // First, deactivate all menucards
  const { error: deactivateError } = await supabase
    .from('menucards')
    .update({ active: false })
    .eq('active', true)

  if (deactivateError) {
    console.error('[setActiveMenucard] Deactivate error:', deactivateError)
    throw new Error(`Failed to deactivate other menucards: ${deactivateError.message}`)
  }

  // Then activate the selected menucard
  const { error: activateError } = await supabase
    .from('menucards')
    .update({ active: true })
    .eq('id', menucardId)

  if (activateError) {
    console.error('[setActiveMenucard] Activate error:', activateError)
    throw new Error(`Failed to activate menucard: ${activateError.message}`)
  }
}

export async function getActiveMenucard(): Promise<Menucard | null> {
  const { data, error } = await supabase
    .from('menucards')
    .select('*')
    .eq('active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No active menucard found
      console.log('[getActiveMenucard] No active menucard found')
      return null
    }
    console.error('[getActiveMenucard] Query error:', error)
    throw new Error(`Failed to fetch active menucard: ${error.message}`)
  }

  console.log('[getActiveMenucard] Found active menucard:', { id: data.id, name: data.name, active: data.active })
  return data
}

// ================================================
// MENU DATA FOR ORDERS (Active Menu Source)
// ================================================

export async function getActiveMenuData(): Promise<{
  menucard: Menucard | null
  categories: Category[]
  products: Product[]
}> {
  const activeMenucard = await getActiveMenucard()

  if (!activeMenucard) {
    return {
      menucard: null,
      categories: [],
      products: []
    }
  }

  // Get categories for this menucard
  const categoryIds = await getMenucardCategories(activeMenucard.id)

  let categories: Category[] = []
  let products: Product[] = []

  if (categoryIds.length > 0) {
    // Get categories
    const { data: cats, error: catsError } = await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds)
      .eq('active', true)
      .order('sort_index', { ascending: true })

    if (catsError) {
      console.error('[getActiveMenuData] Categories error:', catsError)
    } else {
      categories = cats || []
      console.log('[getActiveMenuData] Retrieved categories:', categories.map(c => ({
        id: c.id,
        name: c.name,
        parent_id: c.parent_id,
        active: c.active
      })))
    }

    // Get products for these categories
    const { data: prods, error: prodsError } = await supabase
      .from('products')
      .select('*')
      .in('category_id', categoryIds)
      .eq('active', true)
      .order('sort_index', { ascending: true })

    if (prodsError) {
      console.error('[getActiveMenuData] Products error:', prodsError)
    } else {
      products = prods || []
    }
  }

  return {
    menucard: activeMenucard,
    categories,
    products
  }
}

// ================================================
// MISSING FUNCTIONS FOR HOOKS
// ================================================

export async function createPricing(pricingData: {
  product_id: string
  context: 'dine_in' | 'takeaway' | 'delivery'
  price: number
  tax_code_id?: string
}): Promise<ProductPrice> {
  const { product_id, context, price, tax_code_id } = pricingData

  const { data, error } = await supabase
    .from('product_prices')
    .insert({
      product_id,
      context,
      price,
      tax_code_id,
      active: true
    })
    .select()
    .single()

  if (error) {
    console.error('[createPricing] Insert error:', error)
    throw new Error(`Failed to create pricing: ${error.message}`)
  }

  return data
}

export async function updatePricing(id: string, updates: Partial<ProductPrice>): Promise<ProductPrice> {
  const { data, error } = await supabase
    .from('product_prices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updatePricing] Update error:', error)
    throw new Error(`Failed to update pricing: ${error.message}`)
  }

  return data
}

export async function getMenu(options?: {
  menucardId?: string
  active?: boolean
}): Promise<{
  menucard: Menucard | null
  categories: Category[]
  products: Product[]
  modifierGroups: ModifierGroup[]
}> {
  const activeMenucard = await getActiveMenucard()
  const categories = await getCategories(options)
  const products = await getProducts(options)
  const modifierGroups = await getModifierGroups(options)

  return {
    menucard: activeMenucard,
    categories,
    products,
    modifierGroups
  }
}

// ================================================
// REORDER FUNCTIONS (moved from reorder.repo.ts)
// ================================================

export async function moveItemUp(items: any[], itemId: string, reorderFn: (newOrder: string[]) => Promise<any>): Promise<void> {
  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex <= 0) return

  const newItems = [...items]
  ;[newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]]

  await reorderFn(newItems.map(item => item.id))
}

export async function moveItemDown(items: any[], itemId: string, reorderFn: (newOrder: string[]) => Promise<any>): Promise<void> {
  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex >= items.length - 1) return

  const newItems = [...items]
  ;[newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]]

  await reorderFn(newItems.map(item => item.id))
}

export async function moveItemToPosition(items: any[], itemId: string, newPosition: number, reorderFn: (newOrder: string[]) => Promise<any>): Promise<void> {
  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex === -1 || newPosition < 0 || newPosition >= items.length) return

  const newItems = [...items]
  const [item] = newItems.splice(currentIndex, 1)
  newItems.splice(newPosition, 0, item)

  await reorderFn(newItems.map(item => item.id))
}

export async function reorderProductGroups(newOrder: string[]): Promise<void> {
  // TODO: Implement actual Supabase call when product_groups table has sort_index
  console.log('Reordering product groups:', newOrder)
}
