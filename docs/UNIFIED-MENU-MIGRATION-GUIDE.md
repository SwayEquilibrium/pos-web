# 🚀 **Unified Menu System Migration Guide**

## 📋 **Overview**

This guide will help you migrate from the old scattered menu system to the new unified menu system. The unified system provides:

- ✅ **Single source of truth** for all menu data
- ✅ **Centralized API endpoints** under `/api/menu/...`
- ✅ **Unified React hooks** for consistent data access
- ✅ **Proper database relationships** with foreign keys
- ✅ **Real-time synchronization** between Menu Management and Orders

## 🔄 **Migration Phases**

### **Phase 1: Database Setup** ⏱️ **30 minutes**

1. **Backup your existing data**
   ```bash
   # Export your current database
   pg_dump your_database > backup_before_migration.sql
   ```

2. **Run the migration script**
   ```bash
   # Connect to your database and run:
   psql your_database < database/unified-menu-system-migration.sql
   ```

3. **Verify the setup**
   ```sql
   -- Check that all tables were created
   SELECT tablename FROM pg_tables WHERE tablename LIKE '%menu%' OR tablename LIKE '%product%' OR tablename LIKE '%category%';
   
   -- Check default data
   SELECT * FROM tax_codes;
   SELECT * FROM product_groups;
   SELECT * FROM menucards;
   ```

### **Phase 2: API Testing** ⏱️ **15 minutes**

1. **Test the main menu endpoint**
   ```bash
   curl http://localhost:3000/api/menu
   ```

2. **Test categories endpoint**
   ```bash
   curl http://localhost:3000/api/menu?action=categories
   ```

3. **Test products endpoint**
   ```bash
   curl http://localhost:3000/api/menu?action=products
   ```

4. **Test modifiers endpoint**
   ```bash
   curl http://localhost:3000/api/menu?action=modifiers
   ```

### **Phase 3: Component Migration** ⏱️ **2-3 hours**

#### **3.1 Update Category Components**

**Before (old system):**
```tsx
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/menu/useCategories'
```

**After (unified system):**
```tsx
import { 
  useCategories, 
  useCreateUnifiedCategory, 
  useUpdateUnifiedCategory, 
  useDeleteUnifiedCategory 
} from '@/hooks/useMenu
```

**Components to update:**
- ✅ `components/SmartCategoryHierarchy.tsx` - **COMPLETED**
- ✅ `components/menu/CategoriesPanel.tsx` - **COMPLETED**
- ✅ `app/admin/settings/menu/page.tsx` - **COMPLETED**
- ✅ `app/menu/card/page.tsx` - **COMPLETED**
- ✅ `app/modules/menu/page.tsx` - **COMPLETED**
- ✅ `app/menu/[menuId]/page.tsx` - **COMPLETED**

#### **3.2 Update Product Components**

**Before (old system):**
```tsx
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/menu/useProducts'
```

**After (unified system):**
```tsx
import { 
  useProducts, 
  useCreateUnifiedProduct, 
  useUpdateUnifiedProduct, 
  useDeleteUnifiedProduct 
} from '@/hooks/useMenu
```

**Components to update:**
- ✅ `components/menu/ProductsPanel.tsx` - **COMPLETED**
- ✅ `components/menu/ProductEditor.tsx` - **COMPLETED**
- ✅ `components/menu/MenucardsPanel.tsx` - **COMPLETED**

#### **3.3 Update Order Components**

**Before (old system):**
```tsx
import { useCategories, useProductsByCategory, useProducts } from '@/hooks/useCatalog'
```

**After (unified system):**
```tsx
import { 
  useCategories, 
  useProductsByCategory, 
  useProducts 
} from '@/hooks/useMenu
```

**Components to update:**
- ✅ `app/orders/[tableId]/page.tsx` - **COMPLETED**

### **Phase 4: Data Migration** ⏱️ **1-2 hours**

#### **4.1 Migrate Existing Categories**

If you have existing categories, you'll need to migrate them:

```sql
-- Example: Migrate categories from old table to new unified table
INSERT INTO categories (id, name, description, parent_id, active, sort_index, created_at, updated_at)
SELECT 
  id, 
  name, 
  description, 
  parent_id, 
  COALESCE(active, true), 
  COALESCE(sort_index, 0),
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM your_old_categories_table
ON CONFLICT (id) DO NOTHING;
```

#### **4.2 Migrate Existing Products**

```sql
-- Example: Migrate products from old table to new unified table
INSERT INTO products (id, name, description, category_id, active, sort_index, created_at, updated_at)
SELECT 
  id, 
  name, 
  description, 
  category_id, 
  COALESCE(active, true), 
  COALESCE(sort_index, 0),
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM your_old_products_table
ON CONFLICT (id) DO NOTHING;
```

#### **4.3 Migrate Existing Pricing**

```sql
-- Example: Migrate product prices
INSERT INTO product_prices (product_id, context, price, tax_code_id, created_at, updated_at)
SELECT 
  product_id, 
  'dine_in' as context, 
  price, 
  tax_code_id,
  NOW(),
  NOW()
FROM your_old_pricing_table
ON CONFLICT (product_id, context) DO NOTHING;
```

### **Phase 5: Testing & Validation** ⏱️ **1 hour**

1. **Test category creation**
   - Go to Menu Management
   - Try creating a new category
   - Verify it appears in Orders

2. **Test product creation**
   - Create a new product in a category
   - Verify it appears in Orders
   - Test pricing and modifiers

3. **Test real-time updates**
   - Open Menu Management in one tab
   - Open Orders in another tab
   - Make changes in Menu Management
   - Verify they appear instantly in Orders

4. **Test API endpoints**
   - Use browser dev tools to verify API calls
   - Check that all CRUD operations work
   - Verify error handling

### **Phase 6: Cleanup** ⏱️ **30 minutes**

Once everything is working:

1. **Remove old repository files**
   ```bash
   # These can be deleted after successful migration
   rm lib/repos/catalog.repo.ts
   rm lib/repos/menucards.repo.ts
   rm lib/repos/modifiers.repo.ts
   rm lib/repos/pricing.repo.ts
   rm lib/repos/reorder.repo.ts
   ```

2. **Remove old hooks**
   ```bash
   # These can be deleted after successful migration
   rm -rf hooks/menu/
   rm hooks/useCatalog.ts
   ```

3. **Update imports**
   - Search for any remaining imports from old files
   - Replace with unified system imports

## 🧪 **Testing Checklist**

### **Category Management**
- [ ] Create new category
- [ ] Edit existing category
- [ ] Delete category
- [ ] Reorder categories
- [ ] Nested categories (parent/child)

### **Product Management**
- [ ] Create new product
- [ ] Edit existing product
- [ ] Delete product
- [ ] Assign to category
- [ ] Set pricing
- [ ] Add modifiers

### **Modifier Management**
- [ ] Create modifier group
- [ ] Add modifiers to group
- [ ] Assign to products
- [ ] Set pricing

### **Order System**
- [ ] Load categories from unified API
- [ ] Load products from unified API
- [ ] Real-time updates when menu changes
- [ ] Pricing consistency

### **API Endpoints**
- [ ] `/api/menu?action=categories` - CRUD operations
- [ ] `/api/menu?action=products` - CRUD operations
- [ ] `/api/menu?action=modifiers` - CRUD operations
- [ ] `/api/menu/pricing` - CRUD operations
- [ ] `/api/menu/menucards` - CRUD operations
- [ ] `/api/menu?action=categories/reorder` - Reordering
- [ ] `/api/menu?action=products/reorder` - Reordering

## 🚨 **Common Issues & Solutions**

### **Issue: "MenuRepositoryError is not defined"**
**Solution:** This error should be resolved after the migration. If it persists:
1. Check that all components are using unified hooks
2. Verify the old repository files are not being imported anywhere
3. Clear browser cache and restart dev server

### **Issue: Categories not appearing in Orders**
**Solution:** 
1. Check that Orders component is using `useCategories`
2. Verify API endpoints are working
3. Check browser console for errors

### **Issue: Products not loading**
**Solution:**
1. Verify database migration completed successfully
2. Check that products table has data
3. Test API endpoint directly: `/api/menu?action=products`

### **Issue: Real-time updates not working**
**Solution:**
1. Verify React Query invalidation is working
2. Check that components are using the same query keys
3. Ensure no caching issues

## 📊 **Performance Benefits**

After migration, you should see:

- **Faster page loads** - Single API calls instead of multiple
- **Better caching** - Unified React Query keys
- **Reduced bundle size** - No duplicate code
- **Easier debugging** - Single source of truth
- **Better maintainability** - Centralized logic

## 🔮 **Next Steps After Migration**

1. **Add new features** using the unified system
2. **Implement advanced filtering** and search
3. **Add bulk operations** for categories/products
4. **Implement menu templates** and cloning
5. **Add analytics** and reporting

## 📞 **Need Help?**

If you encounter issues during migration:

1. **Check the browser console** for error messages
2. **Verify API endpoints** are responding correctly
3. **Check database tables** have the expected structure
4. **Review component imports** are using unified hooks
5. **Clear browser cache** and restart the dev server

## 🎯 **Success Criteria**

Migration is complete when:

- ✅ All menu management functions work
- ✅ Orders load data from unified API
- ✅ Changes in Menu Management appear instantly in Orders
- ✅ No console errors related to menu data
- ✅ All CRUD operations work for categories, products, and modifiers
- ✅ Real-time updates work between components

---

**🎉 Congratulations!** You now have a unified, maintainable, and scalable menu system that will make future development much easier.
