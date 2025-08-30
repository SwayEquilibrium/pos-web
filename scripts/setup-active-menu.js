#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wncxwhcscvqxkenllzsw.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3h3aGNzY3ZxeGtlbmxsenN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTE0MTksImV4cCI6MjA3MTYyNzQxOX0.LxLNnK7fJtSjqLJfK_ulebArNpp-EPd0P9vGJbg7fkI'

console.log('🍽️ Setting up Active Menu for Order Page...')
console.log('===========================================\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupActiveMenu() {
  try {
    console.log('1️⃣ Checking for existing active menucard...')

    // Check if there's already an active menucard
    const { data: existingActive, error: activeError } = await supabase
      .from('menucards')
      .select('*')
      .eq('active', true)
      .single()

    if (existingActive && !activeError) {
      console.log('✅ Found existing active menucard:', existingActive.name)
      console.log('   ID:', existingActive.id)
      await setupCategoriesForMenucard(existingActive.id)
      return
    }

    console.log('2️⃣ No active menucard found, creating default one...')

    // Create a default active menucard
    const { data: newMenucard, error: createError } = await supabase
      .from('menucards')
      .insert({
        name: 'Main Menu',
        description: 'Default active menu for ordering',
        active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create menucard:', createError.message)
      return
    }

    console.log('✅ Created active menucard:', newMenucard.name)
    console.log('   ID:', newMenucard.id)

    await setupCategoriesForMenucard(newMenucard.id)

  } catch (error) {
    console.error('❌ Error setting up active menu:', error.message)
  }
}

async function setupCategoriesForMenucard(menucardId) {
  console.log('\n3️⃣ Setting up categories for menucard...')

  try {
    // Get all active categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name')

    if (catError) {
      console.error('❌ Failed to fetch categories:', catError.message)
      return
    }

    if (!categories || categories.length === 0) {
      console.log('⚠️ No active categories found. Please create some categories first.')
      return
    }

    console.log(`📂 Found ${categories.length} active categories:`)
    categories.forEach(cat => console.log(`   - ${cat.name} (ID: ${cat.id})`))

    // Check existing links
    const { data: existingLinks, error: linksError } = await supabase
      .from('menucard_categories')
      .select('*')
      .eq('menucard_id', menucardId)

    if (linksError) {
      console.error('❌ Failed to check existing links:', linksError.message)
      return
    }

    const existingCategoryIds = new Set(existingLinks?.map(link => link.category_id) || [])

    // Link categories that aren't already linked
    const categoriesToLink = categories.filter(cat => !existingCategoryIds.has(cat.id))

    if (categoriesToLink.length === 0) {
      console.log('✅ All categories are already linked to the active menucard!')
      return
    }

    console.log(`\n🔗 Linking ${categoriesToLink.length} categories to active menucard...`)

    // Prepare links data
    const linksData = categoriesToLink.map((category, index) => ({
      menucard_id: menucardId,
      category_id: category.id,
      sort_index: index + (existingLinks?.length || 0)
    }))

    // Insert links
    const { data: insertedLinks, error: insertError } = await supabase
      .from('menucard_categories')
      .insert(linksData)
      .select()

    if (insertError) {
      console.error('❌ Failed to link categories:', insertError.message)
      return
    }

    console.log('✅ Successfully linked categories!')
    console.log(`   Linked ${insertedLinks?.length || 0} categories to active menucard`)

    // Summary
    const totalLinked = (existingLinks?.length || 0) + (insertedLinks?.length || 0)
    console.log(`\n📊 Summary:`)
    console.log(`   Active Menucard: ${menucardId}`)
    console.log(`   Total Categories: ${categories.length}`)
    console.log(`   Linked Categories: ${totalLinked}`)
    console.log(`   Newly Linked: ${insertedLinks?.length || 0}`)

  } catch (error) {
    console.error('❌ Error setting up categories:', error.message)
  }
}

setupActiveMenu().catch(console.error)
