-- Advanced Printer Management System v1.0
-- Comprehensive printer configuration with rules-driven printing pipeline

-- ================================================
-- PRINTER PROFILES
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, -- Will reference companies table when available
  
  -- Basic printer info
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  printer_type VARCHAR(50) NOT NULL DEFAULT 'CloudPRNT', -- CloudPRNT, WebPRNT, USB, etc.
  connection_string TEXT NOT NULL, -- IP address, URL, or device path
  
  -- Printer capabilities
  paper_width INTEGER DEFAULT 48, -- Characters per line
  supports_cut BOOLEAN DEFAULT true,
  cut_command TEXT DEFAULT 'ESC_d_1', -- Store the working cut command
  
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
  CHECK(paper_width > 0),
  CHECK(cut_command IN ('ESC_d_1', 'ESC_d_3', 'GS_V_66_0', 'GS_V_1_0', 'RAW_1D_56_01_00'))
);

-- ================================================
-- PRINTER ROOM ASSIGNMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL, -- Will reference rooms table when available
  
  -- Assignment metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(printer_id, room_id)
);

-- ================================================
-- PRINTER CATEGORY ASSIGNMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Assignment metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(printer_id, category_id)
);

-- ================================================
-- PRINTER SORT RULES (The Smart Printing Pipeline)
-- ================================================
CREATE TABLE IF NOT EXISTS public.printer_sort_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id UUID NOT NULL REFERENCES public.printer_profiles(id) ON DELETE CASCADE,
  
  -- Rule definition
  rule_name VARCHAR(100) NOT NULL, -- "Drinks First", "Course Order", etc.
  rule_type VARCHAR(50) NOT NULL, -- by_product_type, by_course, by_category
  rule_order INTEGER NOT NULL DEFAULT 0, -- Order in which rules are applied
  
  -- Rule configuration (JSON for flexibility)
  rule_config JSONB NOT NULL, -- {"values": ["Drinks"], "sort_direction": "asc"}
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(printer_id, rule_order),
  CHECK(rule_type IN ('by_product_type', 'by_course', 'by_category', 'by_priority')),
  CHECK(rule_order >= 0)
);

-- ================================================
-- PRODUCT TYPE DEFINITIONS (for flexible product categorization)
-- ================================================
CREATE TABLE IF NOT EXISTS public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, -- Will reference companies table when available
  
  -- Type definition
  name VARCHAR(100) NOT NULL, -- "Drinks", "Food", "Desserts", etc.
  code VARCHAR(50) NOT NULL, -- "drinks", "food", "desserts" (for code references)
  description TEXT,
  
  -- Sorting and display
  sort_order INTEGER DEFAULT 0,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, code),
  UNIQUE(company_id, name)
);

-- ================================================
-- PRODUCT TYPE ASSIGNMENTS (Many-to-Many: Products can have multiple types)
-- ================================================
CREATE TABLE IF NOT EXISTS public.product_type_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id) ON DELETE CASCADE,
  
  -- Assignment metadata
  is_primary BOOLEAN DEFAULT false, -- One primary type per product
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(product_id, product_type_id)
);

-- ================================================
-- COURSE DEFINITIONS (Starter, Main, Dessert, etc.)
-- ================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL, -- Will reference companies table when available
  
  -- Course definition
  name VARCHAR(100) NOT NULL, -- "Starter", "Main Course", "Dessert"
  code VARCHAR(50) NOT NULL, -- "starter", "main", "dessert"
  course_number INTEGER NOT NULL, -- 1, 2, 3 (for ordering)
  
  -- Display
  color VARCHAR(7) DEFAULT '#6B7280',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, code),
  UNIQUE(company_id, course_number),
  CHECK(course_number > 0)
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_printer_profiles_company ON public.printer_profiles(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_printer_profiles_default ON public.printer_profiles(company_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_printer_room_assignments_printer ON public.printer_room_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_room_assignments_room ON public.printer_room_assignments(room_id);

CREATE INDEX IF NOT EXISTS idx_printer_category_assignments_printer ON public.printer_category_assignments(printer_id);
CREATE INDEX IF NOT EXISTS idx_printer_category_assignments_category ON public.printer_category_assignments(category_id);

CREATE INDEX IF NOT EXISTS idx_printer_sort_rules_printer ON public.printer_sort_rules(printer_id, rule_order) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_types_company ON public.product_types(company_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_type_assignments_product ON public.product_type_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_type_assignments_type ON public.product_type_assignments(product_type_id);

CREATE INDEX IF NOT EXISTS idx_courses_company ON public.courses(company_id, is_active, course_number);

-- ================================================
-- SAMPLE DATA FOR TESTING
-- ================================================

-- Insert default product types
INSERT INTO public.product_types (company_id, name, code, sort_order, color) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Drinks', 'drinks', 1, '#3B82F6'),
  ('00000000-0000-0000-0000-000000000000', 'Food', 'food', 2, '#EF4444'),
  ('00000000-0000-0000-0000-000000000000', 'Desserts', 'desserts', 3, '#F59E0B'),
  ('00000000-0000-0000-0000-000000000000', 'Starters', 'starters', 4, '#10B981')
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert default courses
INSERT INTO public.courses (company_id, name, code, course_number, color) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Starter', 'starter', 1, '#10B981'),
  ('00000000-0000-0000-0000-000000000000', 'Main Course', 'main', 2, '#EF4444'),
  ('00000000-0000-0000-0000-000000000000', 'Dessert', 'dessert', 3, '#F59E0B')
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert sample printer profile (update existing TSP100)
INSERT INTO public.printer_profiles (
  company_id, 
  name, 
  display_name, 
  printer_type, 
  connection_string,
  paper_width,
  cut_command,
  print_kitchen_receipts,
  print_customer_receipts,
  is_default
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'tsp100-kitchen',
  'Kitchen Printer (TSP100)',
  'CloudPRNT',
  '192.168.8.197',
  48,
  'ESC_d_1', -- The working cut command we discovered!
  true,
  false,
  true
) ON CONFLICT (company_id, name) DO UPDATE SET
  cut_command = 'ESC_d_1',
  updated_at = NOW();

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get printer configuration for a specific printer
CREATE OR REPLACE FUNCTION get_printer_config(p_printer_id UUID)
RETURNS TABLE(
  printer_id UUID,
  printer_name VARCHAR,
  printer_type VARCHAR,
  connection_string TEXT,
  paper_width INTEGER,
  cut_command TEXT,
  print_kitchen_receipts BOOLEAN,
  print_customer_receipts BOOLEAN,
  assigned_rooms UUID[],
  assigned_categories UUID[],
  sort_rules JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.name,
    pp.printer_type,
    pp.connection_string,
    pp.paper_width,
    pp.cut_command,
    pp.print_kitchen_receipts,
    pp.print_customer_receipts,
    
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
    
    -- Sort rules as JSON
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'rule_name', rule_name,
          'rule_type', rule_type,
          'rule_order', rule_order,
          'rule_config', rule_config
        ) ORDER BY rule_order
      ) FROM printer_sort_rules WHERE printer_id = pp.id AND is_active = true),
      '[]'::JSONB
    )
    
  FROM printer_profiles pp
  WHERE pp.id = p_printer_id AND pp.is_active = true;
END;
$$;

-- Function to update printer sort rules
CREATE OR REPLACE FUNCTION update_printer_sort_rules(
  p_printer_id UUID,
  p_rules JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rule_item JSONB;
  rule_order_counter INTEGER := 0;
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
      rule_order,
      rule_config,
      is_active
    ) VALUES (
      p_printer_id,
      rule_item->>'rule_name',
      rule_item->>'rule_type',
      rule_order_counter,
      rule_item->'rule_config',
      COALESCE((rule_item->>'is_active')::BOOLEAN, true)
    );
    
    rule_order_counter := rule_order_counter + 1;
  END LOOP;
END;
$$;

-- ================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.printer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_sort_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_type_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policies (basic company-based access)
-- Note: Adjust these based on your actual auth system

CREATE POLICY "Users can view printer profiles" ON public.printer_profiles
  FOR SELECT USING (true); -- Adjust based on your auth system

CREATE POLICY "Users can manage printer profiles" ON public.printer_profiles
  FOR ALL USING (true); -- Adjust based on your auth system

-- Similar policies for other tables
CREATE POLICY "Users can manage printer assignments" ON public.printer_room_assignments
  FOR ALL USING (true);

CREATE POLICY "Users can manage printer assignments" ON public.printer_category_assignments
  FOR ALL USING (true);

CREATE POLICY "Users can manage printer rules" ON public.printer_sort_rules
  FOR ALL USING (true);

CREATE POLICY "Users can manage product types" ON public.product_types
  FOR ALL USING (true);

CREATE POLICY "Users can manage product type assignments" ON public.product_type_assignments
  FOR ALL USING (true);

CREATE POLICY "Users can manage courses" ON public.courses
  FOR ALL USING (true);
