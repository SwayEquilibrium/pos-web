-- Customer Group Purchase Tracking and Analytics Schema
-- This extends the existing customer groups system with purchase tracking

-- Create customer_group_purchases table to track all purchases made with group discounts
CREATE TABLE IF NOT EXISTS customer_group_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_group_id UUID NOT NULL REFERENCES customer_groups(id),
    order_id TEXT NOT NULL, -- Reference to the order
    customer_name TEXT, -- Optional customer name
    total_amount DECIMAL(10,2) NOT NULL, -- Original order total
    discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0, -- Discount amount given
    items_count INTEGER NOT NULL DEFAULT 1, -- Number of items in order
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_group_purchases_group_id ON customer_group_purchases(customer_group_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_purchases_date ON customer_group_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_customer_group_purchases_order ON customer_group_purchases(order_id);

-- Create RLS policies
ALTER TABLE customer_group_purchases ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view purchases for their company
CREATE POLICY "Users can view group purchases for their company" ON customer_group_purchases
    FOR SELECT USING (
        customer_group_id IN (
            SELECT id FROM customer_groups 
            WHERE company_id = (
                SELECT company_id FROM user_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for authenticated users to insert purchases for their company
CREATE POLICY "Users can create group purchases for their company" ON customer_group_purchases
    FOR INSERT WITH CHECK (
        customer_group_id IN (
            SELECT id FROM customer_groups 
            WHERE company_id = (
                SELECT company_id FROM user_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for authenticated users to update purchases for their company
CREATE POLICY "Users can update group purchases for their company" ON customer_group_purchases
    FOR UPDATE USING (
        customer_group_id IN (
            SELECT id FROM customer_groups 
            WHERE company_id = (
                SELECT company_id FROM user_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create function to get customer group analytics
CREATE OR REPLACE FUNCTION get_customer_group_analytics(group_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    company_id_val UUID;
BEGIN
    -- Get the company_id for the group to ensure user has access
    SELECT cg.company_id INTO company_id_val
    FROM customer_groups cg
    WHERE cg.id = group_id;
    
    -- Check if user has access to this company's data
    IF company_id_val != (
        SELECT up.company_id FROM user_profiles up WHERE up.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Build analytics result
    SELECT json_build_object(
        'total_purchases', COALESCE(stats.total_purchases, 0),
        'total_spent', COALESCE(stats.total_spent, 0),
        'total_discount_given', COALESCE(stats.total_discount_given, 0),
        'average_order_value', COALESCE(stats.average_order_value, 0),
        'last_purchase_date', stats.last_purchase_date,
        'most_frequent_payment_method', payments.most_frequent_method,
        'monthly_spending', monthly.monthly_data
    ) INTO result
    FROM (
        -- Basic statistics
        SELECT 
            COUNT(*) as total_purchases,
            SUM(total_amount - discount_applied) as total_spent,
            SUM(discount_applied) as total_discount_given,
            AVG(total_amount - discount_applied) as average_order_value,
            MAX(purchase_date) as last_purchase_date
        FROM customer_group_purchases
        WHERE customer_group_id = group_id
    ) stats
    CROSS JOIN (
        -- Most frequent payment method
        SELECT 
            COALESCE(pt.payment_type_code, 'UNKNOWN') as most_frequent_method
        FROM customer_group_purchases cgp
        LEFT JOIN payment_transactions pt ON pt.order_id = cgp.order_id
        WHERE cgp.customer_group_id = group_id
        GROUP BY pt.payment_type_code
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) payments
    CROSS JOIN (
        -- Monthly spending data
        SELECT 
            COALESCE(
                json_agg(
                    json_build_object(
                        'month', monthly_stats.month,
                        'amount', monthly_stats.amount,
                        'orders', monthly_stats.orders
                    )
                    ORDER BY monthly_stats.month DESC
                ), 
                '[]'::json
            ) as monthly_data
        FROM (
            SELECT 
                TO_CHAR(purchase_date, 'YYYY-MM') as month,
                SUM(total_amount - discount_applied) as amount,
                COUNT(*) as orders
            FROM customer_group_purchases
            WHERE customer_group_id = group_id
                AND purchase_date >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')
            ORDER BY month DESC
            LIMIT 12
        ) monthly_stats
    ) monthly;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record a customer group purchase
CREATE OR REPLACE FUNCTION record_customer_group_purchase(
    p_customer_group_id UUID,
    p_order_id TEXT,
    p_customer_name TEXT DEFAULT NULL,
    p_total_amount DECIMAL(10,2),
    p_discount_applied DECIMAL(10,2) DEFAULT 0,
    p_items_count INTEGER DEFAULT 1,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    purchase_id UUID;
    company_id_val UUID;
BEGIN
    -- Get the company_id for the group to ensure user has access
    SELECT cg.company_id INTO company_id_val
    FROM customer_groups cg
    WHERE cg.id = p_customer_group_id;
    
    -- Check if user has access to this company's data
    IF company_id_val != (
        SELECT up.company_id FROM user_profiles up WHERE up.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Insert the purchase record
    INSERT INTO customer_group_purchases (
        customer_group_id,
        order_id,
        customer_name,
        total_amount,
        discount_applied,
        items_count,
        notes
    ) VALUES (
        p_customer_group_id,
        p_order_id,
        p_customer_name,
        p_total_amount,
        p_discount_applied,
        p_items_count,
        p_notes
    ) RETURNING id INTO purchase_id;
    
    RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger for customer_group_purchases
CREATE OR REPLACE FUNCTION update_customer_group_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_group_purchases_updated_at
    BEFORE UPDATE ON customer_group_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_group_purchases_updated_at();

-- Create a view for easy analytics queries
CREATE OR REPLACE VIEW customer_group_purchase_summary AS
SELECT 
    cg.id as group_id,
    cg.name as group_name,
    cg.color as group_color,
    COUNT(cgp.id) as total_purchases,
    COALESCE(SUM(cgp.total_amount - cgp.discount_applied), 0) as total_spent,
    COALESCE(SUM(cgp.discount_applied), 0) as total_discount_given,
    COALESCE(AVG(cgp.total_amount - cgp.discount_applied), 0) as average_order_value,
    MAX(cgp.purchase_date) as last_purchase_date,
    COUNT(DISTINCT cgp.customer_name) FILTER (WHERE cgp.customer_name IS NOT NULL) as unique_customers
FROM customer_groups cg
LEFT JOIN customer_group_purchases cgp ON cg.id = cgp.customer_group_id
WHERE cg.active = true
GROUP BY cg.id, cg.name, cg.color;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON customer_group_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_group_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_customer_group_purchase(UUID, TEXT, TEXT, DECIMAL, DECIMAL, INTEGER, TEXT) TO authenticated;
GRANT SELECT ON customer_group_purchase_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE customer_group_purchases IS 'Tracks all purchases made with customer group discounts';
COMMENT ON FUNCTION get_customer_group_analytics(UUID) IS 'Returns comprehensive analytics for a customer group including spending patterns and payment methods';
COMMENT ON FUNCTION record_customer_group_purchase(UUID, TEXT, TEXT, DECIMAL, DECIMAL, INTEGER, TEXT) IS 'Records a new purchase for a customer group with discount tracking';
COMMENT ON VIEW customer_group_purchase_summary IS 'Summary view of customer group purchase statistics';
