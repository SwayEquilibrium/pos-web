#!/usr/bin/env node

/**
 * Migration Script: Scattered Menu System → Unified Menu System
 * 
 * This script helps migrate from the old scattered menu system to the new unified system.
 * It provides step-by-step guidance and automated checks.
 */

const fs = require('fs')
const path = require('path')

// ================================================
// MIGRATION STEPS
// ================================================

const migrationSteps = [
  {
    step: 1,
    title: "Database Schema Migration",
    description: "Run the unified database schema migration",
    command: "psql -d your_database -f database/unified-menu-schema.sql",
    check: "Verify all tables exist with proper foreign keys",
    status: "pending"
  },
  {
    step: 2,
    title: "API Endpoints Deployment",
    description: "Deploy the new unified menu API endpoints",
    command: "Deploy /api/menu/... endpoints",
    check: "Test API endpoints are responding correctly",
    status: "pending"
  },
  {
    step: 3,
    title: "Hook Migration",
    description: "Update components to use unified hooks",
    command: "Replace old hook imports with unified ones",
    check: "Verify components are using unified data source",
    status: "pending"
  },
  {
    step: 4,
    title: "Order System Integration",
    description: "Update order system to use unified menu data",
    command: "Refactor order page to use useMenu
    check: "Verify orders load data from unified system",
    status: "pending"
  },
  {
    step: 5,
    title: "Testing & Validation",
    description: "Test the complete unified system",
    command: "Run comprehensive tests",
    check: "Verify all functionality works correctly",
    status: "pending"
  }
]

// ================================================
// FILE MIGRATION PATTERNS
// ================================================

const fileMigrationPatterns = [
  {
    pattern: /import.*useCategories.*from.*['"]@\/hooks\/menu\/useCategories['"]/g,
    replacement: "import { useCategories } from '@/hooks/useMenu
    description: "Replace useCategories import"
  },
  {
    pattern: /import.*useProductsByCategory.*from.*['"]@\/hooks\/menu\/useProducts['"]/g,
    replacement: "import { useProductsByCategory } from '@/hooks/useMenu
    description: "Replace useProductsByCategory import"
  },
  {
    pattern: /import.*useProducts.*from.*['"]@\/hooks\/menu\/useProducts['"]/g,
    replacement: "import { useProducts } from '@/hooks/useMenu
    description: "Replace useProducts import"
  },
  {
    pattern: /import.*useModifierGroups.*from.*['"]@\/hooks\/menu\/useModifierGroups['"]/g,
    replacement: "import { useModifiers } from '@/hooks/useMenu
    description: "Replace useModifierGroups import"
  }
]

const hookUsagePatterns = [
  {
    pattern: /useCategories\(\)/g,
    replacement: "useCategories()",
    description: "Replace useCategories() hook usage"
  },
  {
    pattern: /useProductsByCategory\(/g,
    replacement: "useProductsByCategory(",
    description: "Replace useProductsByCategory() hook usage"
  },
  {
    pattern: /useProducts\(\)/g,
    replacement: "useProducts()",
    description: "Replace useProducts() hook usage"
  },
  {
    pattern: /useModifierGroups\(/g,
    replacement: "useModifiers(",
    description: "Replace useModifierGroups() hook usage"
  }
]

// ================================================
// MIGRATION FUNCTIONS
// ================================================

function displayMigrationPlan() {
  console.log('\n🍽️  UNIFIED MENU SYSTEM MIGRATION PLAN\n')
  console.log('This migration consolidates all menu systems into a single, unified structure.\n')
  
  migrationSteps.forEach(step => {
    console.log(`${step.step}. ${step.title}`)
    console.log(`   ${step.description}`)
    console.log(`   Command: ${step.command}`)
    console.log(`   Check: ${step.check}`)
    console.log(`   Status: ${step.status}\n`)
  })
}

function scanForOldHookUsage(directory = '.') {
  console.log('🔍 Scanning for old hook usage...\n')
  
  const files = scanDirectory(directory, ['.tsx', '.ts', '.js', '.jsx'])
  const results = []
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8')
    const issues = []
    
    // Check for old hook imports
    fileMigrationPatterns.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        issues.push({
          type: 'import',
          pattern: pattern.description,
          fix: pattern.replacement
        })
      }
    })
    
    // Check for old hook usage
    hookUsagePatterns.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        issues.push({
          type: 'usage',
          pattern: pattern.description,
          fix: pattern.replacement
        })
      }
    })
    
    if (issues.length > 0) {
      results.push({
        file,
        issues
      })
    }
  })
  
  return results
}

function scanDirectory(dir, extensions) {
  const files = []
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git
        if (!['node_modules', '.git', '.next', 'dist'].includes(item)) {
          scan(fullPath)
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath)
      }
    })
  }
  
  scan(dir)
  return files
}

function displayMigrationResults(results) {
  if (results.length === 0) {
    console.log('✅ No migration issues found! Your codebase is already using the unified system.\n')
    return
  }
  
  console.log(`\n⚠️  Found ${results.length} files that need migration:\n`)
  
  results.forEach(result => {
    console.log(`📁 ${result.file}`)
    result.issues.forEach(issue => {
      console.log(`   - ${issue.type.toUpperCase()}: ${issue.pattern}`)
      console.log(`     Fix: ${issue.fix}`)
    })
    console.log('')
  })
  
  console.log('💡 To automatically fix these issues, run:')
  console.log('   npm run migrate:unified-menu\n')
}

function generateMigrationScript(results) {
  const scriptContent = `#!/usr/bin/env node

/**
 * Auto-generated migration script for Unified Menu System
 * Generated on: ${new Date().toISOString()}
 */

const fs = require('fs')
const path = require('path')

// Migration patterns
const patterns = ${JSON.stringify(fileMigrationPatterns, null, 2)}

const hookPatterns = ${JSON.stringify(hookUsagePatterns, null, 2)}

// Files to migrate
const filesToMigrate = ${JSON.stringify(results.map(r => r.file), null, 2)}

function migrateFile(filePath) {
  console.log(\`Migrating \${filePath}...\`)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let changed = false
    
    // Apply import pattern replacements
    patterns.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        content = content.replace(pattern.pattern, pattern.replacement)
        changed = true
        console.log(\`  - Fixed: \${pattern.description}\`)
      }
    })
    
    // Apply hook usage pattern replacements
    hookPatterns.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        content = content.replace(pattern.pattern, pattern.replacement)
        changed = true
        console.log(\`  - Fixed: \${pattern.description}\`)
      }
    })
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(\`  ✅ \${filePath} migrated successfully\`)
    } else {
      console.log(\`  ℹ️  \${filePath} - no changes needed\`)
    }
    
  } catch (error) {
    console.error(\`  ❌ Error migrating \${filePath}:\`, error.message)
  }
}

// Run migration
console.log('🚀 Starting Unified Menu System migration...\\n')

filesToMigrate.forEach(migrateFile)

console.log('\\n🎉 Migration completed!')
console.log('\\nNext steps:')
console.log('1. Test your application')
console.log('2. Verify all menu functionality works')
console.log('3. Check that orders load from unified system')
console.log('4. Remove old menu system files if no longer needed')
`

  fs.writeFileSync('scripts/auto-migrate-unified-menu.js', scriptContent)
  console.log('📝 Auto-migration script generated: scripts/auto-migrate-unified-menu.js\n')
}

// ================================================
// MAIN EXECUTION
// ================================================

function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node migrate-to-unified-menu.js [options]

Options:
  --help, -h     Show this help message
  --scan         Scan for migration issues
  --generate     Generate auto-migration script
  --plan         Show migration plan

Examples:
  node migrate-to-unified-menu.js --plan
  node migrate-to-unified-menu.js --scan
  node migrate-to-unified-menu.js --generate
`)
    return
  }
  
  if (args.includes('--plan')) {
    displayMigrationPlan()
    return
  }
  
  if (args.includes('--scan')) {
    const results = scanForOldHookUsage()
    displayMigrationResults(results)
    
    if (args.includes('--generate')) {
      generateMigrationScript(results)
    }
    return
  }
  
  if (args.includes('--generate')) {
    const results = scanForOldHookUsage()
    generateMigrationScript(results)
    return
  }
  
  // Default: show migration plan and scan
  displayMigrationPlan()
  const results = scanForOldHookUsage()
  displayMigrationResults(results)
  
  console.log('💡 Run with --scan to see detailed migration issues')
  console.log('💡 Run with --generate to create auto-migration script')
}

// Run the migration script
if (require.main === module) {
  main()
}

module.exports = {
  migrationSteps,
  fileMigrationPatterns,
  hookUsagePatterns,
  scanForOldHookUsage,
  displayMigrationResults
}
