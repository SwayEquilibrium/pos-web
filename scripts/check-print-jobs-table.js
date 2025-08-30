#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wncxwhcscvqxkenllzsw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3h3aGNzY3ZxeGtlbmxsenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE0MTksImV4cCI6MjA3MTYyNzQxOX0.LxLNnK7fJtSjqLJfK_ulebArNpp-EPd0P9vGJbg7fkI'

console.log('🔍 Checking Print Jobs Table State...')
console.log('======================================\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPrintJobsTable() {
  try {
    console.log('1️⃣ Checking if print_jobs table exists...')

    // Try to select from the table to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('print_jobs')
      .select('id')
      .limit(1)

    if (testError) {
      if (testError.message.includes('does not exist')) {
        console.log('❌ print_jobs table does not exist')
        return await createPrintJobsTable()
      } else {
        console.log('❌ Error accessing print_jobs table:', testError.message)
        return
      }
    }

    console.log('✅ print_jobs table exists')

    // Check table structure
    console.log('\n2️⃣ Checking table structure...')
    const { data: columns, error: columnsError } = await supabase
      .from('print_jobs')
      .select('*')
      .limit(0) // Just get column info, no data

    if (columnsError) {
      console.log('❌ Error getting table structure:', columnsError.message)
      return
    }

    // Check for required columns
    console.log('\n3️⃣ Checking required columns...')

    // Test inserting a dummy row to see what columns are missing
    const testRow = {
      idempotency_key: 'test-key-' + Date.now(),
      printer_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      job_type: 'test',
      content_type: 'text/plain',
      payload: 'test payload'
    }

    const { error: insertError } = await supabase
      .from('print_jobs')
      .insert(testRow)

    if (insertError) {
      console.log('❌ Missing columns detected:', insertError.message)

      // Try to identify which columns are missing
      if (insertError.message.includes('idempotency_key')) {
        console.log('   - idempotency_key column is missing')
      }
      if (insertError.message.includes('printer_id')) {
        console.log('   - printer_id column is missing')
      }
      if (insertError.message.includes('job_type')) {
        console.log('   - job_type column is missing')
      }
      if (insertError.message.includes('content_type')) {
        console.log('   - content_type column is missing')
      }
      if (insertError.message.includes('payload')) {
        console.log('   - payload column is missing')
      }

      return await fixPrintJobsTable()
    }

    console.log('✅ All required columns present')

    // Clean up test row
    await supabase
      .from('print_jobs')
      .delete()
      .eq('idempotency_key', testRow.idempotency_key)

    console.log('\n4️⃣ Checking print_job_logs table...')
    const { error: logsError } = await supabase
      .from('print_job_logs')
      .select('id')
      .limit(1)

    if (logsError && logsError.message.includes('does not exist')) {
      console.log('❌ print_job_logs table does not exist')
      return await createPrintJobLogsTable()
    } else if (logsError) {
      console.log('❌ Error with print_job_logs table:', logsError.message)
    } else {
      console.log('✅ print_job_logs table exists')
    }

    console.log('\n5️⃣ Checking create_print_job function...')
    const { error: functionError } = await supabase.rpc('create_print_job', {
      p_idempotency_key: 'test-function-' + Date.now(),
      p_printer_id: '00000000-0000-0000-0000-000000000000',
      p_job_type: 'test',
      p_content_type: 'text/plain',
      p_payload: 'test'
    })

    if (functionError) {
      if (functionError.message.includes('does not exist')) {
        console.log('❌ create_print_job function does not exist')
        return await createPrintJobFunction()
      } else {
        console.log('❌ Error with create_print_job function:', functionError.message)
      }
    } else {
      console.log('✅ create_print_job function exists')
    }

    console.log('\n🎉 Print jobs system appears to be working!')
    console.log('   • Tables exist')
    console.log('   • Required columns present')
    console.log('   • Functions available')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function createPrintJobsTable() {
  console.log('\n🔧 Creating print_jobs table...')

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.print_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      idempotency_key TEXT NOT NULL UNIQUE,
      printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
      job_type TEXT NOT NULL CHECK (job_type IN ('receipt', 'kitchen', 'label', 'custom')),
      content_type TEXT NOT NULL DEFAULT 'text/plain' CHECK (content_type IN ('text/plain', 'text/html', 'application/json')),
      payload TEXT NOT NULL,
      rendered_content TEXT,
      template_version TEXT,
      template_data JSONB,
      status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
      priority INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      retry_count INTEGER DEFAULT 0,
      retry_delay_minutes INTEGER DEFAULT 1,
      next_retry_at TIMESTAMPTZ,
      last_error TEXT,
      error_details JSONB,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_print_jobs_printer_id ON print_jobs(printer_id);
    CREATE INDEX IF NOT EXISTS idx_print_jobs_idempotency_key ON print_jobs(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON print_jobs(order_id);
    CREATE INDEX IF NOT EXISTS idx_print_jobs_next_retry_at ON print_jobs(next_retry_at) WHERE status = 'failed';
    CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_print_jobs_priority ON print_jobs(priority DESC, created_at ASC);
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.log('❌ Failed to create table via RPC, you may need to run this manually in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(50))
      console.log(createTableSQL)
      console.log('='.repeat(50))
    } else {
      console.log('✅ print_jobs table created successfully!')
    }
  } catch (error) {
    console.log('❌ Error creating table:', error.message)
    console.log('📋 Manual SQL for Supabase:')
    console.log(createTableSQL)
  }
}

async function createPrintJobLogsTable() {
  console.log('\n🔧 Creating print_job_logs table...')

  const createLogsTableSQL = `
    CREATE TABLE IF NOT EXISTS public.print_job_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      print_job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
      log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warning', 'error')),
      message TEXT NOT NULL,
      details JSONB,
      printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_print_job_logs_print_job_id ON print_job_logs(print_job_id);
    CREATE INDEX IF NOT EXISTS idx_print_job_logs_created_at ON print_job_logs(created_at DESC);
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createLogsTableSQL })

    if (error) {
      console.log('❌ Failed to create logs table. Manual SQL:')
      console.log(createLogsTableSQL)
    } else {
      console.log('✅ print_job_logs table created successfully!')
    }
  } catch (error) {
    console.log('❌ Error creating logs table:', error.message)
    console.log('📋 Manual SQL:', createLogsTableSQL)
  }
}

async function createPrintJobFunction() {
  console.log('\n🔧 Creating create_print_job function...')

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
      console.log('❌ Failed to create function. Manual SQL:')
      console.log(createFunctionSQL)
    } else {
      console.log('✅ create_print_job function created successfully!')
    }
  } catch (error) {
    console.log('❌ Error creating function:', error.message)
    console.log('📋 Manual SQL:', createFunctionSQL)
  }
}

async function fixPrintJobsTable() {
  console.log('\n🔧 Attempting to fix print_jobs table...')

  // Try to add missing columns
  const alterTableSQL = `
    ALTER TABLE print_jobs
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS printer_id UUID REFERENCES printers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS job_type TEXT CHECK (job_type IN ('receipt', 'kitchen', 'label', 'custom')),
    ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text/plain' CHECK (content_type IN ('text/plain', 'text/html', 'application/json')),
    ADD COLUMN IF NOT EXISTS payload TEXT,
    ADD COLUMN IF NOT EXISTS rendered_content TEXT,
    ADD COLUMN IF NOT EXISTS template_version TEXT,
    ADD COLUMN IF NOT EXISTS template_data JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS retry_delay_minutes INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS error_details JSONB,
    ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

    -- Add constraints if they don't exist
    ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_idempotency_key_key;
    ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_idempotency_key_key UNIQUE (idempotency_key);

    ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_job_type_check;
    ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_job_type_check CHECK (job_type IN ('receipt', 'kitchen', 'label', 'custom'));

    ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_content_type_check;
    ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_content_type_check CHECK (content_type IN ('text/plain', 'text/html', 'application/json'));

    ALTER TABLE print_jobs DROP CONSTRAINT IF EXISTS print_jobs_status_check;
    ALTER TABLE print_jobs ADD CONSTRAINT print_jobs_status_check CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: alterTableSQL })

    if (error) {
      console.log('❌ Failed to alter table. You may need to run this manually in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(50))
      console.log(alterTableSQL)
      console.log('='.repeat(50))
    } else {
      console.log('✅ print_jobs table fixed successfully!')
    }
  } catch (error) {
    console.log('❌ Error fixing table:', error.message)
    console.log('📋 Manual SQL for Supabase:')
    console.log(alterTableSQL)
  }
}

checkPrintJobsTable().catch(console.error)
