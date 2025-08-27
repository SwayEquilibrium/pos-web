#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Database Setup Helper');
console.log('========================\n');

const setupFile = path.join(__dirname, '../database/simple-menu-setup.sql');

if (!fs.existsSync(setupFile)) {
  console.error('❌ Setup file not found:', setupFile);
  process.exit(1);
}

console.log('📋 Database setup required for menu system');
console.log('The following tables need to be created:');
console.log('  - categories');
console.log('  - products\n');

console.log('📖 Setup Instructions:');
console.log('1. Open your Supabase dashboard');
console.log('2. Go to SQL Editor in the left sidebar');
console.log('3. Click "New query"');
console.log('4. Copy and paste the SQL script below\n');

console.log('📄 SQL Script:');
console.log('===============================================');

try {
  const sqlContent = fs.readFileSync(setupFile, 'utf8');
  // Split content into lines and log each line separately to avoid formatting issues
  const lines = sqlContent.split('\n');
  lines.forEach(line => {
    console.log(line);
  });
} catch (error) {
  console.error('❌ Error reading setup file:', error.message);
  process.exit(1);
}

console.log('\n===============================================');
console.log('\n✅ After running the script:');
console.log('  - Refresh your menu page');
console.log('  - The error should be resolved');
console.log('  - You can start adding categories and products\n');

console.log('📚 For detailed instructions, see:');
console.log('  - DATABASE_SETUP_GUIDE.md');
console.log('  - SETUP-INSTRUCTIONS.md');
console.log('  - QUICK-FIX-MENU-ERROR.md\n');

console.log('🔧 Need help? Check the documentation files above.');
