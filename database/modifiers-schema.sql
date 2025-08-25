-- ================================================
-- MODIFIER SYSTEM SCHEMA
-- ================================================

-- Modifier Groups (e.g., "Size", "Extras", "Sauce")
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('variant', 'addon')), -- variant = choose one, addon = add multiple
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual Modifiers (e.g., "Large", "Small", "Extra Cheese", "Ketchup")
CREATE TABLE IF NOT EXISTS public.modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0, -- can be positive or negative
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link products to modifier groups (which modifiers are available for which products)
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false, -- override group default
  sort_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, modifier_group_id)
);

-- Update order_items to include selected modifiers
-- First, let's see the current structure
-- We already have a modifiers column in order_items, but let's make sure it's properly structured

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS trg_modifier_groups_updated ON public.modifier_groups;
CREATE TRIGGER trg_modifier_groups_updated 
  BEFORE UPDATE ON public.modifier_groups 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_modifiers_updated ON public.modifiers;
CREATE TRIGGER trg_modifiers_updated 
  BEFORE UPDATE ON public.modifiers 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ================================================
-- SAMPLE DATA
-- ================================================

-- Size variants (choose one)
INSERT INTO public.modifier_groups (name, description, type, is_required, sort_index) VALUES
('Størrelse', 'Vælg størrelse', 'variant', true, 1),
('Ekstra', 'Tilføj ekstra', 'addon', false, 2),
('Sauce', 'Vælg sauce', 'variant', false, 3);

-- Modifiers for Size group
INSERT INTO public.modifiers (group_id, name, price_adjustment, sort_index)
SELECT mg.id, 'Lille', -10.00, 1 FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
UNION ALL
SELECT mg.id, 'Standard', 0.00, 2 FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
UNION ALL
SELECT mg.id, 'Stor', 15.00, 3 FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
UNION ALL
SELECT mg.id, 'XL', 25.00, 4 FROM public.modifier_groups mg WHERE mg.name = 'Størrelse';

-- Modifiers for Extras group
INSERT INTO public.modifiers (group_id, name, price_adjustment, sort_index)
SELECT mg.id, 'Ekstra Ost', 10.00, 1 FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
UNION ALL
SELECT mg.id, 'Bacon', 15.00, 2 FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
UNION ALL
SELECT mg.id, 'Avocado', 12.00, 3 FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
UNION ALL
SELECT mg.id, 'Ekstra Kød', 20.00, 4 FROM public.modifier_groups mg WHERE mg.name = 'Ekstra';

-- Modifiers for Sauce group
INSERT INTO public.modifiers (group_id, name, price_adjustment, sort_index)
SELECT mg.id, 'Ketchup', 0.00, 1 FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
UNION ALL
SELECT mg.id, 'Remoulade', 0.00, 2 FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
UNION ALL
SELECT mg.id, 'Mayo', 0.00, 3 FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
UNION ALL
SELECT mg.id, 'Bearnaise', 5.00, 4 FROM public.modifier_groups mg WHERE mg.name = 'Sauce';

-- ================================================
-- FUNCTIONS FOR MODIFIER MANAGEMENT
-- ================================================

-- Function to get available modifiers for a product
CREATE OR REPLACE FUNCTION public.get_product_modifiers(p_product_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  group_type TEXT,
  group_required BOOLEAN,
  modifier_id UUID,
  modifier_name TEXT,
  modifier_price NUMERIC(12,2),
  modifier_sort INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mg.id as group_id,
    mg.name as group_name,
    mg.type as group_type,
    COALESCE(pmg.is_required, mg.is_required) as group_required,
    m.id as modifier_id,
    m.name as modifier_name,
    m.price_adjustment as modifier_price,
    m.sort_index as modifier_sort
  FROM public.modifier_groups mg
  JOIN public.product_modifier_groups pmg ON mg.id = pmg.modifier_group_id
  JOIN public.modifiers m ON mg.id = m.group_id
  WHERE pmg.product_id = p_product_id
    AND mg.active = true 
    AND m.active = true
  ORDER BY pmg.sort_index, mg.sort_index, m.sort_index;
END;
$$;

-- Function to calculate total price with modifiers
CREATE OR REPLACE FUNCTION public.calculate_item_price(
  p_base_price NUMERIC(12,2),
  p_modifiers JSONB
) RETURNS NUMERIC(12,2) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total NUMERIC(12,2) := p_base_price;
  v_modifier JSONB;
  v_price_adjustment NUMERIC(12,2);
BEGIN
  -- Loop through selected modifiers
  FOR v_modifier IN SELECT * FROM jsonb_array_elements(p_modifiers)
  LOOP
    -- Get price adjustment for this modifier
    SELECT m.price_adjustment INTO v_price_adjustment
    FROM public.modifiers m
    WHERE m.id = (v_modifier->>'modifier_id')::UUID;
    
    v_total := v_total + COALESCE(v_price_adjustment, 0);
  END LOOP;
  
  RETURN v_total;
END;
$$;

-- ================================================
-- RLS POLICIES (if needed)
-- ================================================

-- Enable RLS
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON public.modifier_groups FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.modifiers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.product_modifier_groups FOR ALL TO authenticated USING (true);

-- Allow read access for anonymous users
CREATE POLICY "Allow read for anonymous" ON public.modifier_groups FOR SELECT TO anon USING (active = true);
CREATE POLICY "Allow read for anonymous" ON public.modifiers FOR SELECT TO anon USING (active = true);
CREATE POLICY "Allow read for anonymous" ON public.product_modifier_groups FOR SELECT TO anon USING (true);
