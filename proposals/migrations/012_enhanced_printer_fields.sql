-- Enhanced Printer System v2.0
-- Add enhanced fields to existing printer system

-- ================================================
-- UPDATE PRINTER PROFILES TABLE
-- ================================================

-- Add enhanced fields to printer_profiles
DO $$
BEGIN
  -- Add brand field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'printer_profiles' AND column_name = 'brand') THEN
    ALTER TABLE public.printer_profiles ADD COLUMN brand VARCHAR(50) DEFAULT 'Star';
  END IF;

  -- Add enhanced cut command fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'printer_profiles' AND column_name = 'cut_command_hex') THEN
    ALTER TABLE public.printer_profiles ADD COLUMN cut_command_hex VARCHAR(20) DEFAULT '1B6401';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'printer_profiles' AND column_name = 'cut_command_name') THEN
    ALTER TABLE public.printer_profiles ADD COLUMN cut_command_name VARCHAR(100) DEFAULT 'ESC d 1 (Partial Cut)';
  END IF;

  -- Update existing cut_command constraint to allow more values
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE table_name = 'printer_profiles' AND constraint_name LIKE '%cut_command_check%') THEN
    ALTER TABLE public.printer_profiles DROP CONSTRAINT IF EXISTS printer_profiles_cut_command_check;
  END IF;

  -- Add new constraint for cut_command_hex
  ALTER TABLE public.printer_profiles ADD CONSTRAINT printer_profiles_cut_command_hex_check 
    CHECK (cut_command_hex ~ '^[0-9A-Fa-f]+$' AND length(cut_command_hex) >= 2);

  -- Add brand constraint
  ALTER TABLE public.printer_profiles ADD CONSTRAINT printer_profiles_brand_check 
    CHECK (brand IN ('Star', 'Epson', 'Generic'));
END $$;

-- ================================================
-- UPDATE PRINTER SORT RULES TABLE
-- ================================================

-- Add rule_scope field to printer_sort_rules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'printer_sort_rules' AND column_name = 'rule_scope') THEN
    ALTER TABLE public.printer_sort_rules ADD COLUMN rule_scope VARCHAR(20) DEFAULT 'section';
  END IF;

  -- Add constraint for rule_scope
  ALTER TABLE public.printer_sort_rules ADD CONSTRAINT printer_sort_rules_scope_check 
    CHECK (rule_scope IN ('section', 'within_section'));

  -- Update unique constraint to include scope
  ALTER TABLE public.printer_sort_rules DROP CONSTRAINT IF EXISTS printer_sort_rules_printer_id_rule_order_key;
  ALTER TABLE public.printer_sort_rules ADD CONSTRAINT printer_sort_rules_printer_scope_order_unique 
    UNIQUE (printer_id, rule_scope, rule_order);
END $$;

-- ================================================
-- UPDATE EXISTING DATA
-- ================================================

-- Update existing printer profiles with enhanced fields
UPDATE public.printer_profiles SET 
  brand = 'Star',
  cut_command_hex = '1B6401',
  cut_command_name = 'ESC d 1 (Partial Cut)'
WHERE brand IS NULL OR cut_command_hex IS NULL;

-- Update existing sort rules with default scope
UPDATE public.printer_sort_rules SET 
  rule_scope = 'section'
WHERE rule_scope IS NULL;

-- ================================================
-- ENHANCED HELPER FUNCTIONS
-- ================================================

-- Drop and recreate the enhanced get_printer_config function
DROP FUNCTION IF EXISTS get_printer_config(UUID);

CREATE OR REPLACE FUNCTION get_printer_config_enhanced(p_printer_id UUID)
RETURNS TABLE(
  printer_id UUID,
  company_id UUID,
  printer_name VARCHAR,
  display_name VARCHAR,
  printer_type VARCHAR,
  connection_string TEXT,
  brand VARCHAR,
  paper_width INTEGER,
  supports_cut BOOLEAN,
  cut_command_hex VARCHAR,
  cut_command_name VARCHAR,
  print_kitchen_receipts BOOLEAN,
  print_customer_receipts BOOLEAN,
  auto_print_on_order BOOLEAN,
  auto_print_on_payment BOOLEAN,
  is_active BOOLEAN,
  is_default BOOLEAN,
  last_test_at TIMESTAMPTZ,
  last_test_result TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  assigned_rooms UUID[],
  assigned_categories UUID[],
  sort_rules JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.company_id,
    pp.name,
    pp.display_name,
    pp.printer_type,
    pp.connection_string,
    pp.brand,
    pp.paper_width,
    pp.supports_cut,
    pp.cut_command_hex,
    pp.cut_command_name,
    pp.print_kitchen_receipts,
    pp.print_customer_receipts,
    pp.auto_print_on_order,
    pp.auto_print_on_payment,
    pp.is_active,
    pp.is_default,
    pp.last_test_at,
    pp.last_test_result,
    pp.created_at,
    pp.updated_at,
    
    -- Assigned rooms as array
    COALESCE(
      (SELECT array_agg(room_id) FROM printer_room_assignments WHERE printer_id = pp.id),
      ARRAY[]::UUID[]
    ),
    
    -- Assigned categories as array  
    COALESCE(
      (SELECT array_agg(category_id) FROM printer_category_assignments WHERE printer_id = pp.id),
      ARRAY[]::UUID[]
    ),
    
    -- Sort rules as JSON with scope information
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'rule_name', rule_name,
          'rule_type', rule_type,
          'rule_scope', rule_scope,
          'rule_order', rule_order,
          'rule_config', rule_config,
          'is_active', is_active,
          'created_at', created_at,
          'updated_at', updated_at
        ) ORDER BY rule_scope, rule_order
      ) FROM printer_sort_rules WHERE printer_id = pp.id AND is_active = true),
      '[]'::JSONB
    )
    
  FROM printer_profiles pp
  WHERE pp.id = p_printer_id AND pp.is_active = true;
END;
$$;

-- Drop and recreate the enhanced update_printer_sort_rules function
DROP FUNCTION IF EXISTS update_printer_sort_rules(UUID, JSONB);

CREATE OR REPLACE FUNCTION update_printer_sort_rules_enhanced(
  p_printer_id UUID,
  p_rules JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rule_item JSONB;
BEGIN
  -- Delete existing rules for this printer
  DELETE FROM printer_sort_rules WHERE printer_id = p_printer_id;
  
  -- Insert new rules
  FOR rule_item IN SELECT * FROM jsonb_array_elements(p_rules)
  LOOP
    INSERT INTO printer_sort_rules (
      printer_id,
      rule_name,
      rule_type,
      rule_scope,
      rule_order,
      rule_config,
      is_active
    ) VALUES (
      p_printer_id,
      rule_item->>'rule_name',
      rule_item->>'rule_type',
      COALESCE(rule_item->>'rule_scope', 'section'),
      COALESCE((rule_item->>'rule_order')::INTEGER, 0),
      rule_item->'rule_config',
      COALESCE((rule_item->>'is_active')::BOOLEAN, true)
    );
  END LOOP;
END;
$$;

-- ================================================
-- UPDATE INDEXES
-- ================================================

-- Add indexes for enhanced fields
CREATE INDEX IF NOT EXISTS idx_printer_profiles_brand ON public.printer_profiles(brand, is_active);
CREATE INDEX IF NOT EXISTS idx_printer_sort_rules_scope ON public.printer_sort_rules(printer_id, rule_scope, rule_order) WHERE is_active = true;

-- ================================================
-- SAMPLE DATA UPDATE
-- ================================================

-- Update the existing TSP100 printer with enhanced fields
UPDATE public.printer_profiles SET 
  brand = 'Star',
  cut_command_hex = '1B6401',
  cut_command_name = 'ESC d 1 (Partial Cut - TESTED WORKING)',
  updated_at = NOW()
WHERE name = 'tsp100-kitchen';

-- Add some sample sort rules for the TSP100 printer
DO $$
DECLARE
  tsp100_id UUID;
BEGIN
  -- Get the TSP100 printer ID
  SELECT id INTO tsp100_id FROM printer_profiles WHERE name = 'tsp100-kitchen' LIMIT 1;
  
  IF tsp100_id IS NOT NULL THEN
    -- Add sample section rules
    INSERT INTO printer_sort_rules (
      printer_id, rule_name, rule_type, rule_scope, rule_order, rule_config, is_active
    ) VALUES 
    (
      tsp100_id,
      'Drinks First',
      'by_product_type',
      'section',
      0,
      '{"values": ["drinks"], "sort_direction": "asc"}'::JSONB,
      true
    ),
    (
      tsp100_id,
      'Course Order',
      'by_course',
      'section',
      1,
      '{"course_numbers": [1, 2, 3], "sort_direction": "asc"}'::JSONB,
      true
    )
    ON CONFLICT (printer_id, rule_scope, rule_order) DO NOTHING;

    -- Add sample within-section rules
    INSERT INTO printer_sort_rules (
      printer_id, rule_name, rule_type, rule_scope, rule_order, rule_config, is_active
    ) VALUES 
    (
      tsp100_id,
      'Category Priority',
      'by_category',
      'within_section',
      0,
      '{"sort_direction": "asc"}'::JSONB,
      true
    )
    ON CONFLICT (printer_id, rule_scope, rule_order) DO NOTHING;
  END IF;
END $$;
