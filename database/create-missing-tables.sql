-- Create missing core POS tables

-- Categories table (must come first due to FK)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, name, parent_id)
);

-- Products table  
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- Store as minor units (øre) - 1 DKK = 100 øre
  cost_price INTEGER DEFAULT 0, -- Cost in øre
  barcode VARCHAR(100),
  sku VARCHAR(100),
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_cost_price CHECK (cost_price >= 0),
  UNIQUE(company_id, sku) -- SKU unique per company
);

-- Inventory movements table (optional but recommended)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'waste')),
  quantity INTEGER NOT NULL, -- Negative for outbound, positive for inbound
  unit_cost INTEGER, -- Cost per unit in øre
  reference_id UUID, -- Link to order_id, purchase_id, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add company_id to existing tables that need it
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.gift_cards ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Update existing order_items to use integer prices (øre)
-- ALTER TABLE public.order_items ALTER COLUMN unit_price TYPE INTEGER USING (unit_price * 100);
-- ALTER TABLE public.order_items ALTER COLUMN total_price TYPE INTEGER USING (total_price * 100);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_company_parent ON public.categories(company_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_products_company_category ON public.products(company_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active, company_id);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(to_tsvector('danish', name));
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id, created_at DESC);

-- RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Tenant-safe policies
CREATE POLICY "Users can manage categories for their company" ON public.categories FOR ALL TO authenticated
USING (company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage products for their company" ON public.products FOR ALL TO authenticated  
USING (company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view inventory for their company" ON public.inventory_movements FOR SELECT TO authenticated
USING (company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid()));
