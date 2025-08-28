import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// UNIFIED MENU API - SINGLE ENDPOINT FOR ALL OPERATIONS
// ================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    
    if (!resource) {
      return NextResponse.json({
        message: 'Unified Menu API v2.0',
        usage: 'Add ?resource=categories|products|modifiers|pricing|menucards&action=get|list|search',
        examples: {
          'List categories': '/api/menu?action=categories&list',
          'Get product': '/api/menu?action=products&get&id=uuid',
          'Search products': '/api/menu?action=products&search&q=name'
        }
      })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    switch (resource) {
      case 'categories':
        return handleCategories(supabase, action, searchParams)
      case 'products':
        return handleProducts(supabase, action, searchParams)
      case 'modifiers':
        return handleModifiers(supabase, action, searchParams)
      case 'pricing':
        return handlePricing(supabase, action, searchParams)
      case 'menucards':
        return handleMenucards(supabase, action, searchParams)
      default:
        return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Unified Menu API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const action = searchParams.get('action')
    
    if (!resource || !action) {
      return NextResponse.json({ error: 'Resource and action required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    switch (resource) {
      case 'categories':
        return handleCategories(supabase, action, undefined, body)
      case 'products':
        return handleProducts(supabase, action, undefined, body)
      case 'modifiers':
        return handleModifiers(supabase, action, undefined, body)
      case 'pricing':
        return handlePricing(supabase, action, undefined, body)
      case 'menucards':
        return handleMenucards(supabase, action, undefined, body)
      default:
        return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Unified Menu API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    
    if (!resource || !action || !id) {
      return NextResponse.json({ error: 'Resource, action, and id required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    switch (resource) {
      case 'categories':
        return handleCategories(supabase, action, { id }, body)
      case 'products':
        return handleProducts(supabase, action, { id }, body)
      case 'modifiers':
        return handleModifiers(supabase, action, { id }, body)
      case 'pricing':
        return handlePricing(supabase, action, { id }, body)
      case 'menucards':
        return handleMenucards(supabase, action, { id }, body)
      default:
        return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Unified Menu API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const id = searchParams.get('id')
    
    if (!resource || !id) {
      return NextResponse.json({ error: 'Resource and id required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    switch (resource) {
      case 'categories':
        return handleCategories(supabase, 'delete', { id })
      case 'products':
        return handleProducts(supabase, 'delete', { id })
      case 'modifiers':
        return handleModifiers(supabase, 'delete', { id })
      case 'pricing':
        return handlePricing(supabase, 'delete', { id })
      case 'menucards':
        return handleMenucards(supabase, 'delete', { id })
      default:
        return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Unified Menu API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ================================================
// RESOURCE HANDLERS
// ================================================

async function handleCategories(supabase: any, action: string, params?: any, body?: any) {
  switch (action) {
    case 'list':
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select(`
          *,
          parent:categories!parent_id(id, name),
          children:categories!parent_id(id, name, sort_index, active),
          products!inner(id, name, active)
        `)
        .order('sort_index')
      
      if (catError) throw catError
      
      const transformed = categories?.map((cat: any) => ({
        ...cat,
        has_children: (cat.children || []).length > 0,
        product_count: (cat.products || []).length,
        level: cat.parent_id ? 1 : 0
      })) || []
      
      return NextResponse.json({ data: transformed })
      
    case 'get':
      const { data: category, error: getError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (getError) throw getError
      return NextResponse.json({ data: category })
      
    case 'create':
      const { data: newCat, error: createError } = await supabase
        .from('categories')
        .insert(body)
        .select()
        .single()
      
      if (createError) throw createError
      return NextResponse.json({ data: newCat })
      
    case 'update':
      const { data: updatedCat, error: updateError } = await supabase
        .from('categories')
        .update(body)
        .eq('id', params.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return NextResponse.json({ data: updatedCat })
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from('categories')
        .update({ active: false })
        .eq('id', params.id)
      
      if (deleteError) throw deleteError
      return NextResponse.json({ success: true })
      
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}

async function handleProducts(supabase: any, action: string, params?: any, body?: any) {
  switch (action) {
    case 'list':
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_group:product_groups(id, name),
          prices:product_prices(*),
          modifier_groups:product_modifier_groups(
            group:modifier_groups(id, name, min_select, max_select)
          )
        `)
        .eq('active', true)
        .order('sort_index')
      
      if (prodError) throw prodError
      return NextResponse.json({ data: products })
      
    case 'get':
      const { data: product, error: getError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_group:product_groups(id, name),
          prices:product_prices(*)
        `)
        .eq('id', params.id)
        .single()
      
      if (getError) throw getError
      return NextResponse.json({ data: product })
      
    case 'create':
      // Use the upsert_product_with_prices function for atomic operations
      const { data: newProd, error: createError } = await supabase
        .rpc('upsert_product_with_prices', {
          p_product_id: null,
          p_name: body.name,
          p_category_id: body.category_id,
          p_product_group_id: body.product_group_id,
          p_description: body.description,
          p_dine_in_price: body.dine_in_price,
          p_dine_in_tax: body.dine_in_tax,
          p_takeaway_price: body.takeaway_price,
          p_takeaway_tax: body.takeaway_tax
        })
      
      if (createError) throw createError
      return NextResponse.json({ data: { id: newProd } })
      
    case 'update':
      const { data: updatedProd, error: updateError } = await supabase
        .from('products')
        .update(body)
        .eq('id', params.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return NextResponse.json({ data: updatedProd })
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', params.id)
      
      if (deleteError) throw deleteError
      return NextResponse.json({ success: true })
      
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}

async function handleModifiers(supabase: any, action: string, params?: any, body?: any) {
  switch (action) {
    case 'list':
      const { data: modifiers, error: modError } = await supabase
        .from('modifier_groups')
        .select(`
          *,
          modifiers(*)
        `)
        .eq('active', true)
        .order('sort_index')
      
      if (modError) throw modError
      return NextResponse.json({ data: modifiers })
      
    case 'get':
      const { data: modifier, error: getError } = await supabase
        .from('modifier_groups')
        .select(`
          *,
          modifiers(*)
        `)
        .eq('id', params.id)
        .single()
      
      if (getError) throw getError
      return NextResponse.json({ data: modifier })
      
    case 'create':
      if (body.type === 'group') {
        const { data: newGroup, error: createError } = await supabase
          .from('modifier_groups')
          .insert(body)
          .select()
          .single()
        
        if (createError) throw createError
        return NextResponse.json({ data: newGroup })
      } else {
        const { data: newMod, error: createError } = await supabase
          .from('modifiers')
          .insert(body)
          .select()
          .single()
        
        if (createError) throw createError
        return NextResponse.json({ data: newMod })
      }
      
    case 'update':
      if (body.type === 'group') {
        const { data: updatedGroup, error: updateError } = await supabase
          .from('modifier_groups')
          .update(body)
          .eq('id', params.id)
          .select()
          .single()
        
        if (updateError) throw updateError
        return NextResponse.json({ data: updatedGroup })
      } else {
        const { data: updatedMod, error: updateError } = await supabase
          .from('modifiers')
          .update(body)
          .eq('id', params.id)
          .select()
          .single()
        
        if (updateError) throw updateError
        return NextResponse.json({ data: updatedMod })
      }
      
    case 'delete':
      if (body.type === 'group') {
        const { error: deleteError } = await supabase
          .from('modifier_groups')
          .update({ active: false })
          .eq('id', params.id)
        
        if (deleteError) throw deleteError
      } else {
        const { error: deleteError } = await supabase
          .from('modifiers')
          .update({ active: false })
          .eq('id', params.id)
        
        if (deleteError) throw deleteError
      }
      
      return NextResponse.json({ success: true })
      
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}

async function handlePricing(supabase: any, action: string, params?: any, body?: any) {
  switch (action) {
    case 'list':
      const { data: pricing, error: priceError } = await supabase
        .from('product_prices')
        .select(`
          *,
          product:products(id, name),
          tax_code:tax_codes(id, name, rate)
        `)
        .order('created_at')
      
      if (priceError) throw priceError
      return NextResponse.json({ data: pricing })
      
    case 'get':
      const { data: price, error: getError } = await supabase
        .from('product_prices')
        .select(`
          *,
          product:products(id, name),
          tax_code:tax_codes(id, name, rate)
        `)
        .eq('id', params.id)
        .single()
      
      if (getError) throw getError
      return NextResponse.json({ data: price })
      
    case 'create':
      const { data: newPrice, error: createError } = await supabase
        .from('product_prices')
        .insert(body)
        .select()
        .single()
      
      if (createError) throw createError
      return NextResponse.json({ data: newPrice })
      
    case 'update':
      const { data: updatedPrice, error: updateError } = await supabase
        .from('product_prices')
        .update(body)
        .eq('id', params.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return NextResponse.json({ data: updatedPrice })
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from('product_prices')
        .delete()
        .eq('id', params.id)
      
      if (deleteError) throw deleteError
      return NextResponse.json({ success: true })
      
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}

async function handleMenucards(supabase: any, action: string, params?: any, body?: any) {
  switch (action) {
    case 'list':
      const { data: menucards, error: menuError } = await supabase
        .from('menucards')
        .select(`
          *,
          categories:menucard_categories(
            category:categories(id, name, sort_index)
          )
        `)
        .eq('active', true)
        .order('sort_index')
      
      if (menuError) throw menuError
      return NextResponse.json({ data: menucards })
      
    case 'get':
      const { data: menucard, error: getError } = await supabase
        .from('menucards')
        .select(`
          *,
          categories:menucard_categories(
            category:categories(id, name, sort_index)
          )
        `)
        .eq('id', params.id)
        .single()
      
      if (getError) throw getError
      return NextResponse.json({ data: menucard })
      
    case 'create':
      const { data: newMenu, error: createError } = await supabase
        .from('menucards')
        .insert(body)
        .select()
        .single()
      
      if (createError) throw createError
      return NextResponse.json({ data: newMenu })
      
    case 'update':
      const { data: updatedMenu, error: updateError } = await supabase
        .from('menucards')
        .update(body)
        .eq('id', params.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      return NextResponse.json({ data: updatedMenu })
      
    case 'delete':
      const { error: deleteError } = await supabase
        .from('menucards')
        .update({ active: false })
        .eq('id', params.id)
      
      if (deleteError) throw deleteError
      return NextResponse.json({ success: true })
      
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
