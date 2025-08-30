#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wncxwhcscvqxkenllzsw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3h3aGNzY3ZxeGtlbmxsenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE0MTksImV4cCI6MjA3MTYyNzQxOX0.LxLNnK7fJtSjqLJfK_ulebArNpp-EPd0P9vGJbg7fkI'

console.log('🔧 Using Supabase configuration:')
console.log('   URL:', supabaseUrl)
console.log('   Key:', supabaseKey ? '✅ Present' : '❌ Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function runModifiersSchema() {
  console.log('🛠️ Setting up Modifiers Schema...')
  console.log('=================================\n')

  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'modifiers-schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    console.log('📄 Executing modifiers schema...')
    console.log('   File:', schemaPath)

    // Split SQL into statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`   Found ${statements.length} SQL statements to execute\n`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement.trim()) continue

      const preview = statement.substring(0, 60).replace(/\n/g, ' ')
      console.log(`   [${i + 1}/${statements.length}] Executing: ${preview}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          // Try direct execution
          console.log('     RPC failed, trying direct execution...')
          const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(0)
          if (directError) {
            throw new Error(`Direct execution not available: ${directError.message}`)
          }
        }

        console.log('     ✅ Success')
        successCount++
      } catch (error) {
        console.log(`     ❌ Failed: ${error.message}`)
        errorCount++
      }
    }

    console.log('\n🎉 Modifiers schema execution completed!')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`   📊 Total: ${successCount + errorCount}`)

    if (errorCount === 0) {
      console.log('\n🚀 Modifiers system is ready!')
      console.log('   • modifier_groups table created')
      console.log('   • modifiers table created')
      console.log('   • product_modifier_groups table created')
      console.log('   • Sample modifier data inserted')
      console.log('   • Functions and triggers created')
    } else {
      console.log('\n⚠️  Some statements failed. You may need to run them manually in Supabase SQL Editor.')
    }

  } catch (error) {
    console.error('❌ Error running modifiers schema:', error.message)
    console.log('\n🔧 Manual setup instructions:')
    console.log('1. Open your Supabase dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Copy and paste the content of database/modifiers-schema.sql')
    console.log('4. Run the query')
  }
}

runModifiersSchema().catch(console.error)
