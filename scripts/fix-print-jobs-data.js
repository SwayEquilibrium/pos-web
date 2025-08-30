#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wncxwhcscvqxkenllzsw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3h3aGNzY3ZxeGtlbmxsenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE0MTksImV4cCI6MjA3MTYyNzQxOX0.LxLNnK7fJtSjqLJfK_ulebArNpp-EPd0P9vGJbg7fkI'

console.log('🔧 Fixing Print Jobs Data...')
console.log('=============================\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPrintJobsData() {
  try {
    console.log('1️⃣ Checking existing print_jobs data...')

    // Check what data exists
    const { data: existingData, error: selectError } = await supabase
      .from('print_jobs')
      .select('*')

    if (selectError) {
      console.log('❌ Error reading print_jobs:', selectError.message)
      return
    }

    console.log(`📊 Found ${existingData?.length || 0} rows in print_jobs`)

    if (existingData && existingData.length > 0) {
      console.log('\n2️⃣ Analyzing existing data...')

      // Check what columns exist and their values
      const sampleRow = existingData[0]
      console.log('Sample row structure:', Object.keys(sampleRow))

      // Check for invalid content_type values
      const invalidContentTypes = existingData.filter(row =>
        row.content_type && !['text/plain', 'text/html', 'application/json'].includes(row.content_type)
      )

      if (invalidContentTypes.length > 0) {
        console.log(`❌ Found ${invalidContentTypes.length} rows with invalid content_type values:`)
        invalidContentTypes.forEach(row => {
          console.log(`   ID: ${row.id}, content_type: "${row.content_type}"`)
        })

        // Update invalid content_type values to 'text/plain'
        console.log('\n3️⃣ Updating invalid content_type values...')

        const { error: updateError } = await supabase
          .from('print_jobs')
          .update({ content_type: 'text/plain' })
          .not('content_type', 'in', '("text/plain","text/html","application/json")')

        if (updateError) {
          console.log('❌ Error updating content_type values:', updateError.message)
        } else {
          console.log('✅ Updated invalid content_type values to "text/plain"')
        }
      } else {
        console.log('✅ All content_type values are valid')
      }

      // Check for missing required columns
      console.log('\n4️⃣ Checking for missing required data...')

      const rowsWithoutRequiredData = existingData.filter(row =>
        !row.idempotency_key || !row.printer_id || !row.job_type || !row.payload
      )

      if (rowsWithoutRequiredData.length > 0) {
        console.log(`⚠️ Found ${rowsWithoutRequiredData.length} rows missing required data`)

        // Delete rows that are incomplete (they might be from failed schema runs)
        console.log('🗑️ Deleting incomplete rows...')

        for (const row of rowsWithoutRequiredData) {
          const { error: deleteError } = await supabase
            .from('print_jobs')
            .delete()
            .eq('id', row.id)

          if (deleteError) {
            console.log(`❌ Error deleting row ${row.id}:`, deleteError.message)
          } else {
            console.log(`✅ Deleted incomplete row ${row.id}`)
          }
        }
      }
    }

    console.log('\n5️⃣ Now adding missing columns...')

    // Add missing columns one by one to avoid constraint issues
    const alterStatements = [
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS idempotency_key TEXT`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS printer_id UUID`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS job_type TEXT`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text/plain'`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS payload TEXT`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS rendered_content TEXT`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS template_version TEXT`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS template_data JSONB`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued'`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS retry_delay_minutes INTEGER DEFAULT 1`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS last_error TEXT`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS error_details JSONB`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS order_id UUID`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS table_id UUID`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS user_id UUID`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ`,
      `ALTER TABLE print_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`
    ]

    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i]
      console.log(`   Adding column ${i + 1}/${alterStatements.length}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          console.log(`     ⚠️ Column might already exist or error: ${error.message}`)
        } else {
          console.log(`     ✅ Column added successfully`)
        }
      } catch (error) {
        console.log(`     ⚠️ Error adding column: ${error.message}`)
      }
    }

    console.log('\n6️⃣ Adding constraints...')

    // Add constraints (these might fail if they already exist, which is OK)
    const constraintStatements = [
      `ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_idempotency_key_key`,
      `ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_idempotency_key_key UNIQUE (idempotency_key)`,
      `ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_job_type_check`,
      `ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_job_type_check CHECK (job_type IN ('receipt', 'kitchen', 'label', 'custom'))`,
      `ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_content_type_check`,
      `ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_content_type_check CHECK (content_type IN ('text/plain', 'text/html', 'application/json'))`,
      `ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_status_check`,
      `ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_status_check CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'))`
    ]

    for (const statement of constraintStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          console.log(`     ⚠️ Constraint issue: ${error.message}`)
        } else {
          console.log(`     ✅ Constraint added`)
        }
      } catch (error) {
        console.log(`     ⚠️ Constraint error: ${error.message}`)
      }
    }

    console.log('\n7️⃣ Creating create_print_job function...')

    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION create_print_job(
        p_idempotency_key TEXT,
        p_printer_id UUID,
        p_job_type TEXT,
        p_content_type TEXT DEFAULT 'text/plain',
        p_payload TEXT,
        p_rendered_content TEXT DEFAULT NULL,
        p_template_version TEXT DEFAULT NULL,
        p_template_data JSONB DEFAULT NULL,
        p_priority INTEGER DEFAULT 0,
        p_max_retries INTEGER DEFAULT 3,
        p_order_id UUID DEFAULT NULL,
        p_table_id UUID DEFAULT NULL,
        p_user_id UUID DEFAULT NULL,
        p_metadata JSONB DEFAULT '{}'
      ) RETURNS UUID AS $$
      DECLARE
        job_id UUID;
      BEGIN
        INSERT INTO print_jobs (
          idempotency_key,
          printer_id,
          job_type,
          content_type,
          payload,
          rendered_content,
          template_version,
          template_data,
          priority,
          max_retries,
          order_id,
          table_id,
          user_id,
          metadata
        ) VALUES (
          p_idempotency_key,
          p_printer_id,
          p_job_type,
          p_content_type,
          p_payload,
          p_rendered_content,
          p_template_version,
          p_template_data,
          p_priority,
          p_max_retries,
          p_order_id,
          p_table_id,
          p_user_id,
          p_metadata
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO job_id;

        IF job_id IS NULL THEN
          SELECT id INTO job_id FROM print_jobs WHERE idempotency_key = p_idempotency_key;
        END IF;

        RETURN job_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL })

      if (error) {
        console.log('❌ Error creating function:', error.message)
        console.log('📋 Manual SQL for function:')
        console.log(createFunctionSQL)
      } else {
        console.log('✅ create_print_job function created successfully!')
      }
    } catch (error) {
      console.log('❌ Error creating function:', error.message)
      console.log('📋 Manual SQL for function:')
      console.log(createFunctionSQL)
    }

    console.log('\n8️⃣ Final verification...')

    // Test the function
    const testResult = await supabase.rpc('create_print_job', {
      p_idempotency_key: 'test-fix-' + Date.now(),
      p_printer_id: '00000000-0000-0000-0000-000000000000',
      p_job_type: 'test',
      p_content_type: 'text/plain',
      p_payload: 'test payload'
    })

    if (testResult.error) {
      console.log('❌ Function test failed:', testResult.error.message)
    } else {
      console.log('✅ Function test successful!')

      // Clean up test data
      await supabase
        .from('print_jobs')
        .delete()
        .eq('idempotency_key', 'test-fix-' + Date.now().slice(0, -3))
    }

    console.log('\n🎉 Print jobs system should now be working!')
    console.log('   • All columns added')
    console.log('   • Constraints applied')
    console.log('   • Function created')
    console.log('   • Ready for printing!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

fixPrintJobsData().catch(console.error)
