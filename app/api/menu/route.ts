import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// CONSOLIDATED MENU API - SINGLE SOURCE OF TRUTH
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const action = searchParams.get('action')
    const categoryId = searchParams.get('categoryId')
    const menucardId = searchParams.get('menucardId')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    switch (action) {
      case 'categories':
        return await getCategories(supabase, { categoryId, menucardId, includeInactive })
      case 'products':
        return await getProducts(supabase, { categoryId, menucardId, includeInactive })
      case 'modifiers':
        return await getModifiers(supabase)
      case 'pricing':
        return await getPricing(supabase)
      case 'menucards':
        return await getMenucards(supabase)
      case 'menu':
        return await getMenu(supabase, menucardId)
      default:
        return NextResponse.json({
          message: 'Consolidated Menu API',
          version: '2.0.0',
          endpoints: {
            categories: '/api/menu?action=categories',
            products: '/api/menu?action=products',
            modifiers: '/api/menu?action=modifiers',
            pricing: '/api/menu?action=pricing',
            menucards: '/api/menu?action=menucards',
            menu: '/api/menu?action=menu'
          },
          usage: 'Use ?action=endpoint to access specific data'
        })
    }
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()
    
    switch (action) {
      case 'categories':
        return await createCategory(supabase, body)
      case 'products':
        return await createProduct(supabase, body)
      case 'modifiers':
        return await createModifier(supabase, body)
      case 'pricing':
        return await createPricing(supabase, body)
      case 'menucards':
        return await createMenucard(supabase, body)
      default:
        return NextResponse.json(
          { error: 'Action parameter required for POST requests' }, 
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()
    
    switch (action) {
      case 'categories':
        return await updateCategory(supabase, body)
      case 'products':
        return await updateProduct(supabase, body)
      case 'modifiers':
        return await updateModifier(supabase, body)
      case 'pricing':
        return await updatePricing(supabase, body)
      case 'menucards':
        return await updateMenucard(supabase, body)
      default:
        return NextResponse.json(
          { error: 'Action parameter required for PUT requests' }, 
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter required' }, { status: 400 })
    }
    
    switch (action) {
      case 'categories':
        return await deleteCategory(supabase, id)
      case 'products':
        return await deleteProduct(supabase, id)
      case 'modifiers':
        return await deleteModifier(supabase, id)
      case 'menucards':
        return await deleteMenucard(supabase, id)
      default:
        return NextResponse.json(
          { error: 'Action parameter required for DELETE requests' }, 
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// ================================================
// IMPLEMENTATION FUNCTIONS
// ================================================

async function getCategories(supabase: any, options: any) {
  const { categoryId, menucardId, includeInactive } = options
  
  let query = supabase
    .from('categories')
    .select(`
      *,
      parent:categories!parent_id(id, name),
      children:categories!parent_id(id, name, sort_index, active),
      products!inner(id, name, active)
    `)
    .order('sort_index')
  
  if (categoryId) {
    query = query.eq('id', categoryId)
  }
  
  if (menucardId) {
    query = query.in('id', 
      supabase
        .from('menucard_categories')
        .select('category_id')
        .eq('menucard_id', menucardId)
    )
  }
  
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Categories query error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
  
  const transformedData = data?.map((category: any) => ({
    ...category,
    has_children: (category.children || []).length > 0,
    product_count: (category.products || []).length,
    child_categories: (category.children || []).length,
    level: category.parent_id ? 1 : 0
  })) || []
  
  return NextResponse.json({ data: transformedData })
}

async function getProducts(supabase: any, options: any) {
  const { categoryId, menucardId, includeInactive } = options
  
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      product_group:product_groups(id, name),
      prices:product_prices(*),
      modifier_groups:product_modifier_groups(
        modifier_group:modifier_groups(
          id, name, min_select, max_select,
          modifiers(id, name, price_delta, kind)
        )
      )
    `)
    .order('sort_index')
  
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  
  if (menucardId) {
    query = query.in('category_id', 
      supabase
        .from('menucard_categories')
        .select('category_id')
        .eq('menucard_id', menucardId)
    )
  }
  
  if (!includeInactive) {
    query = query.eq('active', true)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Products query error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getModifiers(supabase: any) {
  const { data, error } = await supabase
    .from('modifier_groups')
    .select(`
      *,
      modifiers(*)
    `)
    .eq('active', true)
    .order('sort_index')
  
  if (error) {
    console.error('Modifiers query error:', error)
    return NextResponse.json({ error: 'Failed to fetch modifiers' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getPricing(supabase: any) {
  const { data, error } = await supabase
    .from('product_prices')
    .select(`
      *,
      product:products(name),
      tax_code:tax_codes(name, rate)
    `)
    .order('created_at')
  
  if (error) {
    console.error('Pricing query error:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getMenucards(supabase: any) {
  const { data, error } = await supabase
    .from('menucards')
    .select(`
      *,
      categories:menucard_categories(
        category:categories(*)
      )
    `)
    .eq('active', true)
    .order('sort_index')
  
  if (error) {
    console.error('Menucards query error:', error)
    return NextResponse.json({ error: 'Failed to fetch menucards' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function getMenu(supabase: any, menucardId?: string) {
  if (!menucardId) {
    return NextResponse.json({ error: 'Menucard ID required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('menucards')
    .select(`
      *,
      categories:menucard_categories(
        sort_index,
        category:categories(
          *,
          products(
            *,
            prices:product_prices(*),
            modifier_groups:product_modifier_groups(
              modifier_group:modifier_groups(
                id, name, min_select, max_select,
                modifiers(id, name, price_delta, kind)
              )
            )
          )
        )
      )
    `)
    .eq('id', menucardId)
    .eq('active', true)
    .single()
  
  if (error) {
    console.error('Menu query error:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

// CRUD operations
async function createCategory(supabase: any, body: any) {
  const { name, description, parent_id, sort_index = 0 } = body
  
  if (!name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }
  
  // Get the next sort index if not provided
  let finalSortIndex = sort_index
  if (sort_index === 0) {
    const { data: maxSort } = await supabase
      .from('categories')
      .select('sort_index')
      .eq('parent_id', parent_id || null)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single()
    
    finalSortIndex = (maxSort?.sort_index || 0) + 1
  }
  
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      description,
      parent_id,
      sort_index: finalSortIndex
    })
    .select()
    .single()
  
  if (error) {
    console.error('Category creation error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function createProduct(supabase: any, body: any) {
  const { name, category_id, product_group_id, description, dine_in_price, takeaway_price, dine_in_tax, takeaway_tax } = body
  
  if (!name || !category_id) {
    return NextResponse.json({ error: 'Product name and category are required' }, { status: 400 })
  }
  
  // Use the database function for atomic operation
  const { data, error } = await supabase.rpc('upsert_product_with_prices', {
    p_product_id: null,
    p_name: name,
    p_category_id: category_id,
    p_product_group_id: product_group_id,
    p_description: description,
    p_dine_in_price: dine_in_price,
    p_dine_in_tax: dine_in_tax,
    p_takeaway_price: takeaway_price,
    p_takeaway_tax: takeaway_tax
  })
  
  if (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
  
  return NextResponse.json({ data: { id: data } })
}

async function createModifier(supabase: any, body: any) {
  const { name, group_id, description, kind, price_delta, sort_index = 0 } = body
  
  if (!name || !group_id) {
    return NextResponse.json({ error: 'Modifier name and group are required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('modifiers')
    .insert({
      name,
      group_id,
      description,
      kind: kind || 'add',
      price_delta: price_delta || 0,
      sort_index
    })
    .select()
    .single()
  
  if (error) {
    console.error('Modifier creation error:', error)
    return NextResponse.json({ error: 'Failed to create modifier' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function createPricing(supabase: any, body: any) {
  const { product_id, context, price, tax_code_id } = body
  
  if (!product_id || !context || price === undefined) {
    return NextResponse.json({ error: 'Product ID, context, and price are required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('product_prices')
    .insert({
      product_id,
      context,
      price,
      tax_code_id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Pricing creation error:', error)
    return NextResponse.json({ error: 'Failed to create pricing' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function createMenucard(supabase: any, body: any) {
  const { name, description, sort_index = 0 } = body
  
  if (!name) {
    return NextResponse.json({ error: 'Menucard name is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('menucards')
    .insert({
      name,
      description,
      sort_index
    })
    .select()
    .single()
  
  if (error) {
    console.error('Menucard creation error:', error)
    return NextResponse.json({ error: 'Failed to create menucard' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

// Update operations
async function updateCategory(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Category update error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function updateProduct(supabase: any, body: any) {
  const { id, dine_in_price, takeaway_price, dine_in_tax, takeaway_tax, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }
  
  // Update product first
  const { error: productError } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
  
  if (productError) {
    console.error('Product update error:', productError)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
  
  // Update pricing if provided
  if (dine_in_price !== undefined || dine_in_tax !== undefined) {
    const { error: priceError } = await supabase
      .from('product_prices')
      .upsert({
        product_id: id,
        context: 'dine_in',
        price: dine_in_price,
        tax_code_id: dine_in_tax
      })
    
    if (priceError) {
      console.error('Dine-in pricing update error:', priceError)
    }
  }
  
  if (takeaway_price !== undefined || takeaway_tax !== undefined) {
    const { error: priceError } = await supabase
      .from('product_prices')
      .upsert({
        product_id: id,
        context: 'takeaway',
        price: takeaway_price,
        tax_code_id: takeaway_tax
      })
    
    if (priceError) {
      console.error('Takeaway pricing update error:', priceError)
    }
  }
  
  return NextResponse.json({ success: true })
}

async function updateModifier(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Modifier ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('modifiers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Modifier update error:', error)
    return NextResponse.json({ error: 'Failed to update modifier' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function updatePricing(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Pricing ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('product_prices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Pricing update error:', error)
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

async function updateMenucard(supabase: any, body: any) {
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Menucard ID is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('menucards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Menucard update error:', error)
    return NextResponse.json({ error: 'Failed to update menucard' }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}

// Delete operations
async function deleteCategory(supabase: any, id: string) {
  const { error } = await supabase
    .from('categories')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

async function deleteProduct(supabase: any, id: string) {
  const { error } = await supabase
    .from('products')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

async function deleteModifier(supabase: any, id: string) {
  const { error } = await supabase
    .from('modifiers')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Modifier deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete modifier' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}

async function deleteMenucard(supabase: any, id: string) {
  const { error } = await supabase
    .from('menucards')
    .update({ active: false })
    .eq('id', id)
  
  if (error) {
    console.error('Menucard deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete menucard' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
