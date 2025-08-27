// ================================================
// MODIFIERS REPOSITORY
// Modifier groups, modifiers, and product relationships
// ================================================

import { supabase } from '@/lib/supabaseClient'
import type { 
  ModifierGroup, 
  Modifier, 
  ProductModifierGroup,
  ModifierGroupWithModifiers,
  ModifierGroupFormData,
  ModifierFormData
} from '@/lib/types/menu'
import { MenuRepositoryError } from '@/lib/types/menu'

// ================================================
// MODIFIER GROUPS
// ================================================

export async function getModifierGroups(): Promise<ModifierGroup[]> {
  try {
    const { data, error } = await supabase
      .from('modifier_groups')
      .select('*')
      .eq('active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch modifier groups', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching modifier groups', 'UNKNOWN_ERROR', error)
  }
}

export async function getModifierGroup(id: string): Promise<ModifierGroup | null> {
  try {
    const { data, error } = await supabase
      .from('modifier_groups')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new MenuRepositoryError('Failed to fetch modifier group', 'FETCH_ERROR', error)
    }
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching modifier group', 'UNKNOWN_ERROR', error)
  }
}

export async function getModifierGroupsWithModifiers(): Promise<ModifierGroupWithModifiers[]> {
  try {
    const { data, error } = await supabase
      .from('modifier_groups')
      .select(`
        *,
        modifiers:modifiers(*)
      `)
      .eq('active', true)
      .eq('modifiers.active', true)
      .order('sort_index')
      .order('sort_index', { foreignTable: 'modifiers' })

    if (error) throw new MenuRepositoryError('Failed to fetch modifier groups with modifiers', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching modifier groups with modifiers', 'UNKNOWN_ERROR', error)
  }
}

export async function createModifierGroup(groupData: ModifierGroupFormData): Promise<ModifierGroup> {
  try {
    const { data, error } = await supabase
      .from('modifier_groups')
      .insert({
        name: groupData.name,
        description: groupData.description,
        min_select: groupData.min_select || 0,
        max_select: groupData.max_select || 0,
        sort_index: 0,
        active: true
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to create modifier group', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error creating modifier group', 'UNKNOWN_ERROR', error)
  }
}

export async function updateModifierGroup(id: string, updates: Partial<ModifierGroupFormData>): Promise<ModifierGroup> {
  try {
    const { data, error } = await supabase
      .from('modifier_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to update modifier group', 'UPDATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error updating modifier group', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteModifierGroup(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('modifier_groups')
      .update({ active: false })
      .eq('id', id)

    if (error) throw new MenuRepositoryError('Failed to delete modifier group', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting modifier group', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// MODIFIERS
// ================================================

export async function getModifiersByGroup(groupId: string): Promise<Modifier[]> {
  try {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .eq('group_id', groupId)
      .eq('active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch modifiers by group', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching modifiers by group', 'UNKNOWN_ERROR', error)
  }
}

export async function getModifier(id: string): Promise<Modifier | null> {
  try {
    const { data, error } = await supabase
      .from('modifiers')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw new MenuRepositoryError('Failed to fetch modifier', 'FETCH_ERROR', error)
    }
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching modifier', 'UNKNOWN_ERROR', error)
  }
}

export async function createModifier(modifierData: ModifierFormData & { group_id: string }): Promise<Modifier> {
  try {
    const { data, error } = await supabase
      .from('modifiers')
      .insert({
        group_id: modifierData.group_id,
        name: modifierData.name,
        description: modifierData.description,
        kind: modifierData.kind || 'add',
        price_delta: modifierData.price_delta || 0,
        sort_index: 0,
        active: true
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to create modifier', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error creating modifier', 'UNKNOWN_ERROR', error)
  }
}

export async function updateModifier(id: string, updates: Partial<ModifierFormData>): Promise<Modifier> {
  try {
    const { data, error } = await supabase
      .from('modifiers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to update modifier', 'UPDATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error updating modifier', 'UNKNOWN_ERROR', error)
  }
}

export async function deleteModifier(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('modifiers')
      .update({ active: false })
      .eq('id', id)

    if (error) throw new MenuRepositoryError('Failed to delete modifier', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error deleting modifier', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// PRODUCT MODIFIER GROUPS RELATIONSHIPS
// ================================================

export async function getProductModifierGroups(productId: string): Promise<(ModifierGroup & { is_required: boolean; sort_index: number })[]> {
  try {
    const { data, error } = await supabase
      .from('product_modifier_groups')
      .select(`
        sort_index,
        is_required,
        modifier_groups:group_id(*)
      `)
      .eq('product_id', productId)
      .eq('modifier_groups.active', true)
      .order('sort_index')

    if (error) throw new MenuRepositoryError('Failed to fetch product modifier groups', 'FETCH_ERROR', error)
    
    // Transform the data structure
    return (data || []).map(item => ({
      ...item.modifier_groups,
      is_required: item.is_required,
      sort_index: item.sort_index
    }))
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching product modifier groups', 'UNKNOWN_ERROR', error)
  }
}

export async function attachGroupToProduct(productId: string, groupId: string, isRequired: boolean = false): Promise<ProductModifierGroup> {
  try {
    // Get the next sort index
    const { data: existing, error: countError } = await supabase
      .from('product_modifier_groups')
      .select('sort_index')
      .eq('product_id', productId)
      .order('sort_index', { ascending: false })
      .limit(1)

    if (countError) throw new MenuRepositoryError('Failed to get sort index', 'FETCH_ERROR', countError)

    const nextSortIndex = existing && existing.length > 0 ? existing[0].sort_index + 1 : 0

    const { data, error } = await supabase
      .from('product_modifier_groups')
      .insert({
        product_id: productId,
        group_id: groupId,
        is_required: isRequired,
        sort_index: nextSortIndex
      })
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to attach group to product', 'CREATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error attaching group to product', 'UNKNOWN_ERROR', error)
  }
}

export async function detachGroupFromProduct(productId: string, groupId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('product_modifier_groups')
      .delete()
      .eq('product_id', productId)
      .eq('group_id', groupId)

    if (error) throw new MenuRepositoryError('Failed to detach group from product', 'DELETE_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error detaching group from product', 'UNKNOWN_ERROR', error)
  }
}

export async function updateProductModifierGroup(
  productId: string, 
  groupId: string, 
  updates: { is_required?: boolean; sort_index?: number }
): Promise<ProductModifierGroup> {
  try {
    const { data, error } = await supabase
      .from('product_modifier_groups')
      .update(updates)
      .eq('product_id', productId)
      .eq('group_id', groupId)
      .select()
      .single()

    if (error) throw new MenuRepositoryError('Failed to update product modifier group', 'UPDATE_ERROR', error)
    return data
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error updating product modifier group', 'UNKNOWN_ERROR', error)
  }
}

export async function getAvailableModifierGroups(productId: string): Promise<ModifierGroup[]> {
  try {
    // Get all modifier groups that are NOT attached to this product
    const { data: attachedGroups, error: attachedError } = await supabase
      .from('product_modifier_groups')
      .select('group_id')
      .eq('product_id', productId)

    if (attachedError) throw new MenuRepositoryError('Failed to fetch attached groups', 'FETCH_ERROR', attachedError)

    const attachedGroupIds = (attachedGroups || []).map(g => g.group_id)

    const query = supabase
      .from('modifier_groups')
      .select('*')
      .eq('active', true)
      .order('name')

    if (attachedGroupIds.length > 0) {
      query.not('id', 'in', `(${attachedGroupIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) throw new MenuRepositoryError('Failed to fetch available modifier groups', 'FETCH_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error fetching available modifier groups', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// BULK OPERATIONS
// ================================================

export async function bulkCreateModifiers(modifiers: Array<ModifierFormData & { group_id: string }>): Promise<Modifier[]> {
  try {
    const { data, error } = await supabase
      .from('modifiers')
      .insert(modifiers.map((modifier, index) => ({
        group_id: modifier.group_id,
        name: modifier.name,
        description: modifier.description,
        kind: modifier.kind || 'add',
        price_delta: modifier.price_delta || 0,
        sort_index: index,
        active: true
      })))
      .select()

    if (error) throw new MenuRepositoryError('Failed to bulk create modifiers', 'BULK_CREATE_ERROR', error)
    return data || []
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error bulk creating modifiers', 'UNKNOWN_ERROR', error)
  }
}
