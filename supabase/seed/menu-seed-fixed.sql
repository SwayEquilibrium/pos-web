-- ================================================
-- MENU MODULE SEED DATA (FIXED VERSION)
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

-- Insert categories (check if they exist first)
DO $$
BEGIN
    -- Insert categories only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Pizza') THEN
        INSERT INTO public.categories (name, description, sort_index, print_sort_index) VALUES
        ('Pizza', 'Traditional and specialty pizzas', 0, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Burgers') THEN
        INSERT INTO public.categories (name, description, sort_index, print_sort_index) VALUES
        ('Burgers', 'Beef, chicken and veggie burgers', 1, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Salads') THEN
        INSERT INTO public.categories (name, description, sort_index, print_sort_index) VALUES
        ('Salads', 'Fresh salads and healthy options', 2, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Beverages') THEN
        INSERT INTO public.categories (name, description, sort_index, print_sort_index) VALUES
        ('Beverages', 'Drinks and refreshments', 3, 3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Desserts') THEN
        INSERT INTO public.categories (name, description, sort_index, print_sort_index) VALUES
        ('Desserts', 'Sweet endings to your meal', 4, 4);
    END IF;
END $$;

-- Main data insertion
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
    pizza_size_group_id UUID;
    burger_extras_group_id UUID;
    drink_size_group_id UUID;
    sauce_options_group_id UUID;
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

    -- Insert products (check if they exist first)
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Margherita Pizza') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Margherita Pizza', pizza_cat_id, hot_food_id, 'Classic pizza with tomato sauce, mozzarella, and fresh basil');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Pepperoni Pizza') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Pepperoni Pizza', pizza_cat_id, hot_food_id, 'Pizza with pepperoni, tomato sauce, and mozzarella');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Cheese Burger') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Cheese Burger', burgers_cat_id, hot_food_id, 'Beef patty with cheese, lettuce, tomato, and burger sauce');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Chicken Burger') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Chicken Burger', burgers_cat_id, hot_food_id, 'Grilled chicken breast with lettuce and mayo');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Caesar Salad') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Caesar Salad', salads_cat_id, NULL, 'Romaine lettuce with Caesar dressing, croutons, and parmesan');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Coca Cola') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Coca Cola', beverages_cat_id, beverages_id, 'Classic Coca Cola soft drink');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Coffee') THEN
        INSERT INTO public.products (name, category_id, product_group_id, description) VALUES
        ('Coffee', beverages_cat_id, beverages_id, 'Fresh brewed coffee');
    END IF;

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
            ELSE 0.00
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
            ELSE 0.00
        END,
        standard_vat_id
    )
    FROM public.products p
    WHERE p.name IN ('Margherita Pizza', 'Pepperoni Pizza', 'Cheese Burger', 'Chicken Burger', 'Caesar Salad', 'Coca Cola', 'Coffee');

    -- Insert modifier groups (check if they exist first)
    IF NOT EXISTS (SELECT 1 FROM public.modifier_groups WHERE name = 'Pizza Size') THEN
        INSERT INTO public.modifier_groups (name, description, type, min_select, max_select) VALUES
        ('Pizza Size', 'Choose your pizza size', 'variant', 1, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifier_groups WHERE name = 'Burger Extras') THEN
        INSERT INTO public.modifier_groups (name, description, type, min_select, max_select) VALUES
        ('Burger Extras', 'Add extras to your burger', 'addon', 0, 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifier_groups WHERE name = 'Drink Size') THEN
        INSERT INTO public.modifier_groups (name, description, type, min_select, max_select) VALUES
        ('Drink Size', 'Choose your drink size', 'variant', 1, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifier_groups WHERE name = 'Sauce Options') THEN
        INSERT INTO public.modifier_groups (name, description, type, min_select, max_select) VALUES
        ('Sauce Options', 'Choose your preferred sauce', 'addon', 0, 3);
    END IF;

    -- Get modifier group IDs
    SELECT id INTO pizza_size_group_id FROM public.modifier_groups WHERE name = 'Pizza Size';
    SELECT id INTO burger_extras_group_id FROM public.modifier_groups WHERE name = 'Burger Extras';
    SELECT id INTO drink_size_group_id FROM public.modifier_groups WHERE name = 'Drink Size';
    SELECT id INTO sauce_options_group_id FROM public.modifier_groups WHERE name = 'Sauce Options';

    -- Insert modifiers (check if they exist first)
    -- Pizza Size modifiers
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = pizza_size_group_id AND name = 'Small (25cm)') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (pizza_size_group_id, 'Small (25cm)', 'add', -10.00, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = pizza_size_group_id AND name = 'Medium (30cm)') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (pizza_size_group_id, 'Medium (30cm)', 'add', 0.00, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = pizza_size_group_id AND name = 'Large (35cm)') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (pizza_size_group_id, 'Large (35cm)', 'add', 15.00, 2);
    END IF;

    -- Burger Extras modifiers
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = burger_extras_group_id AND name = 'Extra Cheese') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (burger_extras_group_id, 'Extra Cheese', 'add', 8.00, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = burger_extras_group_id AND name = 'Bacon') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (burger_extras_group_id, 'Bacon', 'add', 12.00, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = burger_extras_group_id AND name = 'Avocado') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (burger_extras_group_id, 'Avocado', 'add', 10.00, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = burger_extras_group_id AND name = 'Extra Patty') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (burger_extras_group_id, 'Extra Patty', 'add', 25.00, 3);
    END IF;

    -- Drink Size modifiers
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = drink_size_group_id AND name = 'Small') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (drink_size_group_id, 'Small', 'add', -5.00, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = drink_size_group_id AND name = 'Medium') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (drink_size_group_id, 'Medium', 'add', 0.00, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = drink_size_group_id AND name = 'Large') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (drink_size_group_id, 'Large', 'add', 8.00, 2);
    END IF;

    -- Sauce Options modifiers
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = sauce_options_group_id AND name = 'Ketchup') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (sauce_options_group_id, 'Ketchup', 'add', 0.00, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = sauce_options_group_id AND name = 'Mayo') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (sauce_options_group_id, 'Mayo', 'add', 0.00, 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = sauce_options_group_id AND name = 'BBQ Sauce') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (sauce_options_group_id, 'BBQ Sauce', 'add', 2.00, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.modifiers WHERE group_id = sauce_options_group_id AND name = 'Hot Sauce') THEN
        INSERT INTO public.modifiers (group_id, name, kind, price_delta, sort_index) VALUES
        (sauce_options_group_id, 'Hot Sauce', 'add', 2.00, 3);
    END IF;

    -- Link modifier groups to products (check if they exist first)
    -- Margherita Pizza -> Pizza Size
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Margherita Pizza') AND group_id = pizza_size_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, pizza_size_group_id, 0, true
        FROM public.products p WHERE p.name = 'Margherita Pizza';
    END IF;
    
    -- Pepperoni Pizza -> Pizza Size
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Pepperoni Pizza') AND group_id = pizza_size_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, pizza_size_group_id, 0, true
        FROM public.products p WHERE p.name = 'Pepperoni Pizza';
    END IF;
    
    -- Cheese Burger -> Burger Extras + Sauce Options
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Cheese Burger') AND group_id = burger_extras_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, burger_extras_group_id, 0, false
        FROM public.products p WHERE p.name = 'Cheese Burger';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Cheese Burger') AND group_id = sauce_options_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, sauce_options_group_id, 1, false
        FROM public.products p WHERE p.name = 'Cheese Burger';
    END IF;
    
    -- Chicken Burger -> Burger Extras + Sauce Options
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Chicken Burger') AND group_id = burger_extras_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, burger_extras_group_id, 0, false
        FROM public.products p WHERE p.name = 'Chicken Burger';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Chicken Burger') AND group_id = sauce_options_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, sauce_options_group_id, 1, false
        FROM public.products p WHERE p.name = 'Chicken Burger';
    END IF;
    
    -- Coca Cola -> Drink Size
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Coca Cola') AND group_id = drink_size_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, drink_size_group_id, 0, true
        FROM public.products p WHERE p.name = 'Coca Cola';
    END IF;
    
    -- Coffee -> Drink Size
    IF NOT EXISTS (SELECT 1 FROM public.product_modifier_groups WHERE product_id = (SELECT id FROM public.products WHERE name = 'Coffee') AND group_id = drink_size_group_id) THEN
        INSERT INTO public.product_modifier_groups (product_id, group_id, sort_index, is_required)
        SELECT p.id, drink_size_group_id, 0, false
        FROM public.products p WHERE p.name = 'Coffee';
    END IF;

    -- Insert menucards (check if they exist first)
    IF NOT EXISTS (SELECT 1 FROM public.menucards WHERE name = 'Main Menu') THEN
        INSERT INTO public.menucards (name, description, sort_index) VALUES
        ('Main Menu', 'Our complete food and beverage menu', 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucards WHERE name = 'Lunch Special') THEN
        INSERT INTO public.menucards (name, description, sort_index) VALUES
        ('Lunch Special', 'Quick lunch options available 11-15', 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucards WHERE name = 'Beverages Only') THEN
        INSERT INTO public.menucards (name, description, sort_index) VALUES
        ('Beverages Only', 'Just drinks and refreshments', 2);
    END IF;

    -- Link categories to menucards (check if they exist first)
    -- Main Menu
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Main Menu') AND category_id = pizza_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, pizza_cat_id, 0
        FROM public.menucards mc WHERE mc.name = 'Main Menu';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Main Menu') AND category_id = burgers_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, burgers_cat_id, 1
        FROM public.menucards mc WHERE mc.name = 'Main Menu';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Main Menu') AND category_id = salads_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, salads_cat_id, 2
        FROM public.menucards mc WHERE mc.name = 'Main Menu';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Main Menu') AND category_id = beverages_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, beverages_cat_id, 3
        FROM public.menucards mc WHERE mc.name = 'Main Menu';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Main Menu') AND category_id = desserts_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, desserts_cat_id, 4
        FROM public.menucards mc WHERE mc.name = 'Main Menu';
    END IF;

    -- Lunch Special
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Lunch Special') AND category_id = burgers_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, burgers_cat_id, 0
        FROM public.menucards mc WHERE mc.name = 'Lunch Special';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Lunch Special') AND category_id = salads_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, salads_cat_id, 1
        FROM public.menucards mc WHERE mc.name = 'Lunch Special';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Lunch Special') AND category_id = beverages_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, beverages_cat_id, 2
        FROM public.menucards mc WHERE mc.name = 'Lunch Special';
    END IF;

    -- Beverages Only
    IF NOT EXISTS (SELECT 1 FROM public.menucard_categories WHERE menucard_id = (SELECT id FROM public.menucards WHERE name = 'Beverages Only') AND category_id = beverages_cat_id) THEN
        INSERT INTO public.menucard_categories (menucard_id, category_id, sort_index)
        SELECT mc.id, beverages_cat_id, 0
        FROM public.menucards mc WHERE mc.name = 'Beverages Only';
    END IF;

END $$;
