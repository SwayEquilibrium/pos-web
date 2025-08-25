-- Gift Card System Database Schema
-- This script creates all necessary tables and functions for the gift card system

-- Create gift cards table
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    initial_amount DECIMAL(10,2) NOT NULL CHECK (initial_amount > 0),
    current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    message TEXT,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    used_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gift card transactions table for tracking usage
CREATE TABLE IF NOT EXISTS gift_card_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issue', 'redeem', 'refund', 'expire')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    order_id UUID, -- Reference to orders table if applicable
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID -- Reference to users table if applicable
);

-- Create gift card templates table for pre-designed cards
CREATE TABLE IF NOT EXISTS gift_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    design_data JSONB, -- Store design configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gift_cards_company_id ON gift_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expiry_date ON gift_cards(expiry_date);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_gift_card_id ON gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_type ON gift_card_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gift_card_templates_company_id ON gift_card_templates(company_id);

-- Function to generate unique gift card code
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a random 16-character code with letters and numbers
        code := UPPER(
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
            SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
        );
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_count FROM gift_cards WHERE gift_cards.code = code;
        
        -- If code is unique, return it
        IF exists_count = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new gift card
CREATE OR REPLACE FUNCTION create_gift_card(
    p_company_id UUID,
    p_amount DECIMAL(10,2),
    p_recipient_name VARCHAR(255) DEFAULT NULL,
    p_recipient_email VARCHAR(255) DEFAULT NULL,
    p_sender_name VARCHAR(255) DEFAULT NULL,
    p_sender_email VARCHAR(255) DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_expiry_months INTEGER DEFAULT 12
)
RETURNS TABLE(
    gift_card_id UUID,
    gift_card_code VARCHAR(20),
    initial_amount DECIMAL(10,2),
    expiry_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    new_code VARCHAR(20);
    new_id UUID;
    new_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique code
    new_code := generate_gift_card_code();
    
    -- Calculate expiry date
    new_expiry_date := CURRENT_TIMESTAMP + INTERVAL '1 month' * p_expiry_months;
    
    -- Insert new gift card
    INSERT INTO gift_cards (
        company_id, code, initial_amount, current_balance,
        recipient_name, recipient_email, sender_name, sender_email,
        message, expiry_date
    ) VALUES (
        p_company_id, new_code, p_amount, p_amount,
        p_recipient_name, p_recipient_email, p_sender_name, p_sender_email,
        p_message, new_expiry_date
    ) RETURNING id INTO new_id;
    
    -- Create initial transaction record
    INSERT INTO gift_card_transactions (
        gift_card_id, transaction_type, amount,
        balance_before, balance_after, notes
    ) VALUES (
        new_id, 'issue', p_amount, 0, p_amount,
        'Gift card issued'
    );
    
    -- Return gift card details
    RETURN QUERY SELECT 
        new_id,
        new_code,
        p_amount,
        new_expiry_date;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem gift card
CREATE OR REPLACE FUNCTION redeem_gift_card(
    p_code VARCHAR(20),
    p_amount DECIMAL(10,2),
    p_order_id UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    remaining_balance DECIMAL(10,2)
) AS $$
DECLARE
    card_record RECORD;
    new_balance DECIMAL(10,2);
BEGIN
    -- Get gift card details
    SELECT * INTO card_record FROM gift_cards WHERE code = p_code;
    
    -- Check if gift card exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Gift card not found', 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- Check if gift card is active
    IF card_record.status != 'active' THEN
        RETURN QUERY SELECT false, 'Gift card is not active', card_record.current_balance;
        RETURN;
    END IF;
    
    -- Check if gift card is expired
    IF card_record.expiry_date < CURRENT_TIMESTAMP THEN
        -- Update status to expired
        UPDATE gift_cards SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE id = card_record.id;
        
        RETURN QUERY SELECT false, 'Gift card has expired', card_record.current_balance;
        RETURN;
    END IF;
    
    -- Check if sufficient balance
    IF card_record.current_balance < p_amount THEN
        RETURN QUERY SELECT false, 'Insufficient balance', card_record.current_balance;
        RETURN;
    END IF;
    
    -- Calculate new balance
    new_balance := card_record.current_balance - p_amount;
    
    -- Update gift card balance
    UPDATE gift_cards 
    SET current_balance = new_balance,
        updated_at = CURRENT_TIMESTAMP,
        status = CASE WHEN new_balance = 0 THEN 'used' ELSE 'active' END,
        used_date = CASE WHEN new_balance = 0 THEN CURRENT_TIMESTAMP ELSE used_date END
    WHERE id = card_record.id;
    
    -- Create transaction record
    INSERT INTO gift_card_transactions (
        gift_card_id, transaction_type, amount,
        balance_before, balance_after, order_id, notes
    ) VALUES (
        card_record.id, 'redeem', p_amount,
        card_record.current_balance, new_balance, p_order_id,
        'Gift card redeemed'
    );
    
    RETURN QUERY SELECT true, 'Gift card redeemed successfully', new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to check gift card balance
CREATE OR REPLACE FUNCTION check_gift_card_balance(p_code VARCHAR(20))
RETURNS TABLE(
    found BOOLEAN,
    current_balance DECIMAL(10,2),
    status VARCHAR(20),
    expiry_date TIMESTAMP WITH TIME ZONE,
    recipient_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        true,
        gc.current_balance,
        gc.status,
        gc.expiry_date,
        gc.recipient_name
    FROM gift_cards gc
    WHERE gc.code = p_code;
    
    -- If no rows returned, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL(10,2), ''::VARCHAR(20), NULL::TIMESTAMP WITH TIME ZONE, ''::VARCHAR(255);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gift cards (company-based access)
DROP POLICY IF EXISTS "Users can access gift cards from their company" ON gift_cards;
CREATE POLICY "Users can access gift cards from their company" ON gift_cards
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access gift card transactions from their company" ON gift_card_transactions;
CREATE POLICY "Users can access gift card transactions from their company" ON gift_card_transactions
    FOR ALL USING (
        gift_card_id IN (
            SELECT gc.id FROM gift_cards gc
            JOIN companies c ON gc.company_id = c.id
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can access gift card templates from their company" ON gift_card_templates;
CREATE POLICY "Users can access gift card templates from their company" ON gift_card_templates
    FOR ALL USING (
        company_id IN (
            SELECT c.id FROM companies c
            JOIN user_companies uc ON c.id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Insert default gift card template
INSERT INTO gift_card_templates (company_id, name, description, design_data, is_active)
SELECT 
    c.id,
    'Standard Gift Card',
    'Default gift card template with company branding',
    '{"background": "#f8f9fa", "textColor": "#333333", "accentColor": "#007bff", "font": "Inter"}',
    true
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

DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
CREATE TRIGGER update_gift_cards_updated_at
    BEFORE UPDATE ON gift_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gift_card_templates_updated_at ON gift_card_templates;
CREATE TRIGGER update_gift_card_templates_updated_at
    BEFORE UPDATE ON gift_card_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT ALL ON gift_cards TO authenticated;
GRANT ALL ON gift_card_transactions TO authenticated;
GRANT ALL ON gift_card_templates TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
