# 🚨 Quick Fix: Menu Error

## ❌ **Error Message**
```
Categories table not found. Please run the database setup script: database/simple-menu-setup.sql
```

## ✅ **Quick Solution (2 minutes)**

### **Option 1: Use the setup script**
```bash
npm run setup-db
```
This will show you exactly what SQL to run.

### **Option 2: Manual setup**
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy this file**: `database/simple-menu-setup.sql`
3. **Paste and run** in SQL Editor
4. **Refresh** your menu page

## 🔍 **What This Fixes**
- ✅ Creates `categories` table
- ✅ Creates `products` table  
- ✅ Adds sample data
- ✅ Sets up proper indexes
- ✅ Enables row-level security

## 📋 **Tables Created**
- **categories** - Menu categories (Food, Drinks, etc.)
- **products** - Menu items with prices
- **Indexes** - For fast searching
- **Sample data** - Test categories and products

## 🎯 **After Running**
1. **Menu page** will load without errors
2. **Categories** will be visible
3. **Products** can be added
4. **Menu editor** will work

## 🆘 **Still Having Issues?**
- Check `DATABASE_SETUP_GUIDE.md` for detailed steps
- Verify your Supabase connection in `.env.local`
- Ensure you have admin access to your Supabase project

---
**Time to fix**: ~2 minutes  
**Difficulty**: Easy (copy-paste SQL)
