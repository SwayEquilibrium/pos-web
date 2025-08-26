-- Ensure required payment types exist in the database
-- Run this in Supabase SQL Editor

-- Insert basic payment types if they don't exist
INSERT INTO public.payment_types (code, name, description, active, sort_order) 
VALUES 
  ('CASH', 'Cash', 'Cash payment', true, 1),
  ('CARD', 'Card', 'Credit/Debit card payment', true, 2),
  ('MOBILE_PAY', 'Mobile Pay', 'Mobile payment (MobilePay, Apple Pay, etc.)', true, 3),
  ('GIFT_CARD', 'Gift Card', 'Gift card payment', true, 4)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order;

-- Verify the payment types were created
SELECT code, name, description, active, sort_order 
FROM public.payment_types 
ORDER BY sort_order;
