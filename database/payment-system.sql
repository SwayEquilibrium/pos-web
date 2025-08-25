-- Payment System Database Schema
-- This script creates all necessary tables and functions for the payment system

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID, -- Reference to orders table if applicable
    table_id UUID, -- Reference to tables table if applicable
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'DKK',
    reference VARCHAR(100),
    cash_received DECIMAL(10,2),
    change_given DECIMAL(10,2),
    customer_group_id UUID, -- Reference to customer_groups table if applicable
    discount_amount DECIMAL(10,2) DEFAULT 0,
    gift_card_code VARCHAR(20),
    gift_card_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- Reference to users table if applicable
    metadata JSONB -- Store additional payment details
);

-- Create payment_methods table for configurable payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    requires_reference BOOLEAN DEFAULT false,
    supports_cash_handling BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_reconciliation table for end-of-day reconciliation
CREATE TABLE IF NOT EXISTS payment_reconciliation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    expected_amount DECIMAL(10,2) NOT NULL,
    actual_amount DECIMAL(10,2),
    difference DECIMAL(10,2) GENERATED ALWAYS AS (actual_amount - expected_amount) STORED,
    notes TEXT,
    reconciled_by UUID, -- Reference to users table
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_table_id ON payments(table_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_company_date ON payment_reconciliation(company_id, reconciliation_date);

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_stats(
    p_company_id UUID,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    total_payments BIGINT,
    total_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    method_count BIGINT,
    method_amount DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_payments,
        SUM(p.amount)::DECIMAL(10,2) as total_amount,
        p.payment_method,
        COUNT(*)::BIGINT as method_count,
        SUM(p.amount)::DECIMAL(10,2) as method_amount
    FROM payments p
    WHERE p.company_id = p_company_id
        AND p.status = 'completed'
        AND (p_date_from IS NULL OR p.processed_at >= p_date_from)
        AND (p_date_to IS NULL OR p.processed_at <= p_date_to)
    GROUP BY ROLLUP(p.payment_method)
    ORDER BY p.payment_method NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily payment summary
CREATE OR REPLACE FUNCTION get_daily_payment_summary(
    p_company_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    payment_method VARCHAR(50),
    transaction_count BIGINT,
    total_amount DECIMAL(10,2),
    average_transaction DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.payment_method,
        COUNT(*)::BIGINT as transaction_count,
        SUM(p.amount)::DECIMAL(10,2) as total_amount,
        AVG(p.amount)::DECIMAL(10,2) as average_transaction
    FROM payments p
    WHERE p.company_id = p_company_id
        AND p.status = 'completed'
        AND DATE(p.processed_at) = p_date
    GROUP BY p.payment_method
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_payment_refund(
    p_payment_id UUID,
    p_refund_amount DECIMAL(10,2),
    p_reason TEXT DEFAULT NULL,
    p_refunded_by UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    refund_id UUID
) AS $$
DECLARE
    payment_record RECORD;
    new_refund_id UUID;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record FROM payments WHERE id = p_payment_id;
    
    -- Check if payment exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Payment not found', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if payment is completed
    IF payment_record.status != 'completed' THEN
        RETURN QUERY SELECT false, 'Payment is not in completed status', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check refund amount
    IF p_refund_amount <= 0 OR p_refund_amount > payment_record.amount THEN
        RETURN QUERY SELECT false, 'Invalid refund amount', NULL::UUID;
        RETURN;
    END IF;
    
    -- Create refund record (negative payment)
    INSERT INTO payments (
        company_id, order_id, table_id, payment_method, amount,
        currency, reference, status, metadata, created_by
    ) VALUES (
        payment_record.company_id,
        payment_record.order_id,
        payment_record.table_id,
        payment_record.payment_method,
        -p_refund_amount, -- Negative amount for refund
        payment_record.currency,
        'REFUND-' || payment_record.reference,
        'completed',
        jsonb_build_object(
            'refund_reason', p_reason,
            'original_payment_id', p_payment_id,
            'refund_type', 'partial'
        ),
        p_refunded_by
    ) RETURNING id INTO new_refund_id;
    
    -- Update original payment status if fully refunded
    IF p_refund_amount = payment_record.amount THEN
        UPDATE payments 
        SET status = 'refunded', 
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('refunded_at', CURRENT_TIMESTAMP)
        WHERE id = p_payment_id;
    END IF;
    
    RETURN QUERY SELECT true, 'Refund processed successfully', new_refund_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reconciliation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments (company-based access)
DROP POLICY IF EXISTS "Users can access payments from their company" ON payments;
CREATE POLICY "Users can access payments from their company" ON payments
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access payment methods from their company" ON payment_methods;
CREATE POLICY "Users can access payment methods from their company" ON payment_methods
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access payment reconciliation from their company" ON payment_reconciliation;
CREATE POLICY "Users can access payment reconciliation from their company" ON payment_reconciliation
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Insert default payment methods for all companies
INSERT INTO payment_methods (company_id, name, display_name, icon, color, supports_cash_handling, sort_order)
SELECT 
    c.id,
    'cash',
    'Kontant',
    'banknote',
    '#22c55e',
    true,
    1
FROM companies c
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (company_id, name, display_name, icon, color, sort_order)
SELECT 
    c.id,
    'card',
    'Kort',
    'credit-card',
    '#3b82f6',
    2
FROM companies c
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (company_id, name, display_name, icon, color, sort_order)
SELECT 
    c.id,
    'mobilepay',
    'MobilePay',
    'smartphone',
    '#8b5cf6',
    3
FROM companies c
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (company_id, name, display_name, icon, color, sort_order)
SELECT 
    c.id,
    'giftcard',
    'Gavekort',
    'gift',
    '#ec4899',
    4
FROM companies c
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payment_methods TO authenticated;
GRANT ALL ON payment_reconciliation TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
