# Database Setup Guide

This guide will help you set up the complete database schema for the POS system.

## Quick Setup

The payment system and customer groups are currently using fallback data because the database tables don't exist yet. To enable full functionality, you need to run the database setup scripts.

## Required Tables

The following tables need to be created in your Supabase database:

### Payment System
- `payment_types` - Available payment methods
- `payment_transactions` - Payment records with unique IDs
- `payment_splits` - Split payment details
- `refunds` - Refund tracking

### Customer Management
- `customer_groups` - Customer discount groups
- `customer_group_members` - Group members
- `customer_group_purchases` - Purchase tracking

### Gift Cards
- `gift_cards` - Gift card management
- `gift_card_transactions` - Gift card usage tracking

## Setup Scripts

Run these SQL scripts in your Supabase SQL editor in order:

### 1. Payment System
```sql
-- Run: database/payment-system-schema.sql
```

### 2. Gift Cards & Customer Groups
```sql
-- Run: database/gift-cards-and-customer-groups-schema.sql
```

### 3. Customer Group Analytics
```sql
-- Run: database/customer-group-analytics-schema.sql
```

## Current Fallback System

Until you set up the database, the system uses these defaults:

### Payment Types
- **Cash** - No fees, no reference required
- **Credit/Debit Card** - 1.75% fee, requires terminal reference
- **MobilePay** - 1.0% fee, requires transaction ID
- **Gift Card** - No fees, requires gift card code

### Customer Groups
- **VIP Customers** - 10% discount
- **Staff Discount** - 15% discount  
- **Business Partners** - 5% discount

### Demo Gift Card
- **Code**: `GC-2024-ABCD1234-EFGH5678`
- **Balance**: 150.00 kr (from 200.00 kr original)

## After Database Setup

Once you run the database scripts:

1. **Payment Methods**: Go to Admin → System → Payment Methods to manage payment types
2. **Customer Groups**: Go to Admin → Business → Customer Groups to manage discounts
3. **Gift Cards**: Full gift card system will be available

## Testing

You can test the payment system right now with the fallback data:

1. Navigate to any order page
2. Click "Pay" to open the payment modal
3. Try different payment methods
4. Test the demo gift card code
5. Select different customer groups to see discounts

The system will work normally, but payments won't be saved to the database until you set up the tables.

## Need Help?

If you encounter any issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase connection
3. Ensure you have the necessary permissions to create tables
4. Run the SQL scripts one at a time and check for errors

## Database Schema Files

All required SQL files are in the `database/` folder:

- `payment-system-schema.sql` - Complete payment system
- `gift-cards-and-customer-groups-schema.sql` - Customer management and gift cards
- `customer-group-analytics-schema.sql` - Purchase history and analytics tracking
- `sales-tracking-system.sql` - Sales analytics (optional)

Run these in your Supabase SQL editor to set up the full system.
