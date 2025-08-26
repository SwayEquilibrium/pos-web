-- URGENT: Fix tenant isolation in RLS policies
-- Current policies use USING (true) which bypasses tenant security

-- Fix orders table
DROP POLICY IF EXISTS "Users can manage orders" ON public.orders;
CREATE POLICY "Users can manage orders" ON public.orders FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() AND up.company_id = (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  )
);

-- Fix payment_transactions table  
DROP POLICY IF EXISTS "Users can manage payments" ON public.payment_transactions;
CREATE POLICY "Users can manage payments" ON public.payment_transactions FOR ALL TO authenticated
USING (
  order_id IN (
    SELECT o.id FROM public.orders o
    JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE EXISTS (
      SELECT 1 FROM public.user_profiles up2 
      WHERE up2.id = auth.uid() AND up2.company_id IS NOT NULL
    )
  )
);

-- Fix gift_cards table
DROP POLICY IF EXISTS "Users can manage gift cards" ON public.gift_cards;  
CREATE POLICY "Users can manage gift cards" ON public.gift_cards FOR ALL TO authenticated
USING (
  created_by IN (
    SELECT up.id FROM public.user_profiles up
    WHERE up.company_id = (
      SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
    )
  )
);

-- Add company_id columns where missing (run after adding missing tables)
-- ALTER TABLE public.orders ADD COLUMN company_id UUID REFERENCES public.companies(id);
-- ALTER TABLE public.gift_cards ADD COLUMN company_id UUID REFERENCES public.companies(id);
