-- ================================================
-- SIMPLE PRINTER SCHEMA - JUST WORKS
-- ================================================
-- Basic printer configuration for POS system
-- No complex relationships, no auth, no RLS

-- Simple printers table
CREATE TABLE IF NOT EXISTS public.printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  printer_type TEXT NOT NULL CHECK (printer_type IN ('thermal', 'laser', 'inkjet', 'label')),
  connection_string TEXT NOT NULL, -- IP address
  port INTEGER DEFAULT 9100,
  brand TEXT,
  model TEXT,
  paper_width INTEGER DEFAULT 48, -- 48mm, 58mm, 80mm, etc.
  supports_cut BOOLEAN DEFAULT false,
  cut_command_hex TEXT DEFAULT '1B69',
  print_kitchen_receipts BOOLEAN DEFAULT true,
  print_customer_receipts BOOLEAN DEFAULT true,
  auto_print_on_order BOOLEAN DEFAULT false,
  auto_print_on_payment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_printers_active ON public.printers(is_active);
CREATE INDEX IF NOT EXISTS idx_printers_type ON public.printers(printer_type);

-- Simple update trigger
CREATE OR REPLACE FUNCTION update_printers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_printers_updated_at
  BEFORE UPDATE ON public.printers
  FOR EACH ROW
  EXECUTE FUNCTION update_printers_updated_at();

-- Sample data for testing
INSERT INTO public.printers (name, display_name, printer_type, connection_string, brand, paper_width)
VALUES
  ('kitchen-01', 'Kitchen Printer', 'thermal', '192.168.8.192', 'Star', 48),
  ('counter-01', 'Counter Printer', 'thermal', '192.168.1.100', 'Epson', 58)
ON CONFLICT (name) DO NOTHING;

