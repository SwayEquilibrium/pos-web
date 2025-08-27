# Menu Management System

A scalable, modular menu management system built with Next.js, Supabase, and React Query following the "repository + hooks + components" pattern.

## 🏗️ Architecture Overview

### Data Layer
- **Database**: Supabase PostgreSQL with proper relationships and constraints
- **Repositories**: Clean abstraction layer for all database operations
- **Types**: Comprehensive TypeScript types for type safety

### Application Layer  
- **Hooks**: React Query hooks for data fetching and state management
- **Components**: Reusable UI components with clear separation of concerns
- **Pages**: Route-level components that compose the application

### Key Features
- ✅ **Contextual Pricing**: Separate pricing for dine-in vs takeaway
- ✅ **Modifier System**: Flexible addon/variant system with sorting
- ✅ **Menucards**: Organize categories into different menu displays
- ✅ **Product Groups**: Group related products for better organization
- ✅ **Tax Management**: Configurable tax codes and calculations
- ✅ **Reordering**: Drag-and-drop style reordering with database persistence

## 📊 Database Schema

### Core Tables
```sql
-- Categories: Hierarchical menu organization
categories (id, parent_id, name, description, sort_index, active)

-- Products: Menu items
products (id, name, category_id, product_group_id, description, active)

-- Product Groups: Logical groupings (Hot Food, Cold Food, etc.)
product_groups (id, name, description, sort_index, active)

-- Contextual Pricing: Different prices for different contexts
product_prices (id, product_id, context, price, tax_code_id)
-- context: 'dine_in' | 'takeaway'

-- Tax Codes: VAT/tax configuration
tax_codes (id, name, rate)

-- Menucards: Menu display organization
menucards (id, name, description, sort_index, active)
menucard_categories (menucard_id, category_id, sort_index)

-- Modifier System: Add-ons and variants
modifier_groups (id, name, min_select, max_select, sort_index, active)
modifiers (id, group_id, name, kind, price_delta, sort_index, active)
product_modifier_groups (product_id, group_id, sort_index, is_required)
```

### Key Views
```sql
-- v_menu_editor_products: Complete product info with pricing
-- Includes: product details, category names, pricing for both contexts
```

### RPC Functions
```sql
-- upsert_product_with_prices(): Atomic product + pricing updates
-- reorder_entities(): Reorder any sortable entity type
```

## 🗂️ File Structure

```
lib/
├── types/menu.ts                 # Shared TypeScript types
└── repos/                       # Repository layer
    ├── catalog.repo.ts          # Categories, products, product groups
    ├── pricing.repo.ts          # Product prices, tax codes
    ├── modifiers.repo.ts        # Modifier groups and modifiers
    ├── menucards.repo.ts        # Menucards and relationships
    └── reorder.repo.ts          # Reordering operations

hooks/menu/                      # React Query hooks
├── useMenuToggles.ts           # Top-level navigation state
├── useCategories.ts            # Category operations
├── useProducts.ts              # Product operations
├── useProductGroups.ts         # Product group operations
├── useModifierGroups.ts        # Modifier operations
├── useMenucards.ts             # Menucard operations
└── useTaxCodes.ts              # Tax code operations

components/
├── common/
│   ├── Collapsible.tsx         # Collapsible sections
│   └── SortList.tsx            # Sortable list component
└── menu/
    ├── MenuTopToggle.tsx       # Top navigation tabs
    ├── ProductsPanel.tsx       # Product list and editor
    ├── ProductEditor.tsx       # Detailed product editor
    ├── CategoriesPanel.tsx     # Category management
    ├── MenucardsPanel.tsx      # Menucard management
    └── ProductGroupsPanel.tsx  # Product group management

app/modules/                     # Route structure
├── layout.tsx                  # Modules layout with sidebar
├── page.tsx                    # Dashboard
└── menu/
    └── page.tsx                # Main menu editor
```

## 🚀 Setup Instructions

### 1. Database Setup
```bash
# Run the migration in Supabase SQL Editor
supabase/migrations/2025-setup-menu-module.sql

# Populate with sample data (optional)
supabase/seed/menu-seed.sql
```

### 2. Environment Variables
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Access the System
Navigate to: `http://localhost:3000/modules/menu`

## 🎯 Usage Guide

### Product Management
1. **Navigate**: Go to `/modules/menu` and select "Products" tab
2. **Create**: Click "Create New Product" 
3. **Edit**: Click any product from the list
4. **Pricing**: Set different prices for dine-in and takeaway
5. **Modifiers**: Attach modifier groups and configure order

### Category Organization
1. **Navigate**: Select "Categories" tab
2. **Hierarchy**: Create parent/child category relationships
3. **Reorder**: Use up/down arrows to change sort order
4. **Assign**: Link categories to menucards for display

### Modifier System
1. **Groups**: Create modifier groups (e.g., "Size", "Extras")
2. **Modifiers**: Add individual options with price deltas
3. **Product Links**: Attach groups to products with required/optional settings
4. **Ordering**: Reorder groups to control display sequence

### Menucard Management  
1. **Create**: Define different menu displays (Main, Lunch, Beverages)
2. **Organize**: Add/remove categories from menucards
3. **Order**: Control category display order within menucards

## 🔧 Extending the System

### Adding New Price Contexts
1. Update the `PriceContext` type in `lib/types/menu.ts`
2. Add new context to database constraint in migration
3. Update pricing repository and hooks accordingly

### Adding New Entity Types
1. Define types in `lib/types/menu.ts`
2. Create repository functions in appropriate repo file
3. Create React Query hooks
4. Build UI components
5. Add to reorder system if sortable

### Custom Validation
Add validation logic in repository layer before database operations:
```typescript
export async function createProduct(data: ProductFormData): Promise<Product> {
  // Custom validation here
  if (!data.name.trim()) {
    throw new MenuRepositoryError('Product name is required', 'VALIDATION_ERROR')
  }
  
  // Database operation
  const { data: result, error } = await supabase...
}
```

## 🧪 Testing Path

1. **Setup**: Run migration and seed scripts
2. **Navigation**: Visit `/modules/menu`
3. **Products**: Create, edit, and price products
4. **Modifiers**: Create groups, add modifiers, attach to products
5. **Reordering**: Test sort functionality across all entity types
6. **Categories**: Create hierarchy and assign to menucards
7. **Menucards**: Create different menu displays

## 📈 Performance Considerations

- **Caching**: React Query provides intelligent caching with configurable stale times
- **Optimistic Updates**: Reordering uses optimistic updates for better UX
- **Database Indexes**: All foreign keys and sort columns are indexed
- **Pagination**: Consider adding pagination for large datasets
- **Lazy Loading**: Components load data only when needed

## 🔒 Security Notes

- **RLS**: Row Level Security is enabled on all tables
- **Validation**: All user input is validated at repository level
- **Type Safety**: Comprehensive TypeScript coverage prevents runtime errors
- **Error Handling**: Graceful error handling with user-friendly messages

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase URL and API key
- Check if migration script ran successfully
- Ensure RLS policies allow operations

### Component Not Loading
- Check browser console for errors
- Verify all required props are passed
- Ensure hooks are used within Query Client provider

### Data Not Updating
- Check if mutations are invalidating correct query keys
- Verify repository functions are throwing errors properly
- Look for TypeScript type mismatches

---

This system provides a solid foundation for menu management that can scale with your restaurant's needs while maintaining clean, maintainable code.
