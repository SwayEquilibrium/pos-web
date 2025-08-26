// Shared menu data for both menu editor and order system
// This will eventually be replaced with real database calls

export interface Category {
  id: string
  name: string
  description?: string
  parent_id: string | null
  products_count: number
  subcategories_count: number
  sort_index: number
  color?: string
  emoji?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  is_available: boolean
  is_open_price?: boolean
  modifiers_count?: number
  color?: string
  emoji?: string
  image_url?: string
}

// Mock data - this should eventually come from your database
export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Forretter',
    description: 'Lækre forretter til at starte måltidet',
    parent_id: null,
    products_count: 8,
    subcategories_count: 0,
    sort_index: 1,
    emoji: '🥗'
  },
  {
    id: '2',
    name: 'Hovedretter',
    description: 'Vores hovedretter',
    parent_id: null,
    products_count: 0,
    subcategories_count: 3,
    sort_index: 2,
    emoji: '🍽️'
  },
  {
    id: '3',
    name: 'Kød',
    description: 'Kødretter',
    parent_id: '2',
    products_count: 12,
    subcategories_count: 0,
    sort_index: 1,
    emoji: '🥩'
  },
  {
    id: '4',
    name: 'Fisk',
    description: 'Fiskeretter',
    parent_id: '2',
    products_count: 8,
    subcategories_count: 0,
    sort_index: 2,
    emoji: '🐟'
  },
  {
    id: '5',
    name: 'Vegetar',
    description: 'Vegetariske retter',
    parent_id: '2',
    products_count: 6,
    subcategories_count: 0,
    sort_index: 3,
    emoji: '🥬'
  },
  {
    id: '6',
    name: 'Desserter',
    description: 'Søde afslutninger',
    parent_id: null,
    products_count: 5,
    subcategories_count: 0,
    sort_index: 3,
    emoji: '🍰'
  },
  {
    id: '7',
    name: 'Drikkevarer',
    description: 'Kolde og varme drikkevarer',
    parent_id: null,
    products_count: 10,
    subcategories_count: 0,
    sort_index: 4,
    emoji: '🥤'
  }
]

export const mockProducts: Product[] = [
  // Forretter
  {
    id: '1',
    name: 'Caesar Salat',
    description: 'Frisk salat med parmesan og croutons',
    price: 89,
    category_id: '1',
    is_available: true,
    modifiers_count: 2,
    emoji: '🥗'
  },
  {
    id: '2',
    name: 'Bruschetta',
    description: 'Italiensk brød med tomater og basilikum',
    price: 75,
    category_id: '1',
    is_available: true,
    modifiers_count: 1,
    emoji: '🍞'
  },
  {
    id: '3',
    name: 'Rejer i hvidløg',
    description: 'Stegte rejer med hvidløg og chili',
    price: 125,
    category_id: '1',
    is_available: true,
    modifiers_count: 2,
    emoji: '🦐'
  },
  
  // Kød (under Hovedretter)
  {
    id: '4',
    name: 'Bøf med løg',
    description: 'Saftig bøf med stegte løg og kartofler',
    price: 185,
    category_id: '3',
    is_available: true,
    modifiers_count: 3,
    emoji: '🥩'
  },
  {
    id: '5',
    name: 'Schnitzel',
    description: 'Klassisk schnitzel med pommes frites',
    price: 165,
    category_id: '3',
    is_available: true,
    modifiers_count: 2,
    emoji: '🍖'
  },
  {
    id: '6',
    name: 'Kylling gratin',
    description: 'Kylling i ovn med ost og grøntsager',
    price: 155,
    category_id: '3',
    is_available: true,
    modifiers_count: 2,
    emoji: '🍗'
  },
  
  // Fisk (under Hovedretter)
  {
    id: '7',
    name: 'Grillet laks',
    description: 'Frisk laks med grøntsager og kartofler',
    price: 165,
    category_id: '4',
    is_available: true,
    modifiers_count: 2,
    emoji: '🐟'
  },
  {
    id: '8',
    name: 'Torsk med dild',
    description: 'Dampet torsk med dildsauce',
    price: 145,
    category_id: '4',
    is_available: true,
    modifiers_count: 1,
    emoji: '🐠'
  },
  
  // Vegetar (under Hovedretter)
  {
    id: '9',
    name: 'Pasta Primavera',
    description: 'Pasta med sæsongrøntsager',
    price: 135,
    category_id: '5',
    is_available: true,
    modifiers_count: 2,
    emoji: '🍝'
  },
  {
    id: '10',
    name: 'Vegetar burger',
    description: 'Hjemmelavet vegetar burger med pommes',
    price: 125,
    category_id: '5',
    is_available: true,
    modifiers_count: 3,
    emoji: '🍔'
  },
  
  // Desserter
  {
    id: '11',
    name: 'Tiramisu',
    description: 'Klassisk italiensk dessert',
    price: 65,
    category_id: '6',
    is_available: true,
    modifiers_count: 0,
    emoji: '🍰'
  },
  {
    id: '12',
    name: 'Is med bær',
    description: 'Vanilje is med friske bær',
    price: 55,
    category_id: '6',
    is_available: true,
    modifiers_count: 1,
    emoji: '🍨'
  },
  
  // Drikkevarer
  {
    id: '13',
    name: 'Øl',
    description: 'Pilsner 50cl',
    price: 45,
    category_id: '7',
    is_available: true,
    modifiers_count: 0,
    emoji: '🍺'
  },
  {
    id: '14',
    name: 'Rødvin',
    description: 'Glas rødvin',
    price: 65,
    category_id: '7',
    is_available: true,
    modifiers_count: 0,
    emoji: '🍷'
  },
  {
    id: '15',
    name: 'Kaffe',
    description: 'Espresso eller americano',
    price: 35,
    category_id: '7',
    is_available: true,
    modifiers_count: 1,
    emoji: '☕'
  }
]

// Helper functions
export const getRootCategories = () => {
  return mockCategories.filter(cat => cat.parent_id === null)
}

export const getSubcategories = (parentId: string) => {
  return mockCategories.filter(cat => cat.parent_id === parentId)
}

export const getProductsByCategory = (categoryId: string) => {
  return mockProducts.filter(prod => prod.category_id === categoryId && prod.is_available)
}

export const getAllAvailableProducts = () => {
  return mockProducts.filter(prod => prod.is_available)
}

export const getCategoryById = (categoryId: string) => {
  return mockCategories.find(cat => cat.id === categoryId)
}

export const getProductById = (productId: string) => {
  return mockProducts.find(prod => prod.id === productId)
}

// Get all categories that have products (for display in order system)
export const getCategoriesWithProducts = () => {
  const categoriesWithProducts = new Set<string>()
  
  // Add categories that have products
  mockProducts.forEach(product => {
    if (product.is_available) {
      categoriesWithProducts.add(product.category_id)
    }
  })
  
  // Return categories that have products, including parent categories
  return mockCategories.filter(category => {
    // Include if category has products directly
    if (categoriesWithProducts.has(category.id)) {
      return true
    }
    
    // Include if category has subcategories with products
    const subcategories = getSubcategories(category.id)
    return subcategories.some(subcat => categoriesWithProducts.has(subcat.id))
  })
}
