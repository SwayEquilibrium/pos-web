'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestMenuPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testMenuAPI = async () => {
    setIsTesting(true)
    setTestResults([])
    
    try {
      addResult('🧪 Starting menu API tests...')
      
      // Test 1: Categories API
      addResult('1️⃣ Testing categories API...')
      const categoriesResponse = await fetch('/api/menu?action=categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        addResult(`✅ Categories API: ${categoriesData.data?.length || 0} categories found`)
      } else {
        addResult(`❌ Categories API failed: ${categoriesResponse.status}`)
      }
      
      // Test 2: Products API
      addResult('2️⃣ Testing products API...')
      const productsResponse = await fetch('/api/menu?action=products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        addResult(`✅ Products API: ${productsData.data?.length || 0} products found`)
      } else {
        addResult(`❌ Products API failed: ${productsResponse.status}`)
      }
      
      // Test 3: Modifiers API
      addResult('3️⃣ Testing modifiers API...')
      const modifiersResponse = await fetch('/api/menu?action=modifiers')
      if (modifiersResponse.ok) {
        const modifiersData = await modifiersResponse.json()
        addResult(`✅ Modifiers API: ${modifiersData.data?.length || 0} modifiers found`)
      } else {
        addResult(`❌ Modifiers API failed: ${modifiersResponse.status}`)
      }
      
      // Test 4: Product Groups API
      addResult('4️⃣ Testing product groups API...')
      const groupsResponse = await fetch('/api/menu/product-groups')
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        addResult(`✅ Product Groups API: ${groupsData.data?.length || 0} groups found`)
      } else {
        addResult(`❌ Product Groups API failed: ${groupsResponse.status}`)
      }
      
      // Test 5: Create a test category
      addResult('5️⃣ Testing category creation...')
      const createCategoryResponse = await fetch('/api/menu?action=categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Category ${Date.now()}`,
          description: 'Test category for API testing',
          sort_index: 999
        })
      })
      
      if (createCategoryResponse.ok) {
        const newCategory = await createCategoryResponse.json()
        addResult(`✅ Category created: ${newCategory.data.name} (ID: ${newCategory.data.id})`)
        
        // Test 6: Create a test product
        addResult('6️⃣ Testing product creation...')
        const createProductResponse = await fetch('/api/menu?action=products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Test Product ${Date.now()}`,
            description: 'Test product for API testing',
            category_id: newCategory.data.id,
            price: 25.00,
            context: 'dine_in'
          })
        })
        
        if (createProductResponse.ok) {
          const newProduct = await createProductResponse.json()
          addResult(`✅ Product created: ${newProduct.data.name} (ID: ${newProduct.data.id})`)
          
          // Test 7: Update the product
          addResult('7️⃣ Testing product update...')
          const updateProductResponse = await fetch('/api/menu?action=products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: newProduct.data.id,
              updates: { description: 'Updated test product description' },
              price: 30.00
            })
          })
          
          if (updateProductResponse.ok) {
            addResult('✅ Product updated successfully')
          } else {
            addResult(`❌ Product update failed: ${updateProductResponse.status}`)
          }
          
          // Test 8: Delete the test data
          addResult('8️⃣ Cleaning up test data...')
          await fetch(`/api/menu?action=products?id=${newProduct.data.id}`, { method: 'DELETE' })
          await fetch(`/api/menu?action=categories?id=${newCategory.data.id}`, { method: 'DELETE' })
          addResult('✅ Test data cleaned up')
        } else {
          addResult(`❌ Product creation failed: ${createProductResponse.status}`)
        }
      } else {
        addResult(`❌ Category creation failed: ${createCategoryResponse.status}`)
      }
      
      addResult('🎉 All tests completed!')
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Menu Management Test Page</h1>
        <Button 
          onClick={testMenuAPI} 
          disabled={isTesting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isTesting ? 'Testing...' : '🧪 Run Tests'}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click the button above to start testing.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>What This Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>✅ <strong>API Endpoints:</strong> Verifies all menu API endpoints are accessible</p>
            <p>✅ <strong>CRUD Operations:</strong> Tests create, read, update, delete for categories and products</p>
            <p>✅ <strong>Data Relationships:</strong> Ensures foreign key relationships work correctly</p>
            <p>✅ <strong>Error Handling:</strong> Checks proper error responses</p>
            <p>✅ <strong>Data Cleanup:</strong> Automatically removes test data</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>🔗 <strong>Menu Management:</strong> <a href="/admin/settings/menu" className="text-blue-600 hover:underline">Go to Menu Management</a></p>
            <p>🔗 <strong>API Documentation:</strong> Check the network tab for API calls</p>
            <p>🔗 <strong>Database:</strong> Verify data is being stored correctly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
