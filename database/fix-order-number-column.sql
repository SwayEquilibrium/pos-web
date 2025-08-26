-- Fix missing order_number column in orders table
-- Run this in Supabase SQL Editor

-- Add order_number column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN order_number VARCHAR(50);
        
        RAISE NOTICE 'Added order_number column to orders table';
    ELSE
        RAISE NOTICE 'Order_number column already exists in orders table';
    END IF;
END $$;

-- Generate order numbers for existing orders that don't have them
WITH numbered_orders AS (
    SELECT 
        id,
        'ORD-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') as new_order_number
    FROM public.orders 
    WHERE order_number IS NULL
)
UPDATE public.orders 
SET order_number = numbered_orders.new_order_number
FROM numbered_orders
WHERE orders.id = numbered_orders.id;

-- Create a function to generate order numbers for new orders
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS VARCHAR(50) AS $$
DECLARE
    today_date TEXT;
    next_number INTEGER;
    order_number VARCHAR(50);
BEGIN
    -- Get today's date in YYYYMMDD format
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the next number for today
    SELECT COALESCE(MAX(CAST(RIGHT(order_number, 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders 
    WHERE order_number LIKE 'ORD-' || today_date || '-%';
    
    -- Generate the order number
    order_number := 'ORD-' || today_date || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers for new orders
CREATE OR REPLACE FUNCTION set_order_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;
