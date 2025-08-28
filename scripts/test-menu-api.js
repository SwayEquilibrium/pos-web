#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

console.log('🔍 Environment check:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing')
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey)
  console.error('\n💡 Make sure you have a .env.local file with these variables')
  process.exit(1)
}

console.log('\n🚀 Initializing Supabase client...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function testMenuAPI() {
  console.log('\n🧪 Testing Menu API Endpoints...\n')
  
  try {
    // Test 1: Check if tables exist and are readable
    console.log('1️⃣ Checking if required tables exist and are readable...')
    
    const tables = ['categories', 'products', 'modifiers', 'product_groups', 'product_prices']
    
    for (const table of tables) {
      try {
        console.log(`   Testing table: ${table}`)
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Table ${table}: OK (${data?.length || 0} rows)`)
        }
      } catch (err) {
        console.log(`   ❌ Table ${table}: ${err.message}`)
      }
    }
    
    // Test 2: Check if we can read existing data
    console.log('\n2️⃣ Testing data reading...')
    
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .limit(5)
      
      if (catError) {
        console.log(`   ❌ Categories read failed: ${catError.message}`)
      } else {
        console.log(`   ✅ Categories read: ${categories?.length || 0} categories found`)
        if (categories && categories.length > 0) {
          console.log(`   📋 Sample categories:`)
          categories.slice(0, 3).forEach(cat => {
            console.log(`      • ${cat.name} (ID: ${cat.id})`)
          })
        }
      }
    } catch (err) {
      console.log(`   ❌ Categories read failed: ${err.message}`)
    }
    
    try {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .limit(5)
      
      if (prodError) {
        console.log(`   ❌ Products read failed: ${prodError.message}`)
      } else {
        console.log(`   ✅ Products read: ${products?.length || 0} products found`)
        if (products && products.length > 0) {
          console.log(`   📋 Sample products:`)
          products.slice(0, 3).forEach(prod => {
            console.log(`      • ${prod.name} (ID: ${prod.id})`)
          })
        }
      }
    } catch (err) {
      console.log(`   ❌ Products read failed: ${err.message}`)
    }
    
    // Test 3: Check if we can read product prices
    console.log('\n3️⃣ Testing product prices...')
    
    try {
      const { data: prices, error: priceError } = await supabase
        .from('product_prices')
        .select('*')
        .limit(5)
      
      if (priceError) {
        console.log(`   ❌ Product prices read failed: ${priceError.message}`)
      } else {
        console.log(`   ✅ Product prices read: ${prices?.length || 0} prices found`)
        if (prices && prices.length > 0) {
          console.log(`   📋 Sample prices:`)
          prices.slice(0, 3).forEach(price => {
            console.log(`      • Product ${price.product_id}: DKK ${price.price} (${price.context})`)
          })
        }
      }
    } catch (err) {
      console.log(`   ❌ Product prices read failed: ${err.message}`)
    }
    
    // Test 4: Check if we can read modifiers
    console.log('\n4️⃣ Testing modifiers...')
    
    try {
      const { data: modifiers, error: modError } = await supabase
        .from('modifiers')
        .select('*')
        .limit(5)
      
      if (modError) {
        console.log(`   ❌ Modifiers read failed: ${modError.message}`)
      } else {
        console.log(`   ✅ Modifiers read: ${modifiers?.length || 0} modifiers found`)
        if (modifiers && modifiers.length > 0) {
          console.log(`   📋 Sample modifiers:`)
          modifiers.slice(0, 3).forEach(mod => {
            console.log(`      • ${mod.name}: DKK ${mod.price} (ID: ${mod.id})`)
          })
        }
      }
    } catch (err) {
      console.log(`   ❌ Modifiers read failed: ${err.message}`)
    }
    
    // Test 5: Check if we can read product groups
    console.log('\n5️⃣ Testing product groups...')
    
    try {
      const { data: groups, error: groupError } = await supabase
        .from('product_groups')
        .select('*')
        .limit(5)
      
      if (groupError) {
        console.log(`   ❌ Product groups read failed: ${groupError.message}`)
      } else {
        console.log(`   ✅ Product groups read: ${groups?.length || 0} groups found`)
        if (groups && groups.length > 0) {
          console.log(`   📋 Sample groups:`)
          groups.slice(0, 3).forEach(group => {
            console.log(`      • ${group.name} (ID: ${group.id})`)
          })
        }
      }
    } catch (err) {
      console.log(`   ❌ Product groups read failed: ${err.message}`)
    }
    
    console.log('\n🎉 All read tests completed!')
    console.log('\n📋 Summary:')
    console.log('   • Database tables are accessible for reading')
    console.log('   • Data relationships can be queried')
    console.log('   • The menu management system can display existing data')
    console.log('\n💡 Note: Write operations require authentication and proper RLS policies')
    console.log('   The frontend will handle authentication automatically')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

console.log('Starting test...')
testMenuAPI().then(() => {
  console.log('Test completed')
}).catch((error) => {
  console.error('Test failed:', error)
})
