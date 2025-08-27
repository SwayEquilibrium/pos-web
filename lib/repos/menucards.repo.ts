// ================================================
// MENUCARDS REPOSITORY
// Menucards and their category relationships
// ================================================

import { supabase } from '@/lib/supabaseClient'
import type { 
  Menucard, 
  MenucardCategory,
  Category,
  MenucardFormData,
  MenuRepositoryError 
} from '@/lib/types/menu'

// ================================================
// MENUCARDS
// ================================================

export async function getMenucards(): Promise<Menucard[]> {
  try {
    const { data, error } = await supabase
      .from('menucards')
      .select('*')
      .eq('active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch menucards', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching menucards', 'UNKNOWN_ERROR', error)
  }
}

export async function getMenucard(id: string): Promise<Menucard | null> {
  try {
    const { data, error } = await supabase
      .from('menucards')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new MenuRepositoryError('Failed to fetch menucard', 'FETCH_ERROR', error)
    }
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching menucard', 'UNKNOWN_ERROR', error)
  }
}

export async function createMenucard(menucardData: MenucardFormData): Promise<Menucard> {
  try {
    const { data, error } = await supabase
      .from('menucards')
      .insert({
        name: menucardData.name,
        description: menucardData.description,
        sort_index: menucardData.sort_index || 0,
        active: true
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to create menucard', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error creating menucard', 'UNKNOWN_ERROR', error)
  }
}

export async function updateMenucard(id: string, updates: Partial<MenucardFormData>): Promise<Menucard> {
  try {
    const { data, error } = await supabase
      .from('menucards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to update menucard', 'UPDATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error updating menucard', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteMenucard(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('menucards')
      .update({ active: false })
      .eq('id', id)

    if (error) throw new MenuRepositoryError('Failed to delete menucard', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting menucard', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// MENUCARD CATEGORIES RELATIONSHIPS
// ================================================

export async function getMenucardCategories(menucardId: string): Promise<(Category & { sort_index: number })[]> {
  try {
    const { data, error } = await supabase
      .from('menucard_categories')
      .select(`
        sort_index,
        categories:category_id(*)
      `)
      .eq('menucard_id', menucardId)
      .eq('categories.active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch menucard categories', 'FETCH_ERROR', error)
    
    // Transform the data structure
    return (data || []).map(item => ({
      ...item.categories,
      sort_index: item.sort_index
    }))
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching menucard categories', 'UNKNOWN_ERROR', error)
  }
}

export async function addCategoryToMenucard(menucardId: string, categoryId: string): Promise<MenucardCategory> {
  try {
    // Get the next sort index
    const { data: existing, error: countError } = await supabase
      .from('menucard_categories')
      .select('sort_index')
      .eq('menucard_id', menucardId)
      .order('sort_index', { ascending: false })
      .limit(1)

    if (countError) throw new MenuRepositoryError('Failed to get sort index', 'FETCH_ERROR', countError)

    const nextSortIndex = existing && existing.length > 0 ? existing[0].sort_index + 1 : 0

    const { data, error } = await supabase
      .from('menucard_categories')
      .insert({
        menucard_id: menucardId,
        category_id: categoryId,
        sort_index: nextSortIndex
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to add category to menucard', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error adding category to menucard', 'UNKNOWN_ERROR', error)
  }
}

export async function removeCategoryFromMenucard(menucardId: string, categoryId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('menucard_categories')
      .delete()
      .eq('menucard_id', menucardId)
      .eq('category_id', categoryId)

    if (error) throw new MenuRepositoryError('Failed to remove category from menucard', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error removing category from menucard', 'UNKNOWN_ERROR', error)
  }
}

export async function getAvailableCategories(menucardId: string): Promise<Category[]> {
  try {
    // Get all categories that are NOT in this menucard
    const { data: assignedCategories, error: assignedError } = await supabase
      .from('menucard_categories')
      .select('category_id')
      .eq('menucard_id', menucardId)

    if (assignedError) throw new MenuRepositoryError('Failed to fetch assigned categories', 'FETCH_ERROR', assignedError)

    const assignedCategoryIds = (assignedCategories || []).map(c => c.category_id)

    const query = supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name')

    if (assignedCategoryIds.length > 0) {
      query.not('id', 'in', `(${assignedCategoryIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) throw new MenuRepositoryError('Failed to fetch available categories', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching available categories', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// BULK OPERATIONS
// ================================================

export async function bulkAddCategoriesToMenucard(
  menucardId: string, 
  categoryIds: string[]
): Promise<MenucardCategory[]> {
  try {
    // Get the current max sort index
    const { data: existing, error: countError } = await supabase
      .from('menucard_categories')
      .select('sort_index')
      .eq('menucard_id', menucardId)
      .order('sort_index', { ascending: false })
      .limit(1)

    if (countError) throw new MenuRepositoryError('Failed to get sort index', 'FETCH_ERROR', countError)

    const startSortIndex = existing && existing.length > 0 ? existing[0].sort_index + 1 : 0

    const inserts = categoryIds.map((categoryId, index) => ({
      menucard_id: menucardId,
      category_id: categoryId,
      sort_index: startSortIndex + index
    }))

    const { data, error } = await supabase
      .from('menucard_categories')
      .insert(inserts)
      .select()

    if (error) throw new MenuRepositoryError('Failed to bulk add categories to menucard', 'BULK_CREATE_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error bulk adding categories to menucard', 'UNKNOWN_ERROR', error)
  }
}

export async function bulkRemoveCategoriesFromMenucard(
  menucardId: string, 
  categoryIds: string[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('menucard_categories')
      .delete()
      .eq('menucard_id', menucardId)
      .in('category_id', categoryIds)

    if (error) throw new MenuRepositoryError('Failed to bulk remove categories from menucard', 'BULK_DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error bulk removing categories from menucard', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// MENUCARD WITH CATEGORIES
// ================================================

export interface MenucardWithCategories extends Menucard {
  categories: (Category & { sort_index: number })[]
}

export async function getMenucardsWithCategories(): Promise<MenucardWithCategories[]> {
  try {
    const menucards = await getMenucards()
    
    const menucardsWithCategories: MenucardWithCategories[] = []
    
    for (const menucard of menucards) {
      const categories = await getMenucardCategories(menucard.id)
      menucardsWithCategories.push({
        ...menucard,
        categories
      })
    }

    return menucardsWithCategories
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching menucards with categories', 'UNKNOWN_ERROR', error)
  }
}

export async function getMenucardWithCategories(id: string): Promise<MenucardWithCategories | null> {
  try {
    const menucard = await getMenucard(id)
    if (!menucard) return null

    const categories = await getMenucardCategories(id)
    
    return {
      ...menucard,
      categories
    }
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching menucard with categories', 'UNKNOWN_ERROR', error)
  }
}
