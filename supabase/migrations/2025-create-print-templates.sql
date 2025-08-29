-- Create print_templates table for ESC/POS editor
CREATE TABLE IF NOT EXISTS print_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('receipt', 'kitchen')),
  content text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_print_templates_type ON print_templates(type);
CREATE INDEX IF NOT EXISTS idx_print_templates_default ON print_templates(is_default);

-- Insert default templates
INSERT INTO print_templates (name, type, content, is_default) VALUES
(
  'Default Kitchen Order',
  'kitchen',
  '[center][bold]KITCHEN ORDER[/bold][/center]
[newline]
Order: {order_number}
Table: {table_name}
Time: {timestamp}
[newline]
[line]
[newline]
{items}
[newline]
[line]
Total Items: {total_items}
Total Amount: {total_amount} DKK
[newline]
[center][bold]Please prepare this order[/bold][/center]
[center]Thank you![/center]
[newline]
[newline]
[newline]
[cut]',
  true
),
(
  'Default Customer Receipt',
  'receipt',
  '[center][bold]RECEIPT[/bold][/center]
[newline]
Order: {order_number}
Table: {table_name}
Time: {timestamp}
[newline]
[line]
[newline]
{items}
[newline]
[line]
[align_right][bold]TOTAL: {total_amount} DKK[/bold][/align_right]
[newline]
[center]Thank you for your order![/center]
[center]Please come again[/center]
[newline]
[newline]
[newline]
[cut]',
  true
);

-- Enable RLS
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on print_templates" ON print_templates
  FOR ALL USING (true);
