import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking print_templates table...')
    
    // Check if table exists and get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('print_templates')
      .select('*')
      .order('type, name')
    
    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError)
      return NextResponse.json({ 
        error: 'Failed to fetch templates',
        details: templatesError.message
      }, { status: 500 })
    }
    
    // Check for default templates specifically
    const { data: defaultTemplates, error: defaultError } = await supabase
      .from('print_templates')
      .select('*')
      .eq('is_default', true)
      .order('type')
    
    if (defaultError) {
      console.error('❌ Error fetching default templates:', defaultError)
    }
    
    // Get table structure info
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'print_templates')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    const result = {
      tableExists: true,
      totalTemplates: templates?.length || 0,
      templates: templates || [],
      defaultTemplates: defaultTemplates || [],
      tableStructure: tableInfo || [],
      hasKitchenDefault: defaultTemplates?.some(t => t.type === 'kitchen') || false,
      hasReceiptDefault: defaultTemplates?.some(t => t.type === 'receipt') || false
    }
    
    console.log('🔍 Debug result:', result)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
