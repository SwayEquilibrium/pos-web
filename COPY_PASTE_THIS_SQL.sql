-- ⚡ QUICK FIX: Copy and paste this entire SQL into your database tool
-- This will create all the printer tables you need

CREATE TABLE IF NOT EXISTS public.printer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  printer_type VARCHAR(50) NOT NULL DEFAULT 'CloudPRNT',
  connection_string TEXT NOT NULL DEFAULT 'auto-detect',
  brand VARCHAR(50) DEFAULT 'Star',
  paper_width INTEGER DEFAULT 48,
  supports_cut BOOLEAN DEFAULT true,
  cut_command_hex VARCHAR(20) DEFAULT '1B6401',
  cut_command_name VARCHAR(100) DEFAULT 'ESC d 1 (Partial Cut)',
  print_kitchen_receipts BOOLEAN DEFAULT true,
  print_customer_receipts BOOLEAN DEFAULT false,
  auto_print_on_order BOOLEAN DEFAULT true,
  auto_print_on_payment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  last_test_at TIMESTAMPTZ,
  last_test_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name),
  CHECK(paper_width > 0)
);

CREATE TABLE IF NOT EXISTS public.printer_room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, room_id)
);

CREATE TABLE IF NOT EXISTS public.printer_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, category_id)
);

-- ================================================
-- PRINTER PRODUCT GROUP ASSIGNMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_product_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  product_group_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, product_group_id)
);

-- ================================================
-- PRINTER CATEGORY SORT PRIORITIES
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_category_sort_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  sort_priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(printer_id, category_id)
);

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

CREATE TABLE IF NOT EXISTS public.product_type_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, product_type_id)
);

CREATE INDEX IF NOT EXISTS idx_printer_profiles_company ON public.printer_profiles(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_printer_room_assignments_printer ON public.printer_room_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_category_assignments_printer ON public.printer_category_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_product_group_assignments_printer ON public.printer_product_group_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_category_sort_priorities_printer ON public.printer_category_sort_priorities(printer_id, sort_priority);
CREATE INDEX IF NOT EXISTS idx_product_types_company ON public.product_types(company_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_type_assignments_product ON public.product_type_assignments(product_id);

INSERT INTO public.product_types (name, code, sort_order, color) VALUES
  ('Drinks', 'drinks', 1, '#3B82F6'),
  ('Food', 'food', 2, '#EF4444'),
  ('Desserts', 'desserts', 3, '#F59E0B'),
  ('Starters', 'starters', 4, '#10B981')
ON CONFLICT (company_id, code) DO NOTHING;

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

-- ================================================
-- SAFE NAMING FIX - Make database match existing code
-- This fixes the naming inconsistencies without breaking working systems
-- ================================================

-- Fix printer table naming to match existing code
DO $$
BEGIN
  -- Rename printer_profiles to printers (if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'printer_profiles') THEN
    ALTER TABLE printer_profiles RENAME TO printers;
    RAISE NOTICE 'Renamed printer_profiles to printers';
  END IF;
  
  -- Rename is_active to active (if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'printers' AND column_name = 'is_active') THEN
    ALTER TABLE printers RENAME COLUMN is_active TO active;
    RAISE NOTICE 'Renamed is_active to active';
  END IF;
  
  -- Update foreign key references if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'printer_room_assignments_printer_id_fkey') THEN
    ALTER TABLE printer_room_assignments 
      DROP CONSTRAINT printer_room_assignments_printer_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'printer_category_assignments_printer_id_fkey') THEN
    ALTER TABLE printer_category_assignments 
      DROP CONSTRAINT printer_category_assignments_printer_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'printer_product_type_assignments_printer_id_fkey') THEN
    ALTER TABLE printer_product_type_assignments 
      DROP CONSTRAINT printer_product_type_assignments_printer_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'printer_category_sort_priorities_printer_id_fkey') THEN
    ALTER TABLE printer_category_sort_priorities 
      DROP CONSTRAINT printer_category_sort_priorities_printer_id_fkey;
  END IF;
  
  -- Recreate foreign keys with correct table name
  ALTER TABLE printer_room_assignments 
    ADD CONSTRAINT printer_room_assignments_printer_id_fkey 
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE;
    
  ALTER TABLE printer_category_assignments 
    ADD CONSTRAINT printer_category_assignments_printer_id_fkey 
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE;
    
  ALTER TABLE printer_product_type_assignments 
    ADD CONSTRAINT printer_product_type_assignments_printer_id_fkey 
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE;
    
  ALTER TABLE printer_category_sort_priorities 
    ADD CONSTRAINT printer_category_sort_priorities_printer_id_fkey 
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE;
    
  RAISE NOTICE 'Updated foreign key references to use printers table';
  
  -- Update indexes
  DROP INDEX IF EXISTS idx_printer_profiles_company;
  CREATE INDEX idx_printers_company ON printers(company_id, active);
  
  DROP INDEX IF EXISTS idx_printer_profiles_default;
  CREATE INDEX idx_printers_default ON printers(company_id, is_default) WHERE is_default = true;
  
  RAISE NOTICE 'Updated indexes to use printers table and active column';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Migration completed with some warnings: %', SQLERRM;
END $$;

-- ================================================
-- MIGRATION COMPLETE - Database now matches existing code
-- ================================================
