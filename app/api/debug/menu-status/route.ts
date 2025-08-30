import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check active menucard
    const { data: activeMenucard, error: menucardError } = await supabase
      .from('menucards')
      .select('*')
      .eq('active', true)
      .single()

    // Check all menucards
    const { data: allMenucards, error: allMenucardsError } = await supabase
      .from('menucards')
      .select('*')
      .order('created_at', { ascending: false })

    // Check all categories
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name')

    // Check menucard_categories links
    const { data: menucardCategories, error: linksError } = await supabase
      .from('menucard_categories')
      .select(`
        *,
        category:categories(*),
        menucard:menucards(*)
      `)

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)

    return NextResponse.json({
      success: true,
      debug: {
        activeMenucard: {
          found: !!activeMenucard,
          data: activeMenucard,
          error: menucardError?.message
        },
        allMenucards: {
          count: allMenucards?.length || 0,
          data: allMenucards,
          error: allMenucardsError?.message
        },
        categories: {
          count: allCategories?.length || 0,
          data: allCategories,
          error: categoriesError?.message
        },
        menucardCategoriesLinks: {
          count: menucardCategories?.length || 0,
          data: menucardCategories,
          error: linksError?.message
        },
        products: {
          count: products?.length || 0,
          data: products,
          error: productsError?.message
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
