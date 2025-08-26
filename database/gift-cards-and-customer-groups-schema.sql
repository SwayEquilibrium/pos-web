-- ================================================
-- GIFT CARDS AND CUSTOMER GROUPS SYSTEM
-- ================================================
-- Complete system for gift cards and customer group management

-- ================================================
-- GIFT CARDS SYSTEM
-- ================================================

-- Gift Cards Table
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- GC-YYYYMMDD-ABCD1234-EFGH5678
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    original_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    notes TEXT,
    
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT positive_original_amount CHECK (original_amount > 0),
    CONSTRAINT balance_not_greater_than_original CHECK (balance <= original_amount)
);

-- Gift Card Transactions Table
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issue', 'redeem', 'refund', 'expire')),
    amount DECIMAL(10,2) NOT NULL, -- Positive for issue/refund, negative for redeem
    balance_after DECIMAL(10,2) NOT NULL,
    order_id UUID, -- Reference to order if used for payment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    notes TEXT,
    
    CONSTRAINT positive_balance_after CHECK (balance_after >= 0)
);

-- ================================================
-- CUSTOMER GROUPS SYSTEM
-- ================================================

-- Customer Groups Table
CREATE TABLE IF NOT EXISTS public.customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00, -- Percentage discount (0-100)
    discount_amount DECIMAL(10,2) DEFAULT 0.00, -- Fixed amount discount
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    CONSTRAINT valid_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT positive_discount_amount CHECK (discount_amount >= 0)
);

-- Customer Group Members Table
CREATE TABLE IF NOT EXISTS public.customer_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_group_id UUID NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    member_since TIMESTAMPTZ DEFAULT NOW(),
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_purchase_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    
    CONSTRAINT positive_total_purchases CHECK (total_purchases >= 0),
    CONSTRAINT positive_total_spent CHECK (total_spent >= 0),
    UNIQUE(customer_group_id, customer_name)
);

-- Customer Group Purchases Table (for tracking and analytics)
CREATE TABLE IF NOT EXISTS public.customer_group_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_group_id UUID NOT NULL REFERENCES public.customer_groups(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    customer_name VARCHAR(200),
    original_amount DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_original_amount CHECK (original_amount > 0),
    CONSTRAINT positive_discount_applied CHECK (discount_applied >= 0),
    CONSTRAINT positive_final_amount CHECK (final_amount >= 0),
    CONSTRAINT discount_not_greater_than_original CHECK (discount_applied <= original_amount)
);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to update customer member statistics
CREATE OR REPLACE FUNCTION public.update_customer_member_stats(
    p_customer_group_id UUID,
    p_customer_name VARCHAR(200),
    p_purchase_amount DECIMAL(10,2)
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update member statistics
    INSERT INTO public.customer_group_members (
        customer_group_id,
        customer_name,
        total_purchases,
        total_spent,
        last_purchase_at
    ) VALUES (
        p_customer_group_id,
        p_customer_name,
        1,
        p_purchase_amount,
        NOW()
    )
    ON CONFLICT (customer_group_id, customer_name)
    DO UPDATE SET
        total_purchases = customer_group_members.total_purchases + 1,
        total_spent = customer_group_members.total_spent + p_purchase_amount,
        last_purchase_at = NOW();
END;
$$;

-- Function to expire gift cards
CREATE OR REPLACE FUNCTION public.expire_gift_cards()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_card RECORD;
BEGIN
    -- Find and expire cards that have passed their expiry date
    FOR v_card IN 
        SELECT id, code, balance
        FROM public.gift_cards
        WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    LOOP
        -- Update gift card status
        UPDATE public.gift_cards
        SET status = 'expired', updated_at = NOW()
        WHERE id = v_card.id;
        
        -- Record expiry transaction
        INSERT INTO public.gift_card_transactions (
            gift_card_id,
            transaction_type,
            amount,
            balance_after,
            notes
        ) VALUES (
            v_card.id,
            'expire',
            -v_card.balance,
            0,
            'Gift card expired automatically'
        );
        
        v_expired_count := v_expired_count + 1;
    END LOOP;
    
    RETURN v_expired_count;
END;
$$;

-- ================================================
-- VIEWS FOR REPORTING
-- ================================================

-- Gift Card Summary View
CREATE OR REPLACE VIEW public.gift_card_summary AS
SELECT 
    gc.id,
    gc.code,
    gc.balance,
    gc.original_amount,
    gc.status,
    gc.expires_at,
    gc.created_at,
    (gc.original_amount - gc.balance) as amount_used,
    CASE 
        WHEN gc.expires_at IS NOT NULL AND gc.expires_at < NOW() THEN true
        ELSE false
    END as is_expired,
    COUNT(gct.id) as transaction_count,
    MAX(gct.created_at) as last_transaction_date
FROM public.gift_cards gc
LEFT JOIN public.gift_card_transactions gct ON gc.id = gct.gift_card_id
GROUP BY gc.id, gc.code, gc.balance, gc.original_amount, gc.status, gc.expires_at, gc.created_at
ORDER BY gc.created_at DESC;

-- Customer Group Analytics View
CREATE OR REPLACE VIEW public.customer_group_analytics AS
SELECT 
    cg.id,
    cg.name,
    cg.discount_percentage,
    cg.discount_amount,
    cg.color,
    cg.active,
    COUNT(DISTINCT cgm.id) as member_count,
    COUNT(cgp.id) as total_purchases,
    COALESCE(SUM(cgp.original_amount), 0) as total_original_amount,
    COALESCE(SUM(cgp.discount_applied), 0) as total_discount_given,
    COALESCE(SUM(cgp.final_amount), 0) as total_final_amount,
    CASE 
        WHEN COUNT(cgp.id) > 0 THEN AVG(cgp.final_amount)
        ELSE 0
    END as avg_purchase_amount,
    CASE 
        WHEN SUM(cgp.original_amount) > 0 THEN (SUM(cgp.discount_applied) / SUM(cgp.original_amount)) * 100
        ELSE 0
    END as actual_discount_percentage
FROM public.customer_groups cg
LEFT JOIN public.customer_group_members cgm ON cg.id = cgm.customer_group_id AND cgm.active = true
LEFT JOIN public.customer_group_purchases cgp ON cg.id = cgp.customer_group_id
WHERE cg.active = true
GROUP BY cg.id, cg.name, cg.discount_percentage, cg.discount_amount, cg.color, cg.active
ORDER BY total_final_amount DESC;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON public.gift_cards(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_gift_card_id ON public.gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_order_id ON public.gift_card_transactions(order_id) WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_groups_active ON public.customer_groups(active);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_group_id ON public.customer_group_members(customer_group_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_name ON public.customer_group_members(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_group_purchases_group_id ON public.customer_group_purchases(customer_group_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_purchases_order_id ON public.customer_group_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_purchases_created_at ON public.customer_group_purchases(created_at);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_group_purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage gift cards" ON public.gift_cards FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage gift card transactions" ON public.gift_card_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage customer groups" ON public.customer_groups FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage customer group members" ON public.customer_group_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage customer group purchases" ON public.customer_group_purchases FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON public.gift_cards TO authenticated;
GRANT ALL ON public.gift_card_transactions TO authenticated;
GRANT ALL ON public.customer_groups TO authenticated;
GRANT ALL ON public.customer_group_members TO authenticated;
GRANT ALL ON public.customer_group_purchases TO authenticated;

GRANT EXECUTE ON FUNCTION public.update_customer_member_stats(UUID, VARCHAR, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_gift_cards() TO authenticated;

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================
CREATE TRIGGER update_gift_cards_updated_at
    BEFORE UPDATE ON public.gift_cards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_groups_updated_at
    BEFORE UPDATE ON public.customer_groups
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- SAMPLE DATA
-- ================================================

-- Insert default customer groups
INSERT INTO public.customer_groups (name, description, discount_percentage, color) VALUES
('VIP Customers', 'Premium customers with 10% discount', 10.00, '#FFD700'),
('Staff Discount', 'Employee discount group', 15.00, '#32CD32'),
('Business Partners', 'Partner companies discount', 5.00, '#4169E1'),
('Students', 'Student discount group', 7.50, '#FF69B4'),
('Seniors', 'Senior citizen discount', 8.00, '#DDA0DD')
ON CONFLICT DO NOTHING;

-- Sample gift cards for testing
INSERT INTO public.gift_cards (code, balance, original_amount, expires_at) VALUES
('GC-2024-ABCD1234-EFGH5678', 150.00, 200.00, NOW() + INTERVAL '1 year'),
('GC-2024-TEST1234-DEMO5678', 75.00, 100.00, NOW() + INTERVAL '6 months'),
('GC-2024-SAMPLE12-GIFT5678', 250.00, 250.00, NOW() + INTERVAL '2 years')
ON CONFLICT DO NOTHING;

-- Record initial gift card transactions
INSERT INTO public.gift_card_transactions (gift_card_id, transaction_type, amount, balance_after, notes)
SELECT 
    id,
    'issue',
    original_amount,
    balance,
    'Sample gift card issued'
FROM public.gift_cards
WHERE code LIKE 'GC-2024-%'
ON CONFLICT DO NOTHING;

-- Log successful creation
DO $$
BEGIN
    RAISE NOTICE 'Gift Cards and Customer Groups system created successfully!';
    RAISE NOTICE 'Tables: gift_cards, gift_card_transactions, customer_groups, customer_group_members, customer_group_purchases';
    RAISE NOTICE 'Functions: update_customer_member_stats(), expire_gift_cards()';
    RAISE NOTICE 'Views: gift_card_summary, customer_group_analytics';
    RAISE NOTICE 'Sample data: 5 customer groups and 3 test gift cards added';
END $$;
