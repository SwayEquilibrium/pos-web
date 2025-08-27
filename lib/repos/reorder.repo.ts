// ================================================
// REORDER REPOSITORY
// Handles reordering of entities using the database RPC function
// ================================================

import { supabase } from '@/lib/supabaseClient'
import type { ReorderParams, MenuRepositoryError } from '@/lib/types/menu'

// ================================================
// REORDER OPERATIONS
// ================================================

/**
 * Reorder entities using the database RPC function
 */
export async function reorderEntities(params: ReorderParams): Promise<void> {
  try {
    const { error } = await supabase.rpc('reorder_entities', {
      p_table: params.table,
      p_parent_id: params.parent_id || null,
      p_ids: params.ids,
      p_sort_start: params.sort_start || 0
    })

    if (error) throw new MenuRepositoryError('Failed to reorder entities', 'RPC_ERROR', error)
  } catch (error) {
    if (error instanceof MenuRepositoryError) throw error
    throw new MenuRepositoryError('Unexpected error reordering entities', 'UNKNOWN_ERROR', error)
  }
}

// ================================================
// SPECIFIC REORDER FUNCTIONS
// ================================================

export async function reorderCategories(categoryIds: string[]): Promise<void> {
  return reorderEntities({
    table: 'categories',
    ids: categoryIds
  })
}

export async function reorderProductGroups(productGroupIds: string[]): Promise<void> {
  return reorderEntities({
    table: 'product_groups',
    ids: productGroupIds
  })
}

export async function reorderProductModifierGroups(productId: string, modifierGroupIds: string[]): Promise<void> {
  return reorderEntities({
    table: 'product_modifier_groups',
    parent_id: productId,
    ids: modifierGroupIds
  })
}

export async function reorderMenucards(menucardIds: string[]): Promise<void> {
  return reorderEntities({
    table: 'menucards',
    ids: menucardIds
  })
}

export async function reorderMenucardCategories(menucardId: string, categoryIds: string[]): Promise<void> {
  return reorderEntities({
    table: 'menucard_categories',
    parent_id: menucardId,
    ids: categoryIds
  })
}

export async function reorderModifierGroups(modifierGroupIds: string[]): Promise<void> {
  return reorderEntities({
    table: 'modifier_groups',
    ids: modifierGroupIds
  })
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Move an item up in the sort order
 */
export async function moveItemUp<T extends { id: string; sort_index: number }>(
  items: T[],
  itemId: string,
  reorderFn: (ids: string[]) => Promise<void>
): Promise<void> {
  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex <= 0) return // Already at the top or not found

  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(currentIndex, 1)
  reorderedItems.splice(currentIndex - 1, 0, movedItem)

  const newOrder = reorderedItems.map(item => item.id)
  await reorderFn(newOrder)
}

/**
 * Move an item down in the sort order
 */
export async function moveItemDown<T extends { id: string; sort_index: number }>(
  items: T[],
  itemId: string,
  reorderFn: (ids: string[]) => Promise<void>
): Promise<void> {
  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex < 0 || currentIndex >= items.length - 1) return // Already at the bottom or not found

  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(currentIndex, 1)
  reorderedItems.splice(currentIndex + 1, 0, movedItem)

  const newOrder = reorderedItems.map(item => item.id)
  await reorderFn(newOrder)
}

/**
 * Move an item to a specific position
 */
export async function moveItemToPosition<T extends { id: string; sort_index: number }>(
  items: T[],
  itemId: string,
  newPosition: number,
  reorderFn: (ids: string[]) => Promise<void>
): Promise<void> {
  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex < 0) return // Item not found

  const clampedPosition = Math.max(0, Math.min(newPosition, items.length - 1))
  if (currentIndex === clampedPosition) return // Already in the right position

  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(currentIndex, 1)
  reorderedItems.splice(clampedPosition, 0, movedItem)

  const newOrder = reorderedItems.map(item => item.id)
  await reorderFn(newOrder)
}

// ================================================
// VALIDATION HELPERS
// ================================================

/**
 * Validate that all IDs exist in the items array
 */
export function validateReorderIds<T extends { id: string }>(items: T[], ids: string[]): boolean {
  const itemIds = new Set(items.map(item => item.id))
  return ids.every(id => itemIds.has(id)) && ids.length === items.length
}

/**
 * Generate a new order array from current items
 */
export function getCurrentOrder<T extends { id: string; sort_index: number }>(items: T[]): string[] {
  return [...items]
    .sort((a, b) => a.sort_index - b.sort_index)
    .map(item => item.id)
}

// ================================================
// BATCH REORDER OPERATIONS
// ================================================

/**
 * Reorder multiple entity types in a single transaction-like operation
 */
export async function batchReorder(operations: ReorderParams[]): Promise<void> {
  const errors: Error[] = []

  for (const operation of operations) {
    try {
      await reorderEntities(operation)
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)))
    }
  }

  if (errors.length > 0) {
    throw new MenuRepositoryError(
      `Batch reorder failed with ${errors.length} errors`,
      'BATCH_REORDER_ERROR',
      errors
    )
  }
}
