'use client'

import { useState } from 'react'
import { checkDatabaseConnection, getProducts, diagnoseDatabaseState } from '@/lib/repos/menu.repo'
import { createClient } from '@supabase/supabase-js' 

export default function DatabaseDebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [productsTestStatus, setProductsTestStatus] = useState<string>('')
  const [tableStructure, setTableStructure] = useState<string>('')
  const [directQueryStatus, setDirectQueryStatus] = useState<string>('')
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null)
  const [printerStatus, setPrinterStatus] = useState<string>('')

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing...')
      const result = await checkDatabaseConnection()
      if (result.connected) {
        setConnectionStatus('✅ Connected successfully')
        setError('')
      } else {
        setConnectionStatus('❌ Connection failed')
        setError(result.error || 'Unknown error')
      }
    } catch (err) {
      setConnectionStatus('❌ Connection failed')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const testGetProducts = async () => {
    try {
      setProductsTestStatus('Testing...')
      const products = await getProducts()
      setProductsTestStatus(`✅ Success! Found ${products.length} products`)
      // setProductsError(null) // This state variable was removed, so this line is removed.
    } catch (err) {
      setProductsTestStatus('❌ Failed')
      // setProductsError(err instanceof Error ? err.message : 'Unknown error') // This state variable was removed, so this line is removed.
    }
  }

  const checkTableStructure = async () => {
    try {
      setTableStructure('Checking...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1)
      
      if (error) {
        setTableStructure(`❌ Error: ${error.message}`)
        return
      }
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        setTableStructure(`✅ Found columns: ${columns.join(', ')}`)
      } else {
        setTableStructure('✅ Table exists but no data')
      }
    } catch (err) {
      setTableStructure(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const checkProductsColumns = async () => {
    try {
      // setProductsColumns('Checking...') // This state variable was removed, so this line is removed.
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Get column information from information_schema
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'products' })
      
      if (error) {
        // Fallback: try to get column info another way
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .limit(1)
        
        if (fallbackError) {
          // setProductsColumns(`❌ Error: ${fallbackError.message}`) // This state variable was removed, so this line is removed.
          return
        }
        
        if (fallbackData && fallbackData.length > 0) {
          const columns = Object.keys(fallbackData[0])
          // setProductsColumns(`✅ Found columns: ${columns.join(', ')}`) // This state variable was removed, so this line is removed.
        } else {
          // setProductsColumns('✅ Table exists but no data') // This state variable was removed, so this line is removed.
        }
      } else {
        // setProductsColumns(`✅ Schema columns: ${data.map((col: any) => col.column_name).join(', ')}`) // This state variable was removed, so this line is removed.
      }
    } catch (err) {
      // setProductsColumns(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`) // This state variable was removed, so this line is removed.
    }
  }

  const testDirectQuery = async () => {
    try {
      setDirectQueryStatus('Testing...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Test modifiers table specifically
      const { data, error } = await supabase
        .from('modifiers')
        .select('id, name')
        .limit(1)
      
      if (error) {
        console.error('Modifiers table test error:', error)
        setDirectQueryStatus(`❌ Modifiers table error: ${error.message}`)
      } else {
        console.log('Modifiers table test result:', data)
        setDirectQueryStatus(`✅ Modifiers table works! Found ${data?.length || 0} records`)
      }
    } catch (err) {
      console.error('Modifiers table test error:', err)
      setDirectQueryStatus(`❌ Modifiers table test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const testModifierGroupsTable = async () => {
    try {
      setDirectQueryStatus('Testing modifier groups...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Test modifier_groups table specifically
      const { data, error } = await supabase
        .from('modifier_groups')
        .select('id, name')
        .limit(1)
      
      if (error) {
        console.error('Modifier groups table test error:', error)
        setDirectQueryStatus(`❌ Modifier groups table error: ${error.message}`)
      } else {
        console.log('Modifier groups table test result:', data)
        setDirectQueryStatus(`✅ Modifier groups table works! Found ${data?.length || 0} records`)
      }
    } catch (err) {
      console.error('Modifier groups table test error:', err)
      setDirectQueryStatus(`❌ Modifier groups table test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const checkPrinterTables = async () => {
    try {
      setPrinterStatus('Checking printer tables...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Check if printers table exists (using existing database structure)
      const { data: printersData, error: printersError } = await supabase
        .from('printers')
        .select('id, name, display_name, auto_print_on_order, is_active')
        .limit(10)
      
      if (printersError) {
        setPrinterStatus(`❌ Printers table error: ${printersError.message}`)
        return
      }
      
      // Also check for ALL printers (including inactive ones)
      const { data: allPrintersData, error: allPrintersError } = await supabase
        .from('printers')
        .select('id, name, is_active')
        .limit(20)
      
      if (allPrintersData && allPrintersData.length > 0) {
        const activeCount = allPrintersData.filter(p => p.is_active).length
        const inactiveCount = allPrintersData.filter(p => !p.is_active).length
        const printerInfo = printersData?.map(p => `${p.name} (${p.auto_print_on_order ? 'auto-print' : 'manual'}, ${p.is_active ? 'active' : 'inactive'})`).join(', ') || 'none active'
        
        setPrinterStatus(`✅ Found ${allPrintersData.length} total printers (${activeCount} active, ${inactiveCount} inactive). Active: ${printerInfo}`)
      } else {
        setPrinterStatus('✅ Printers table exists but completely empty (no printers at all)')
      }
      
      // Check if printer_room_assignments table exists
      const { data: roomAssignmentsData, error: roomAssignmentsError } = await supabase
        .from('printer_room_assignments')
        .select('id')
        .limit(1)
      
      if (roomAssignmentsError) {
        setPrinterStatus(prev => prev + ` | ❌ Printer room assignments error: ${roomAssignmentsError.message}`)
      } else {
        setPrinterStatus(prev => prev + ` | ✅ Printer room assignments table exists`)
      }
      
      // Check if printer_category_assignments table exists
      const { data: categoryAssignmentsData, error: categoryAssignmentsError } = await supabase
        .from('printer_category_assignments')
        .select('id')
        .limit(1)
      
      if (categoryAssignmentsError) {
        setPrinterStatus(prev => prev + ` | ❌ Printer category assignments error: ${categoryAssignmentsError.message}`)
      } else {
        setPrinterStatus(prev => prev + ` | ✅ Printer category assignments table exists`)
      }
      
      // Check if product_types table exists
      const { data: productTypesData, error: productTypesError } = await supabase
        .from('product_types')
        .select('id')
        .limit(1)
      
      if (productTypesError) {
        setPrinterStatus(prev => prev + ` | ❌ Product types table error: ${productTypesError.message}`)
      } else {
        setPrinterStatus(prev => prev + ` | ✅ Product types table exists`)
      }
      
    } catch (err) {
      setPrinterStatus(`❌ Printer check failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const checkPrintJobs = async () => {
    try {
      setPrinterStatus('Checking print jobs...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Check print jobs table
      const { data: printJobsData, error: printJobsError } = await supabase
        .from('print_jobs')
        .select('id, printer_id, status, created_at, payload')
        .limit(20)
      
      if (printJobsError) {
        setPrinterStatus(prev => prev + ` | ❌ Print jobs table error: ${printJobsError.message}`)
        return
      }
      
      if (printJobsData && printJobsData.length > 0) {
        const pendingCount = printJobsData.filter(job => job.status === 'PENDING' || job.status === 'QUEUED').length
        const failedCount = printJobsData.filter(job => job.status === 'FAILED').length
        const completedCount = printJobsData.filter(job => job.status === 'PRINTED').length
        
        setPrinterStatus(prev => prev + ` | 📄 Print Jobs: ${printJobsData.length} total (${pendingCount} pending, ${failedCount} failed, ${completedCount} completed)`)
      } else {
        setPrinterStatus(prev => prev + ` | 📄 Print Jobs: No jobs found`)
      }
      
    } catch (err) {
      setPrinterStatus(prev => prev + ` | ❌ Print jobs check failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const clearPendingPrintJobs = async () => {
    try {
      setPrinterStatus('Clearing pending print jobs...')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Delete all pending/queued print jobs
      const { error: deleteError } = await supabase
        .from('print_jobs')
        .delete()
        .in('status', ['PENDING', 'QUEUED', 'FAILED'])
      
      if (deleteError) {
        setPrinterStatus(prev => prev + ` | ❌ Failed to clear jobs: ${deleteError.message}`)
        return
      }
      
      setPrinterStatus(prev => prev + ` | ✅ Cleared all pending/failed print jobs`)
      
      // Refresh the print jobs count
      await checkPrintJobs()
      
    } catch (err) {
      setPrinterStatus(prev => prev + ` | ❌ Clear jobs failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const runDiagnosis = async () => {
    try {
      setDiagnosisResult('Running diagnosis...')
      const result = await diagnoseDatabaseState()
      setDiagnosisResult(result)
      console.log('=== Database Diagnosis ===', result)
    } catch (err) {
      setDiagnosisResult(`Diagnosis failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('=== Diagnosis Error ===', err)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Debug & Diagnosis</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Connection Test</h2>
          <button onClick={testConnection} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Test Database Connection
          </button>
          <div className="mt-4"><strong>Status:</strong> {connectionStatus}</div>
          {error && (<div className="mt-4 p-3 bg-red-100 border border-red-300 rounded"><strong>Error:</strong> {error}</div>)}
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Table Structure Check</h2>
          <div className="space-y-2">
            <button onClick={checkTableStructure} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mr-2">
              Check Products Table Structure
            </button>
            <button onClick={checkProductsColumns} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2">
              Check Products Columns
            </button>
            <button onClick={testDirectQuery} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 mr-2">
              Test Modifiers Table
            </button>
            <button onClick={testModifierGroupsTable} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">
              Test Modifier Groups Table
            </button>
            <button onClick={checkPrinterTables} className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600">
              Check Printer Tables
            </button>
            <button onClick={checkPrintJobs} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Check Print Jobs
            </button>
            <button onClick={clearPendingPrintJobs} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Clear Pending Jobs
            </button>
          </div>
          <div className="mt-4"><strong>Structure:</strong> {tableStructure}</div>
          {/* <div className="mt-2"><strong>Columns:</strong> {productsColumns}</div> */}
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">getProducts Function Test</h2>
          <button onClick={testGetProducts} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Test getProducts Function
          </button>
          <div className="mt-4"><strong>Status:</strong> {productsTestStatus}</div>
          {/* {productsError && (<div className="mt-4 p-3 bg-red-100 border border-red-300 rounded"><strong>Error:</strong> {productsError}</div>)} */}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Test Database Connection" above</li>
            <li>Click "Check Products Columns" to see what columns exist</li>
            <li>Click "Test getProducts Function" to see if it works now</li>
            <li>Based on the results, we'll know what to add</li>
          </ol>
        </div>

        <div className="mb-6">
          <button
            onClick={runDiagnosis}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mr-4"
          >
            🔍 Run Full Database Diagnosis
          </button>
        </div>

        {/* Diagnosis Results */}
        {diagnosisResult && (
          <div className="mb-6 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">🔍 Database Diagnosis Results</h3>
            <pre className="text-sm overflow-auto bg-white p-3 rounded border">
              {typeof diagnosisResult === 'string' 
                ? diagnosisResult 
                : JSON.stringify(diagnosisResult, null, 2)
              }
            </pre>
          </div>
        )}

        {/* Printer Status */}
        {printerStatus && (
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Printer Tables Status</h2>
            <p>{printerStatus}</p>
          </div>
        )}
      </div>
    </div>
  )
}
