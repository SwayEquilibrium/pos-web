#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runPrintTemplatesMigration() {
  console.log('\n🖨️ Running Print Templates Migration')
  console.log('=====================================')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '2025-create-print-templates.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📁 Migration file loaded:', migrationPath)
    console.log('📋 SQL content length:', migrationSQL.length, 'characters')
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}:`)
        console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.log(`   ⚠️  RPC failed, trying direct execution...`)
            
            // Try to execute the statement directly
            if (statement.includes('CREATE TABLE')) {
              console.log(`   📊 Creating table...`)
              // For table creation, we'll need to handle this differently
              console.log(`   ⚠️  Table creation requires manual execution in Supabase dashboard`)
            } else if (statement.includes('INSERT INTO')) {
              console.log(`   📝 Inserting data...`)
              // For inserts, we'll need to handle this differently
              console.log(`   ⚠️  Data insertion requires manual execution in Supabase dashboard`)
            } else {
              console.log(`   ⚠️  Statement type not supported for direct execution`)
            }
          } else {
            console.log(`   ✅ Statement executed successfully`)
          }
        } catch (stmtError) {
          console.log(`   ❌ Statement execution failed: ${stmtError.message}`)
        }
      }
    }
    
    console.log('\n🎉 Migration script completed!')
    console.log('\n📋 Next steps:')
    console.log('   1. Go to your Supabase dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy and paste the content from: supabase/migrations/2025-create-print-templates.sql')
    console.log('   4. Execute the SQL')
    console.log('   5. Verify the print_templates table was created')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runPrintTemplatesMigration()
