// Temporary API endpoint to run the printer migration
import { supabase } from '@/lib/supabaseClient'

const MIGRATION_SQL = `
-- Simple Printer Setup v1.0
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
`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Starting printer migration...')
    
    // Split SQL into statements and execute each one
    const statements = MIGRATION_SQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements`)
    
    const results = []
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          })
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            results.push({ 
              statement: i + 1, 
              success: false, 
              error: error.message,
              sql: statement.substring(0, 100) + '...'
            })
          } else {
            console.log(`✅ Statement ${i + 1} completed`)
            results.push({ 
              statement: i + 1, 
              success: true 
            })
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message)
          results.push({ 
            statement: i + 1, 
            success: false, 
            error: err.message 
          })
        }
      }
    }
    
    // Test the tables
    console.log('🧪 Testing printer_profiles table...')
    const { data: testData, error: testError } = await supabase
      .from('printer_profiles')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Table test failed:', testError.message)
      return res.status(500).json({ 
        success: false, 
        error: testError.message,
        results,
        message: 'Migration completed but table test failed. You may need to run the SQL manually.'
      })
    } else {
      console.log('✅ printer_profiles table is working!')
      return res.status(200).json({ 
        success: true, 
        message: 'Migration completed successfully!',
        printers: testData?.length || 0,
        results: results.filter(r => !r.success) // Only show errors
      })
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Migration failed. You may need to run the SQL manually in your database tool.'
    })
  }
}
