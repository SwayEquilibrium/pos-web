-- ================================================
-- MENU MODULE SEED DATA
-- Run this after the migration to populate with sample data
-- ================================================

-- Insert tax codes
INSERT INTO public.tax_codes (name, rate) VALUES
('Standard VAT', 25.0),
('Reduced VAT', 12.0),
('Zero VAT', 0.0)
ON CONFLICT (name) DO NOTHING;

-- Insert product groups
INSERT INTO public.product_groups (name, description, sort_index) VALUES
('Hot Food', 'Hot prepared meals and dishes', 0),
('Cold Food', 'Cold dishes and salads', 1),
('Beverages', 'All types of drinks', 2),
('Desserts', 'Sweet treats and desserts', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert categories
INSERT INTO public.categories (name, description, sort_index, print_sort_index) VALUES
('Pizza', 'Traditional and specialty pizzas', 0, 0),
('Burgers', 'Beef, chicken and veggie burgers', 1, 1),
('Salads', 'Fresh salads and healthy options', 2, 2),
('Beverages', 'Drinks and refreshments', 3, 3),
('Desserts', 'Sweet endings to your meal', 4, 4);

-- Get IDs for foreign key references
DO $$
DECLARE
    hot_food_id UUID;
    beverages_id UUID;
    pizza_cat_id UUID;
    burgers_cat_id UUID;
    salads_cat_id UUID;
    beverages_cat_id UUID;
    desserts_cat_id UUID;
    standard_vat_id UUID;
    reduced_vat_id UUID;
BEGIN
    -- Get product group IDs
    SELECT id INTO hot_food_id FROM public.product_groups WHERE name = 'Hot Food';
    SELECT id INTO beverages_id FROM public.product_groups WHERE name = 'Beverages';
    
    -- Get category IDs
    SELECT id INTO pizza_cat_id FROM public.categories WHERE name = 'Pizza';
    SELECT id INTO burgers_cat_id FROM public.categories WHERE name = 'Burgers';
    SELECT id INTO salads_cat_id FROM public.categories WHERE name = 'Salads';
    SELECT id INTO beverages_cat_id FROM public.categories WHERE name = 'Beverages';
    SELECT id INTO desserts_cat_id FROM public.categories WHERE name = 'Desserts';
    
    -- Get tax code IDs
    SELECT id INTO standard_vat_id FROM public.tax_codes WHERE name = 'Standard VAT';
    SELECT id INTO reduced_vat_id FROM public.tax_codes WHERE name = 'Reduced VAT';

    -- Insert products
    INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
    ('Margherita Pizza', pizza_cat_id, hot_food_id, 'Classic pizza with tomato sauce, mozzarella, and fresh basil'),
    ('Pepperoni Pizza', pizza_cat_id, hot_food_id, 'Pizza with pepperoni, tomato sauce, and mozzarella'),
    ('Cheese Burger', burgers_cat_id, hot_food_id, 'Beef patty with cheese, lettuce, tomato, and burger sauce'),
    ('Chicken Burger', burgers_cat_id, hot_food_id, 'Grilled chicken breast with lettuce and mayo'),
    ('Caesar Salad', salads_cat_id, NULL, 'Romaine lettuce with Caesar dressing, croutons, and parmesan'),
    ('Coca Cola', beverages_cat_id, beverages_id, 'Classic Coca Cola soft drink'),
    ('Coffee', beverages_cat_id, beverages_id, 'Fresh brewed coffee')
    ON CONFLICT DO NOTHING;

    -- Insert product prices using the RPC function
    PERFORM public.upsert_product_with_prices(
        p.id,
        p.name,
        p.category_id,
        p.product_group_id,
        p.description,
        CASE p.name
            WHEN 'Margherita Pizza' THEN 89.00
            WHEN 'Pepperoni Pizza' THEN 99.00
            WHEN 'Cheese Burger' THEN 79.00
            WHEN 'Chicken Burger' THEN 85.00
            WHEN 'Caesar Salad' THEN 65.00
            WHEN 'Coca Cola' THEN 25.00
            WHEN 'Coffee' THEN 30.00
        END,
        standard_vat_id,
        CASE p.name
            WHEN 'Margherita Pizza' THEN 85.00
            WHEN 'Pepperoni Pizza' THEN 95.00
            WHEN 'Cheese Burger' THEN 75.00
            WHEN 'Chicken Burger' THEN 80.00
            WHEN 'Caesar Salad' THEN 60.00
            WHEN 'Coca Cola' THEN 22.00
            WHEN 'Coffee' THEN 28.00
        END,
        standard_vat_id
    )
    FROM public.products p;

    -- Insert modifier groups
    INSERT INTO public.modifier_groups (name, description, min_select, max_select) VALUES
    ('Pizza Size', 'Choose your pizza size', 1, 1),
    ('Burger Extras', 'Add extras to your burger', 0, 5),
    ('Drink Size', 'Choose your drink size', 1, 1),
    ('Sauce Options', 'Choose your preferred sauce', 0, 3)
    ON CONFLICT (name) DO NOTHING;

    -- Insert modifiers
    INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index)
    SELECT 
        mg.id,
        modifier_data.name,
        modifier_data.kind,
        modifier_data.price_delta,
        modifier_data.sort_index
    FROM public.modifier_groups mg,
    (VALUES
        ('Pizza Size', 'Small (25cm)', 'add', -10.00, 0),
        ('Pizza Size', 'Medium (30cm)', 'add', 0.00, 1),
        ('Pizza Size', 'Large (35cm)', 'add', 15.00, 2),
        ('Burger Extras', 'Extra Cheese', 'add', 8.00, 0),
        ('Burger Extras', 'Bacon', 'add', 12.00, 1),
        ('Burger Extras', 'Avocado', 'add', 10.00, 2),
        ('Burger Extras', 'Extra Patty', 'add', 25.00, 3),
        ('Drink Size', 'Small', 'add', -5.00, 0),
        ('Drink Size', 'Medium', 'add', 0.00, 1),
        ('Drink Size', 'Large', 'add', 8.00, 2),
        ('Sauce Options', 'Ketchup', 'add', 0.00, 0),
        ('Sauce Options', 'Mayo', 'add', 0.00, 1),
        ('Sauce Options', 'BBQ Sauce', 'add', 2.00, 2),
        ('Sauce Options', 'Hot Sauce', 'add', 2.00, 3)
    ) AS modifier_data(group_name, name, kind, price_delta, sort_index)
    WHERE mg.name = modifier_data.group_name
    ON CONFLICT DO NOTHING;

    -- Link modifier groups to products
    INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
    SELECT 
        p.id,
        mg.id,
        link_data.sort_index,
        link_data.is_required
    FROM public.products p,
         public.modifier_groups mg,
    (VALUES
        ('Margherita Pizza', 'Pizza Size', 0, true),
        ('Pepperoni Pizza', 'Pizza Size', 0, true),
        ('Cheese Burger', 'Burger Extras', 0, false),
        ('Cheese Burger', 'Sauce Options', 1, false),
        ('Chicken Burger', 'Burger Extras', 0, false),
        ('Chicken Burger', 'Sauce Options', 1, false),
        ('Coca Cola', 'Drink Size', 0, true),
        ('Coffee', 'Drink Size', 0, false)
    ) AS link_data(product_name, group_name, sort_index, is_required)
    WHERE p.name = link_data.product_name AND mg.name = link_data.group_name
    ON CONFLICT DO NOTHING;

    -- Insert menucards
    INSERT INTO public.menucards (name, description, sort_index) VALUES
    ('Main Menu', 'Our complete food and beverage menu', 0),
    ('Lunch Special', 'Quick lunch options available 11-15', 1),
    ('Beverages Only', 'Just drinks and refreshments', 2)
    ON CONFLICT (name) DO NOTHING;

    -- Link categories to menucards
    INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
    SELECT 
        mc.id,
        c.id,
        link_data.sort_index
    FROM public.menucards mc,
         public.categories c,
    (VALUES
        ('Main Menu', 'Pizza', 0),
        ('Main Menu', 'Burgers', 1),
        ('Main Menu', 'Salads', 2),
        ('Main Menu', 'Beverages', 3),
        ('Main Menu', 'Desserts', 4),
        ('Lunch Special', 'Burgers', 0),
        ('Lunch Special', 'Salads', 1),
        ('Lunch Special', 'Beverages', 2),
        ('Beverages Only', 'Beverages', 0)
    ) AS link_data(menucard_name, category_name, sort_index)
    WHERE mc.name = link_data.menucard_name AND c.name = link_data.category_name
    ON CONFLICT DO NOTHING;

END $$;
