-- ================================================
-- COMPREHENSIVE SALES TRACKING SYSTEM
-- ================================================
-- Track sales at every level: orders, products, categories, modifiers

-- ================================================
-- ORDERS TABLE (if not exists)
-- ================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES public.tables(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    customer_count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

-- ================================================
-- ORDER ITEMS TABLE - Individual products in orders
-- ================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    category_id UUID NOT NULL REFERENCES public.categories(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL, -- unit_price * quantity + modifiers
    modifiers_total DECIMAL(10,2) DEFAULT 0.00,
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Denormalized fields for faster analytics
    product_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    category_path TEXT, -- Full hierarchy path like "Food Menu > Pizza > Classic Pizzas"
    
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_unit_price CHECK (unit_price >= 0),
    CONSTRAINT positive_total_price CHECK (total_price >= 0)
);

-- ================================================
-- ORDER ITEM MODIFIERS - Track which modifiers were selected
-- ================================================
CREATE TABLE IF NOT EXISTS public.order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    modifier_group_id UUID NOT NULL, -- References modifier groups
    modifier_id UUID NOT NULL, -- References individual modifiers
    modifier_name VARCHAR(255) NOT NULL,
    modifier_group_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_modifier_quantity CHECK (quantity > 0),
    CONSTRAINT positive_modifier_price CHECK (price >= 0)
);

-- ================================================
-- SALES ANALYTICS VIEWS
-- ================================================

-- Daily Sales Summary by Category
CREATE OR REPLACE VIEW public.daily_category_sales AS
SELECT 
    DATE(oi.created_at) as sale_date,
    oi.category_id,
    oi.category_name,
    oi.category_path,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as items_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.unit_price) as avg_item_price,
    SUM(oi.modifiers_total) as modifiers_revenue
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.status IN ('paid', 'completed')
GROUP BY DATE(oi.created_at), oi.category_id, oi.category_name, oi.category_path
ORDER BY sale_date DESC, total_revenue DESC;

-- Product Performance Analytics
CREATE OR REPLACE VIEW public.product_performance AS
SELECT 
    oi.product_id,
    oi.product_name,
    oi.category_name,
    COUNT(DISTINCT oi.order_id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.unit_price) as avg_price,
    SUM(oi.modifiers_total) as total_modifier_revenue,
    AVG(oi.modifiers_total) as avg_modifier_per_item,
    MAX(oi.created_at) as last_sold,
    -- Calculate popularity score (orders in last 30 days)
    COUNT(DISTINCT CASE WHEN oi.created_at >= NOW() - INTERVAL '30 days' THEN oi.order_id END) as orders_last_30_days
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.status IN ('paid', 'completed')
GROUP BY oi.product_id, oi.product_name, oi.category_name
ORDER BY total_revenue DESC;

-- Modifier Popularity Analytics
CREATE OR REPLACE VIEW public.modifier_analytics AS
SELECT 
    oim.modifier_group_id,
    oim.modifier_group_name,
    oim.modifier_id,
    oim.modifier_name,
    COUNT(*) as times_selected,
    SUM(oim.quantity) as total_quantity,
    SUM(oim.price * oim.quantity) as total_revenue,
    AVG(oim.price) as avg_price,
    -- Calculate selection rate (how often this modifier is chosen when the group is available)
    ROUND(
        COUNT(*) * 100.0 / NULLIF(
            (SELECT COUNT(*) FROM public.order_item_modifiers oim2 WHERE oim2.modifier_group_id = oim.modifier_group_id), 
            0
        ), 2
    ) as selection_percentage,
    MAX(oim.created_at) as last_selected
FROM public.order_item_modifiers oim
GROUP BY oim.modifier_group_id, oim.modifier_group_name, oim.modifier_id, oim.modifier_name
ORDER BY times_selected DESC;

-- Hourly Sales Pattern
CREATE OR REPLACE VIEW public.hourly_sales_pattern AS
SELECT 
    EXTRACT(HOUR FROM oi.created_at) as hour_of_day,
    EXTRACT(DOW FROM oi.created_at) as day_of_week, -- 0=Sunday, 6=Saturday
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as items_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.total_price) as avg_order_value
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
WHERE o.status IN ('paid', 'completed')
AND oi.created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM oi.created_at), EXTRACT(DOW FROM oi.created_at)
ORDER BY day_of_week, hour_of_day;

-- Category Hierarchy Sales (recursive)
CREATE OR REPLACE VIEW public.category_hierarchy_sales AS
WITH RECURSIVE category_tree AS (
    -- Base case: root categories
    SELECT 
        c.id,
        c.name,
        c.parent_id,
        c.name as full_path,
        0 as level
    FROM public.categories c
    WHERE c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: subcategories
    SELECT 
        c.id,
        c.name,
        c.parent_id,
        ct.full_path || ' → ' || c.name as full_path,
        ct.level + 1
    FROM public.categories c
    JOIN category_tree ct ON c.parent_id = ct.id
    WHERE ct.level < 10 -- Prevent infinite recursion
)
SELECT 
    ct.id as category_id,
    ct.name as category_name,
    ct.full_path,
    ct.level,
    COALESCE(sales.order_count, 0) as order_count,
    COALESCE(sales.items_sold, 0) as items_sold,
    COALESCE(sales.total_revenue, 0) as total_revenue,
    COALESCE(sales.modifiers_revenue, 0) as modifiers_revenue
FROM category_tree ct
LEFT JOIN (
    SELECT 
        oi.category_id,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.quantity) as items_sold,
        SUM(oi.total_price) as total_revenue,
        SUM(oi.modifiers_total) as modifiers_revenue
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.status IN ('paid', 'completed')
    GROUP BY oi.category_id
) sales ON ct.id = sales.category_id
ORDER BY ct.level, sales.total_revenue DESC NULLS LAST;

-- ================================================
-- FUNCTIONS FOR SALES TRACKING
-- ================================================

-- Function to record a complete order with items and modifiers
CREATE OR REPLACE FUNCTION public.record_order_sale(
    p_order_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_modifier JSONB;
    v_order_item_id UUID;
    v_category_path TEXT;
BEGIN
    -- Insert the order
    INSERT INTO public.orders (
        table_id,
        order_number,
        total_amount,
        tax_amount,
        discount_amount,
        tip_amount,
        payment_method,
        customer_count,
        notes,
        status
    ) VALUES (
        (p_order_data->>'table_id')::UUID,
        p_order_data->>'order_number',
        (p_order_data->>'total_amount')::DECIMAL,
        (p_order_data->>'tax_amount')::DECIMAL,
        (p_order_data->>'discount_amount')::DECIMAL,
        (p_order_data->>'tip_amount')::DECIMAL,
        p_order_data->>'payment_method',
        (p_order_data->>'customer_count')::INTEGER,
        p_order_data->>'notes',
        COALESCE(p_order_data->>'status', 'paid')
    ) RETURNING id INTO v_order_id;
    
    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_data->'items')
    LOOP
        -- Get category path for analytics
        SELECT public.get_category_path((v_item->>'category_id')::UUID) INTO v_category_path;
        
        -- Insert order item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            category_id,
            quantity,
            unit_price,
            total_price,
            modifiers_total,
            special_instructions,
            product_name,
            category_name,
            category_path
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'category_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'total_price')::DECIMAL,
            (v_item->>'modifiers_total')::DECIMAL,
            v_item->>'special_instructions',
            v_item->>'product_name',
            v_item->>'category_name',
            v_category_path
        ) RETURNING id INTO v_order_item_id;
        
        -- Insert modifiers for this item
        FOR v_modifier IN SELECT * FROM jsonb_array_elements(COALESCE(v_item->'modifiers', '[]'::jsonb))
        LOOP
            INSERT INTO public.order_item_modifiers (
                order_item_id,
                modifier_group_id,
                modifier_id,
                modifier_name,
                modifier_group_name,
                price,
                quantity
            ) VALUES (
                v_order_item_id,
                (v_modifier->>'modifier_group_id')::UUID,
                (v_modifier->>'modifier_id')::UUID,
                v_modifier->>'modifier_name',
                v_modifier->>'modifier_group_name',
                (v_modifier->>'price')::DECIMAL,
                (v_modifier->>'quantity')::INTEGER
            );
        END LOOP;
    END LOOP;
    
    RETURN v_order_id;
END;
$$;

-- Function to get sales analytics for a date range
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    category_name TEXT,
    category_path TEXT,
    product_count BIGINT,
    total_orders BIGINT,
    total_items_sold BIGINT,
    total_revenue DECIMAL,
    avg_order_value DECIMAL,
    top_product TEXT,
    top_modifier TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH category_sales AS (
        SELECT 
            oi.category_name,
            oi.category_path,
            COUNT(DISTINCT oi.product_id) as product_count,
            COUNT(DISTINCT oi.order_id) as total_orders,
            SUM(oi.quantity) as total_items_sold,
            SUM(oi.total_price) as total_revenue,
            AVG(oi.total_price) as avg_order_value
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE DATE(oi.created_at) BETWEEN p_start_date AND p_end_date
        AND o.status IN ('paid', 'completed')
        GROUP BY oi.category_name, oi.category_path
    ),
    top_products AS (
        SELECT DISTINCT ON (oi.category_name)
            oi.category_name,
            oi.product_name as top_product
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        WHERE DATE(oi.created_at) BETWEEN p_start_date AND p_end_date
        AND o.status IN ('paid', 'completed')
        ORDER BY oi.category_name, SUM(oi.quantity) DESC
    ),
    top_modifiers AS (
        SELECT DISTINCT ON (oi.category_name)
            oi.category_name,
            oim.modifier_name as top_modifier
        FROM public.order_items oi
        JOIN public.order_item_modifiers oim ON oi.id = oim.order_item_id
        JOIN public.orders o ON oi.order_id = o.id
        WHERE DATE(oi.created_at) BETWEEN p_start_date AND p_end_date
        AND o.status IN ('paid', 'completed')
        ORDER BY oi.category_name, COUNT(oim.modifier_id) DESC
    )
    SELECT 
        cs.category_name,
        cs.category_path,
        cs.product_count,
        cs.total_orders,
        cs.total_items_sold,
        cs.total_revenue,
        cs.avg_order_value,
        tp.top_product,
        tm.top_modifier
    FROM category_sales cs
    LEFT JOIN top_products tp ON cs.category_name = tp.category_name
    LEFT JOIN top_modifiers tm ON cs.category_name = tm.category_name
    ORDER BY cs.total_revenue DESC;
END;
$$;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON public.order_items(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_category_id ON public.order_items(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_created_at ON public.order_item_modifiers(created_at);
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_modifier_id ON public.order_item_modifiers(modifier_id);
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_group_id ON public.order_item_modifiers(modifier_group_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at) WHERE paid_at IS NOT NULL;

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write their company's data
CREATE POLICY "Users can manage orders" ON public.orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage order items" ON public.order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage order modifiers" ON public.order_item_modifiers FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.order_item_modifiers TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_order_sale(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_analytics(DATE, DATE) TO authenticated;

-- Sample data for testing
COMMENT ON TABLE public.order_items IS 'Tracks individual products sold in orders with full category hierarchy for analytics';
COMMENT ON TABLE public.order_item_modifiers IS 'Tracks which modifiers were selected for each order item - crucial for popularity analytics';
COMMENT ON VIEW public.modifier_analytics IS 'Shows which modifiers are most popular and generate the most revenue';
COMMENT ON VIEW public.product_performance IS 'Complete product performance metrics including modifier revenue';
COMMENT ON FUNCTION public.record_order_sale IS 'Records a complete order with all items and modifiers for comprehensive sales tracking';

-- Log successful creation
DO $$
BEGIN
    RAISE NOTICE 'Sales tracking system created successfully!';
    RAISE NOTICE 'Tables: orders, order_items, order_item_modifiers';
    RAISE NOTICE 'Views: daily_category_sales, product_performance, modifier_analytics, hourly_sales_pattern, category_hierarchy_sales';
    RAISE NOTICE 'Functions: record_order_sale(), get_sales_analytics()';
END $$;
