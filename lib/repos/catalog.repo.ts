// ================================================
// CATALOG REPOSITORY
// Categories, Products, and Product Groups
// ================================================

import { supabase } from '@/lib/supabaseClient'
import { MenuRepositoryError } from '@/lib/types/menu'
import type { 
  Category, 
  Product, 
  ProductGroup, 
  ProductWithPricing,
  CategoryFormData,
  ProductGroupFormData
} from '@/lib/types/menu'



// ================================================
// CATEGORIES
// ================================================

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch categories', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching categories', 'UNKNOWN_ERROR', error)
  }
}

export async function getRootCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch root categories', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error fetching root categories', 'UNKNOWN_ERROR', error)
  }
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch subcategories', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error fetching subcategories', 'UNKNOWN_ERROR', error)
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new MenuRepositoryError('Failed to fetch category', 'FETCH_ERROR', error)
    }
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error fetching category', 'UNKNOWN_ERROR', error)
  }
}

export async function createCategory(categoryData: CategoryFormData): Promise<Category> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        parent_id: categoryData.parent_id || null,
        description: categoryData.description,
        sort_index: categoryData.sort_index || 0,
        print_sort_index: categoryData.sort_index || 0,
        active: true
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to create category', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error creating category', 'UNKNOWN_ERROR', error)
  }
}

export async function updateCategory(id: string, updates: Partial<CategoryFormData>): Promise<Category> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to update category', 'UPDATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error updating category', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .update({ active: false })
      .eq('id', id)

    if (error) throw new MenuRepositoryError('Failed to delete category', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting category', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// PRODUCTS
// ================================================

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_index, name')

    if (error) throw new MenuRepositoryError('Failed to fetch products', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching products', 'UNKNOWN_ERROR', error)
  }
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('sort_index, name')

    if (error) throw new MenuRepositoryError('Failed to fetch products by category', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching products by category', 'UNKNOWN_ERROR', error)
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new Error(`Failed to fetch product: ${error.message}`)
    }
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error fetching product', 'UNKNOWN_ERROR', error)
  }
}

export async function createProduct(productData: {
  name: string
  category_id?: string | null
  product_group_id?: string | null
  description?: string
  sort_index?: number
}): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        category_id: productData.category_id || null,
        product_group_id: productData.product_group_id || null,
        description: productData.description,
        sort_index: productData.sort_index || 0,
        active: true
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create product: ${error.message}`)
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error creating product', 'UNKNOWN_ERROR', error)
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update product: ${error.message}`)
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error updating product', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete product: ${error.message}`)
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error deleting product', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// PRODUCT GROUPS
// ================================================

export async function getProductGroups(): Promise<ProductGroup[]> {
  try {
    const { data, error } = await supabase
      .from('product_groups')
      .select('*')
      .eq('active', true)
      .order('sort_index')

    if (error) throw new Error(`Failed to fetch product groups: ${error.message}`)
    return data || []
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error fetching product groups', 'UNKNOWN_ERROR', error)
  }
}

export async function getProductGroup(id: string): Promise<ProductGroup | null> {
  try {
    const { data, error } = await supabase
      .from('product_groups')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new Error(`Failed to fetch product group: ${error.message}`)
    }
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error fetching product group', 'UNKNOWN_ERROR', error)
  }
}

export async function createProductGroup(groupData: ProductGroupFormData): Promise<ProductGroup> {
  try {
    const { data, error } = await supabase
      .from('product_groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        sort_index: groupData.sort_index || 0,
        active: true
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create product group: ${error.message}`)
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error creating product group', 'UNKNOWN_ERROR', error)
  }
}

export async function updateProductGroup(id: string, updates: Partial<ProductGroupFormData>): Promise<ProductGroup> {
  try {
    const { data, error } = await supabase
      .from('product_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update product group: ${error.message}`)
    return data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error updating product group', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteProductGroup(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_groups')
      .update({ active: false })
      .eq('id', id)

    if (error) throw new Error(`Failed to delete product group: ${error.message}`)
  } catch (error) {
    if (error instanceof Error) throw error
    throw new MenuRepositoryError('Unexpected error deleting product group', 'UNKNOWN_ERROR', error)
  }
}
