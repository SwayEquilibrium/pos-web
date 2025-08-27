# 🖨️ Printer System Database Setup

## ❌ Error You're Seeing:
```
Failed to save printer: Error: Failed to create printer: Could not find the table 'public.printer_profiles' in the schema cache
```

## ✅ Solution: Run This SQL

**You need to run the SQL migration to create the printer tables.**

### Option 1: Copy & Paste SQL (Recommended)

1. **Open your database management tool** (pgAdmin, DBeaver, Supabase dashboard, etc.)
2. **Connect to your `pos_web` database**
3. **Copy and paste this entire SQL script:**

```sql
-- Simple Printer Setup v1.0
-- Basic printer tables without complex functions

-- ================================================
-- PRINTER PROFILES (Simplified)
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  
  -- Basic printer info
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  printer_type VARCHAR(50) NOT NULL DEFAULT 'CloudPRNT',
  connection_string TEXT NOT NULL DEFAULT 'auto-detect',
  
  -- Enhanced printer fields
  brand VARCHAR(50) DEFAULT 'Star',
  paper_width INTEGER DEFAULT 48,
  supports_cut BOOLEAN DEFAULT true,
  cut_command_hex VARCHAR(20) DEFAULT '1B6401',
  cut_command_name VARCHAR(100) DEFAULT 'ESC d 1 (Partial Cut)',
  
  -- Printing behavior
  print_kitchen_receipts BOOLEAN DEFAULT true,
  print_customer_receipts BOOLEAN DEFAULT false,
  auto_print_on_order BOOLEAN DEFAULT true,
  auto_print_on_payment BOOLEAN DEFAULT false,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_test_at TIMESTAMPTZ,
  last_test_result TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, name),
  CHECK(paper_width > 0)
);

-- ================================================
-- PRINTER ROOM ASSIGNMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, room_id)
);

-- ================================================
-- PRINTER CATEGORY ASSIGNMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, category_id)
);

-- ================================================
-- PRODUCT TYPES (Simplified)
-- ================================================
CREATE TABLE IF NOT EXISTS public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, code),
  UNIQUE(company_id, name)
);

-- ================================================
-- PRODUCT TYPE ASSIGNMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.product_type_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, product_type_id)
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_printer_profiles_company ON public.printer_profiles(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_printer_room_assignments_printer ON public.printer_room_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_category_assignments_printer ON public.printer_category_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_product_types_company ON public.product_types(company_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_type_assignments_product ON public.product_type_assignments(product_id);

-- ================================================
-- SAMPLE DATA
-- ================================================

-- Insert default product types
INSERT INTO public.product_types (name, code, sort_order, color) VALUES
  ('Drinks', 'drinks', 1, '#3B82F6'),
  ('Food', 'food', 2, '#EF4444'),
  ('Desserts', 'desserts', 3, '#F59E0B'),
  ('Starters', 'starters', 4, '#10B981')
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert your working TSP100 printer
INSERT INTO public.printer_profiles (
  name, 
  display_name, 
  printer_type, 
  connection_string,
  brand,
  paper_width,
  cut_command_hex,
  cut_command_name,
  print_kitchen_receipts,
  print_customer_receipts,
  is_default
) VALUES (
  'tsp100-kitchen',
  'Kitchen Printer (TSP100)',
  'CloudPRNT',
  '192.168.8.197',
  'Star',
  48,
  '1B6401',
  'ESC d 1 (Partial Cut - WORKING)',
  true,
  false,
  true
) ON CONFLICT (company_id, name) DO UPDATE SET
  cut_command_hex = '1B6401',
  cut_command_name = 'ESC d 1 (Partial Cut - WORKING)',
  updated_at = NOW();
```

4. **Execute the SQL script**
5. **Refresh your app** and try the printer settings again

### Option 2: Supabase Dashboard

If you're using Supabase:

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** 
3. Paste the SQL above
4. Click **Run**

### Option 3: Command Line (if you find psql)

If you can find your PostgreSQL installation:

```bash
# Find psql first
where psql
# or
Get-Command psql -ErrorAction SilentlyContinue

# Then run:
psql -h localhost -U postgres -d pos_web -f proposals/migrations/013_simple_printer_setup.sql
```

## 🎯 After Running the Migration

You should be able to:

1. ✅ **Add printers** in `/modules` → System → Printers
2. ✅ **Configure your TSP100** with working cut commands  
3. ✅ **Assign rooms and categories** to printers
4. ✅ **Test print functionality** with the Test button
5. ✅ **Add product types** to your products

## 🔍 Verify It Worked

After running the SQL, you should see:
- **5 new tables** in your database
- **Your TSP100 printer** pre-configured 
- **4 default product types** (Drinks, Food, Desserts, Starters)

Let me know when you've run the migration and we can test the printer configuration! 🚀
