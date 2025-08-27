/**
 * Simple script to run the printer migration
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

async function runMigration() {
  console.log('🔄 Starting printer migration...')
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../proposals/migrations/013_simple_printer_setup.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration SQL loaded')
    console.log('🔗 Connecting to database...')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.log('📝 Statement was:', statement.substring(0, 100) + '...')
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} completed`)
        }
      }
    }
    
    console.log('🎉 Migration completed!')
    
    // Test the tables
    console.log('🧪 Testing printer_profiles table...')
    const { data, error } = await supabase
      .from('printer_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Table test failed:', error.message)
      console.log('💡 You may need to run the SQL manually in your database tool')
    } else {
      console.log('✅ printer_profiles table is working!')
      console.log('📊 Current printers:', data?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n💡 Alternative: Copy and paste this SQL into your database tool:')
    console.log('📄 File: proposals/migrations/013_simple_printer_setup.sql')
  }
}

// Alternative: Just show the SQL for manual execution
function showManualInstructions() {
  console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:')
  console.log('1. Open your database management tool (pgAdmin, DBeaver, etc.)')
  console.log('2. Connect to your pos_web database')
  console.log('3. Copy and paste the contents of this file:')
  console.log('   📄 proposals/migrations/013_simple_printer_setup.sql')
  console.log('4. Execute the SQL')
  console.log('5. Refresh your app and try the printer settings again')
  console.log('\n🎯 The SQL creates these tables:')
  console.log('   • printer_profiles')
  console.log('   • printer_room_assignments') 
  console.log('   • printer_category_assignments')
  console.log('   • product_types')
  console.log('   • product_type_assignments')
}

// Run the migration or show instructions
if (process.argv.includes('--manual')) {
  showManualInstructions()
} else {
  runMigration().catch(error => {
    console.error('Script failed:', error)
    showManualInstructions()
  })
}
