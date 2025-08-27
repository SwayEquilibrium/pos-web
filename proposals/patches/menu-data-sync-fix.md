# Menu Data Synchronization Fix

## Problem
Products created in the menu editor (like "bøf" in "hovedret" category) are not showing up in the order screen when building orders. The menu editor and order screen should use the same database data but there's a disconnect.

## Root Cause Analysis
After investigation, the issue is:

1. ✅ Both menu editor and order screen use correct database hooks (`useCategories`, `useProductsByCategory`)
2. ✅ Products are created with `active: true` by default
3. ❌ **Potential database setup issues** causing data not to persist properly
4. ❌ **React Query cache invalidation issues** preventing UI updates

## Solution Components

### 1. Enhanced Error Handling & Debugging
Add better error handling and debugging to identify database issues.

### 2. Improved Cache Invalidation  
Ensure React Query properly refreshes data across all components.

### 3. Database Verification
Add checks to ensure database tables exist and are properly configured.

### 4. Data Consistency Verification
Add tools to verify data consistency between menu editor and order screen.

## Implementation Plan

1. Create enhanced catalog hooks with better error handling
2. Add database verification utilities
3. Implement improved cache management
4. Add debugging tools for data synchronization issues

## Files to Modify (Minimal Changes)
- Enhanced hooks in `/proposals/hooks/`
- Database verification utilities in `/proposals/utils/`
- Feature flag to enable enhanced data sync
