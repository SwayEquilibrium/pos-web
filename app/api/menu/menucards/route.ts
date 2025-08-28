import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ================================================
// MENUCARDS CRUD API
// ================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const menucardId = searchParams.get('id')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    let query = supabase
      .from('menucards')
      .select(`
        *,
        categories:menucard_categories(
          id,
          sort_index,
          category:categories(
            id,
            name,
            description,
            active,
            sort_index
          )
        ),
        products:menucard_products(
          id,
          sort_index,
          product:products(
            id,
            name,
            description,
            active,
            sort_index
          )
        )
      `)
      .order('sort_index')
    
    if (menucardId) {
      query = query.eq('id', menucardId)
    }
    
    if (!includeInactive) {
      query = query.eq('active', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Menucards query error:', error)
      return NextResponse.json({ error: 'Failed to fetch menucards' }, { status: 500 })
    }
    
    // Transform data to include computed fields
    const transformedData = data?.map((menucard: any) => ({
      ...menucard,
      category_count: (menucard.categories || []).length,
      product_count: (menucard.products || []).length,
      has_categories: (menucard.categories || []).length > 0,
      has_products: (menucard.products || []).length > 0
    })) || []
    
    return NextResponse.json({ data: transformedData })
  } catch (error) {
    console.error('Menucards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { name, description, sort_index = 0, categories = [], products = [] } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Menucard name is required' }, { status: 400 })
    }
    
    // Get the next sort index if not provided
    let finalSortIndex = sort_index
    if (sort_index === 0) {
      const { data: maxSort } = await supabase
        .from('menucards')
        .select('sort_index')
        .order('sort_index', { ascending: false })
        .limit(1)
        .single()
      
      finalSortIndex = (maxSort?.sort_index || 0) + 1
    }
    
    // Create menucard
    const { data: menucard, error: menucardError } = await supabase
      .from('menucards')
      .insert({
        name,
        description: description || null,
        sort_index: finalSortIndex,
        active: true
      })
      .select()
      .single()
    
    if (menucardError) {
      console.error('Menucard creation error:', menucardError)
      return NextResponse.json({ error: 'Failed to create menucard' }, { status: 500 })
    }
    
    // Create category associations if provided
    if (categories.length > 0) {
      const categoryData = categories.map((categoryId: string, index: number) => ({
        menucard_id: menucard.id,
        category_id: categoryId,
        sort_index: index + 1
      }))
      
      const { error: categoryError } = await supabase
        .from('menucard_categories')
        .insert(categoryData)
      
      if (categoryError) {
        console.error('Category association error:', categoryError)
        // Don't fail the whole request, just log the error
      }
    }
    
    // Create product associations if provided
    if (products.length > 0) {
      const productData = products.map((productId: string, index: number) => ({
        menucard_id: menucard.id,
        product_id: productId,
        sort_index: index + 1
      }))
      
      const { error: productError } = await supabase
        .from('menucard_products')
        .insert(productData)
      
      if (productError) {
        console.error('Product association error:', productError)
        // Don't fail the whole request, just log the error
      }
    }
    
    return NextResponse.json({ 
      data: menucard,
      message: 'Menucard created successfully' 
    })
  } catch (error) {
    console.error('Menucard creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, updates, categories, products } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Menucard ID is required' }, { status: 400 })
    }
    
    // Update menucard
    const { data: menucard, error: menucardError } = await supabase
      .from('menucards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (menucardError) {
      console.error('Menucard update error:', menucardError)
      return NextResponse.json({ error: 'Failed to update menucard' }, { status: 500 })
    }
    
    // Update category associations if provided
    if (categories && categories.length >= 0) {
      // Delete existing category associations
      await supabase
        .from('menucard_categories')
        .delete()
        .eq('menucard_id', id)
      
      // Insert new category associations
      if (categories.length > 0) {
        const categoryData = categories.map((categoryId: string, index: number) => ({
          menucard_id: id,
          category_id: categoryId,
          sort_index: index + 1
        }))
        
        const { error: categoryError } = await supabase
          .from('menucard_categories')
          .insert(categoryData)
        
        if (categoryError) {
          console.error('Category association update error:', categoryError)
          // Don't fail the whole request, just log the error
        }
      }
    }
    
    // Update product associations if provided
    if (products && products.length >= 0) {
      // Delete existing product associations
      await supabase
        .from('menucard_products')
        .delete()
        .eq('menucard_id', id)
      
      // Insert new product associations
      if (products.length > 0) {
        const productData = products.map((productId: string, index: number) => ({
          menucard_id: id,
          product_id: productId,
          sort_index: index + 1
        }))
        
        const { error: productError } = await supabase
          .from('menucard_products')
          .insert(productData)
        
        if (productError) {
          console.error('Product association update error:', productError)
          // Don't fail the whole request, just log the error
        }
      }
    }
    
    return NextResponse.json({ 
      data: menucard,
      message: 'Menucard updated successfully' 
    })
  } catch (error) {
    console.error('Menucard update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const menucardId = searchParams.get('id')
    
    if (!menucardId) {
      return NextResponse.json({ error: 'Menucard ID is required' }, { status: 400 })
    }
    
    // Soft delete - set active to false
    const { error } = await supabase
      .from('menucards')
      .update({ active: false })
      .eq('id', menucardId)
    
    if (error) {
      console.error('Menucard deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete menucard' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Menucard deleted successfully' 
    })
  } catch (error) {
    console.error('Menucard deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
