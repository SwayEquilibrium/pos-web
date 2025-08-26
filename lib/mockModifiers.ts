// Mock modifier data to work with the shared menu system
// This simulates the modifier system until we connect to the real database

export interface MockModifierGroup {
  id: string
  name: string
  description?: string
  type: 'variant' | 'addon'
  is_required: boolean
  sort_index: number
}

export interface MockModifier {
  id: string
  group_id: string
  name: string
  price_adjustment: number
  is_default: boolean
  sort_index: number
}

export interface MockProductModifier {
  group_id: string
  group_name: string
  group_type: 'variant' | 'addon'
  group_required: boolean
  modifier_id: string
  modifier_name: string
  modifier_price: number
  modifier_sort: number
}

// Mock modifier groups
export const mockModifierGroups: MockModifierGroup[] = [
  {
    id: 'size-group',
    name: 'Størrelse',
    description: 'Vælg størrelse',
    type: 'variant',
    is_required: true,
    sort_index: 1
  },
  {
    id: 'sauce-group',
    name: 'Sovser',
    description: 'Vælg sovser',
    type: 'addon',
    is_required: false,
    sort_index: 2
  },
  {
    id: 'extras-group',
    name: 'Tilbehør',
    description: 'Extra tilbehør',
    type: 'addon',
    is_required: false,
    sort_index: 3
  }
]

// Mock modifiers
export const mockModifiers: MockModifier[] = [
  // Size variants
  {
    id: 'size-normal',
    group_id: 'size-group',
    name: 'Normal',
    price_adjustment: 0,
    is_default: true,
    sort_index: 1
  },
  {
    id: 'size-large',
    group_id: 'size-group',
    name: 'Stor (+50g)',
    price_adjustment: 25,
    is_default: false,
    sort_index: 2
  },
  {
    id: 'size-xl',
    group_id: 'size-group',
    name: 'XL (+100g)',
    price_adjustment: 45,
    is_default: false,
    sort_index: 3
  },
  
  // Sauces
  {
    id: 'sauce-ketchup',
    group_id: 'sauce-group',
    name: 'Ketchup',
    price_adjustment: 0,
    is_default: true,
    sort_index: 1
  },
  {
    id: 'sauce-mayo',
    group_id: 'sauce-group',
    name: 'Mayo',
    price_adjustment: 0,
    is_default: false,
    sort_index: 2
  },
  {
    id: 'sauce-bbq',
    group_id: 'sauce-group',
    name: 'BBQ Sauce',
    price_adjustment: 3,
    is_default: false,
    sort_index: 3
  },
  {
    id: 'sauce-bearnaise',
    group_id: 'sauce-group',
    name: 'Bearnaise',
    price_adjustment: 15,
    is_default: false,
    sort_index: 4
  },
  
  // Extras
  {
    id: 'extra-onions',
    group_id: 'extras-group',
    name: 'Extra løg',
    price_adjustment: 10,
    is_default: false,
    sort_index: 1
  },
  {
    id: 'extra-fries',
    group_id: 'extras-group',
    name: 'Pommes frites',
    price_adjustment: 20,
    is_default: false,
    sort_index: 2
  },
  {
    id: 'extra-salad',
    group_id: 'extras-group',
    name: 'Salat',
    price_adjustment: 12,
    is_default: false,
    sort_index: 3
  }
]

// Mock product-modifier associations
export const mockProductModifierAssociations: Record<string, string[]> = {
  // Bøf med løg (product id '4' in menuData.ts)
  '4': ['size-group', 'sauce-group', 'extras-group'],
  
  // Schnitzel (product id '5')
  '5': ['size-group', 'sauce-group'],
  
  // Vegetar burger (product id '10')
  '10': ['size-group', 'sauce-group', 'extras-group'],
  
  // Caesar Salat (product id '1')
  '1': ['sauce-group', 'extras-group'],
  
  // Kaffe (product id '15')
  '15': ['size-group']
}

// Helper function to get modifiers for a product (mimics the database function)
export const getMockProductModifiers = (productId: string): MockProductModifier[] => {
  const groupIds = mockProductModifierAssociations[productId] || []
  const result: MockProductModifier[] = []
  
  groupIds.forEach(groupId => {
    const group = mockModifierGroups.find(g => g.id === groupId)
    const modifiers = mockModifiers.filter(m => m.group_id === groupId)
    
    if (group) {
      modifiers.forEach(modifier => {
        result.push({
          group_id: group.id,
          group_name: group.name,
          group_type: group.type,
          group_required: group.is_required,
          modifier_id: modifier.id,
          modifier_name: modifier.name,
          modifier_price: modifier.price_adjustment,
          modifier_sort: modifier.sort_index
        })
      })
    }
  })
  
  return result
}

// Helper function to check if a product has modifiers
export const productHasModifiers = (productId: string): boolean => {
  return (mockProductModifierAssociations[productId] || []).length > 0
}
