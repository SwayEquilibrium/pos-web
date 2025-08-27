-- ⚡ ADDITIONAL PRINTER FEATURES MIGRATION
-- Run this AFTER the main printer migration to add product groups and category sorting

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

-- ================================================
-- ADDITIONAL INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_printer_product_group_assignments_printer ON public.printer_product_group_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_product_group_assignments_group ON public.printer_product_group_assignments(product_group_id);
CREATE INDEX IF NOT EXISTS idx_printer_category_sort_priorities_printer ON public.printer_category_sort_priorities(printer_id, sort_priority);
CREATE INDEX IF NOT EXISTS idx_printer_category_sort_priorities_category ON public.printer_category_sort_priorities(category_id);
