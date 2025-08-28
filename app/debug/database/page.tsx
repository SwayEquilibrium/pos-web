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
      </div>
    </div>
  )
}
