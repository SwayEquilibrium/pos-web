-- Create print_templates table for the printing system
CREATE TABLE IF NOT EXISTS public.print_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'kitchen',
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on type and is_default for efficient queries
CREATE INDEX IF NOT EXISTS idx_print_templates_type_default ON public.print_templates(type, is_default);

-- Insert default kitchen template
INSERT INTO public.print_templates (name, type, content, is_default) VALUES (
    'Default Kitchen',
    'kitchen',
    '[center][bold]KITCHEN ORDER[/bold][/center]
[newline]
Order: {orderNumber}
Time: {orderTime}
[newline]
[line]Items:[/line]
{items}
[newline]
[cut]',
    true
) ON CONFLICT DO NOTHING;

-- Insert default receipt template
INSERT INTO public.print_templates (name, type, content, is_default) VALUES (
    'Default Receipt',
    'receipt',
    '[center][bold]RECEIPT[/bold][/center]
[newline]
Order: {orderNumber}
Time: {orderTime}
[newline]
[line]Items:[/line]
{items}
[newline]
Total: {total}
[newline]
Thank you!
[cut]',
    true
) ON CONFLICT DO NOTHING;

-- Insert default bar template
INSERT INTO public.print_templates (name, type, content, is_default) VALUES (
    'Default Bar',
    'bar',
    '[center][bold]BAR ORDER[/bold][/center]
[newline]
Order: {orderNumber}
Time: {orderTime}
[newline]
[line]Drinks:[/line]
{items}
[newline]
[cut]',
    true
) ON CONFLICT DO NOTHING;
