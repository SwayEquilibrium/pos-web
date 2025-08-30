-- ================================================
-- FIX MODIFIERS SCHEMA - STEP BY STEP
-- ================================================

-- Step 1: Create tables first
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('variant', 'addon')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, modifier_group_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_modifiers_group_id ON public.modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_active ON public.modifiers(active);
CREATE INDEX IF NOT EXISTS idx_modifier_groups_active ON public.modifier_groups(active);
CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_product_id ON public.product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_active ON public.product_modifier_groups(active);

-- Step 3: Create triggers
CREATE OR REPLACE FUNCTION update_modifier_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_modifiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_product_modifier_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_modifier_groups_updated ON public.modifier_groups;
CREATE TRIGGER trg_modifier_groups_updated
  BEFORE UPDATE ON public.modifier_groups
  FOR EACH ROW EXECUTE FUNCTION update_modifier_groups_updated_at();

DROP TRIGGER IF EXISTS trg_modifiers_updated ON public.modifiers;
CREATE TRIGGER trg_modifiers_updated
  BEFORE UPDATE ON public.modifiers
  FOR EACH ROW EXECUTE FUNCTION update_modifiers_updated_at();

DROP TRIGGER IF EXISTS trg_product_modifier_groups_updated ON public.product_modifier_groups;
CREATE TRIGGER trg_product_modifier_groups_updated
  BEFORE UPDATE ON public.product_modifier_groups
  FOR EACH ROW EXECUTE FUNCTION update_product_modifier_groups_updated_at();

-- Step 4: Insert sample data
INSERT INTO public.modifier_groups (name, description, type, is_required, sort_index, active) VALUES
('Størrelse', 'Vælg størrelse', 'variant', true, 1, true),
('Ekstra', 'Tilføj ekstra', 'addon', false, 2, true),
('Sauce', 'Vælg sauce', 'variant', false, 3, true)
ON CONFLICT DO NOTHING;

-- Insert modifiers for Size group
INSERT INTO public.modifiers (group_id, name, price_adjustment, sort_index, active)
SELECT mg.id, 'Lille', -10.00, 1, true FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
UNION ALL
SELECT mg.id, 'Standard', 0.00, 2, true FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
UNION ALL
SELECT mg.id, 'Stor', 15.00, 3, true FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
UNION ALL
SELECT mg.id, 'XL', 25.00, 4, true FROM public.modifier_groups mg WHERE mg.name = 'Størrelse'
ON CONFLICT DO NOTHING;

-- Insert modifiers for Extras group
INSERT INTO public.modifiers (group_id, name, price_adjustment, sort_index, active)
SELECT mg.id, 'Ekstra Ost', 10.00, 1, true FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
UNION ALL
SELECT mg.id, 'Bacon', 15.00, 2, true FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
UNION ALL
SELECT mg.id, 'Avocado', 12.00, 3, true FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
UNION ALL
SELECT mg.id, 'Ekstra Kød', 20.00, 4, true FROM public.modifier_groups mg WHERE mg.name = 'Ekstra'
ON CONFLICT DO NOTHING;

-- Insert modifiers for Sauce group
INSERT INTO public.modifiers (group_id, name, price_adjustment, sort_index, active)
SELECT mg.id, 'Ketchup', 0.00, 1, true FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
UNION ALL
SELECT mg.id, 'Remoulade', 0.00, 2, true FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
UNION ALL
SELECT mg.id, 'Mayo', 0.00, 3, true FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
UNION ALL
SELECT mg.id, 'Bearnaise', 5.00, 4, true FROM public.modifier_groups mg WHERE mg.name = 'Sauce'
ON CONFLICT DO NOTHING;

-- Step 5: Enable RLS
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.modifier_groups;
CREATE POLICY "Allow all for authenticated users" ON public.modifier_groups
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.modifiers;
CREATE POLICY "Allow all for authenticated users" ON public.modifiers
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.product_modifier_groups;
CREATE POLICY "Allow all for authenticated users" ON public.product_modifier_groups
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow read for anonymous" ON public.modifiers;
CREATE POLICY "Allow read for anonymous" ON public.modifiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read for anonymous" ON public.product_modifier_groups;
CREATE POLICY "Allow read for anonymous" ON public.product_modifier_groups
  FOR SELECT USING (true);

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

-- If you see this, the schema was created successfully!
-- You can now use the modifiers system in your POS.
