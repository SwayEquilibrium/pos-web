-- Comprehensive Audit Logging & Scalability System for POS
-- Run this in Supabase SQL Editor after the main schema

-- ============================================================================
-- AUDIT LOGGING SYSTEM
-- ============================================================================

-- Audit log table to track all database changes
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  record_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- User activity log for tracking user actions
create table if not exists public.user_activity_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  details jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz not null default now()
);

-- Payment tracking with detailed audit trail
create table if not exists public.payment_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  payment_method text not null check (payment_method in ('cash', 'card', 'mobile_pay', 'bank_transfer', 'other')),
  amount numeric(12,2) not null,
  currency text not null default 'DKK',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  transaction_reference text,
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Settings change log
create table if not exists public.settings_change_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  setting_category text not null,
  setting_key text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

-- System performance metrics
create table if not exists public.system_metrics (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  metric_name text not null,
  metric_value numeric,
  metric_data jsonb,
  recorded_at timestamptz not null default now()
);

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Generic audit trigger function
create or replace function public.audit_trigger_function()
returns trigger language plpgsql security definer as $$
declare
  audit_data jsonb;
  company_id_val uuid;
  user_id_val uuid;
  changed_fields text[] := '{}';
  old_data jsonb := '{}';
  new_data jsonb := '{}';
begin
  -- Get current user
  user_id_val := auth.uid();
  
  -- Try to extract company_id from the record
  if TG_OP = 'DELETE' then
    if OLD ? 'company_id' then
      company_id_val := (OLD->>'company_id')::uuid;
    end if;
    old_data := to_jsonb(OLD);
  else
    if NEW ? 'company_id' then
      company_id_val := (NEW->>'company_id')::uuid;
    end if;
    new_data := to_jsonb(NEW);
  end if;
  
  -- For updates, compare old and new values
  if TG_OP = 'UPDATE' then
    old_data := to_jsonb(OLD);
    
    -- Find changed fields
    select array_agg(key) into changed_fields
    from jsonb_each_text(new_data) n
    join jsonb_each_text(old_data) o on n.key = o.key
    where n.value != o.value;
  end if;
  
  -- Insert audit record
  insert into public.audit_logs (
    company_id,
    user_id,
    table_name,
    operation,
    record_id,
    old_data,
    new_data,
    changed_fields,
    ip_address,
    user_agent
  ) values (
    company_id_val,
    user_id_val,
    TG_TABLE_NAME,
    TG_OP,
    coalesce((NEW->>'id')::uuid, (OLD->>'id')::uuid),
    old_data,
    new_data,
    changed_fields,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  -- Return appropriate record
  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

-- Apply audit triggers to key tables
drop trigger if exists audit_companies on public.companies;
create trigger audit_companies
  after insert or update or delete on public.companies
  for each row execute function public.audit_trigger_function();

drop trigger if exists audit_user_profiles on public.user_profiles;
create trigger audit_user_profiles
  after insert or update or delete on public.user_profiles
  for each row execute function public.audit_trigger_function();

drop trigger if exists audit_orders on public.orders;
create trigger audit_orders
  after insert or update or delete on public.orders
  for each row execute function public.audit_trigger_function();

drop trigger if exists audit_order_items on public.order_items;
create trigger audit_order_items
  after insert or update or delete on public.order_items
  for each row execute function public.audit_trigger_function();

drop trigger if exists audit_products on public.products;
create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.audit_trigger_function();

drop trigger if exists audit_categories on public.categories;
create trigger audit_categories
  after insert or update or delete on public.categories
  for each row execute function public.audit_trigger_function();

-- ============================================================================
-- PAYMENT TRACKING SYSTEM
-- ============================================================================

-- Enhanced orders table with payment tracking
alter table public.orders 
add column if not exists payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded', 'cancelled')),
add column if not exists payment_method text,
add column if not exists paid_amount numeric(12,2) default 0,
add column if not exists paid_at timestamptz,
add column if not exists paid_by uuid references auth.users(id);

-- Update trigger for payment_logs
drop trigger if exists trg_payment_logs_updated on public.payment_logs;
create trigger trg_payment_logs_updated 
  before update on public.payment_logs 
  for each row execute procedure public.set_updated_at();

-- Function to process payment
create or replace function public.process_payment(
  p_order_id uuid,
  p_payment_method text,
  p_amount numeric,
  p_transaction_reference text default null
) returns uuid language plpgsql security definer as $$
declare
  v_payment_id uuid;
  v_order record;
  v_user_id uuid := auth.uid();
  v_company_id uuid;
begin
  -- Get order details
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
  
  -- Get company_id from user profile
  select company_id into v_company_id 
  from public.user_profiles 
  where id = v_user_id;
  
  -- Create payment log
  insert into public.payment_logs (
    company_id,
    order_id,
    payment_method,
    amount,
    status,
    transaction_reference,
    processed_by,
    processed_at
  ) values (
    v_company_id,
    p_order_id,
    p_payment_method,
    p_amount,
    'completed',
    p_transaction_reference,
    v_user_id,
    now()
  ) returning id into v_payment_id;
  
  -- Update order status
  update public.orders set
    payment_status = case 
      when (paid_amount + p_amount) >= (
        select sum(unit_price * qty) from public.order_items where order_id = p_order_id
      ) then 'paid'
      else 'partial'
    end,
    payment_method = p_payment_method,
    paid_amount = coalesce(paid_amount, 0) + p_amount,
    paid_at = case when paid_at is null then now() else paid_at end,
    paid_by = case when paid_by is null then v_user_id else paid_by end,
    status = case when status = 'open' then 'paid' else status end
  where id = p_order_id;
  
  -- Log user activity
  insert into public.user_activity_logs (
    company_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) values (
    v_company_id,
    v_user_id,
    'payment_processed',
    'order',
    p_order_id,
    jsonb_build_object(
      'payment_method', p_payment_method,
      'amount', p_amount,
      'transaction_reference', p_transaction_reference
    )
  );
  
  return v_payment_id;
end;
$$;

-- ============================================================================
-- SETTINGS MANAGEMENT
-- ============================================================================

-- Company settings table
create table if not exists public.company_settings (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  category text not null,
  key text not null,
  value jsonb not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, category, key)
);

-- Settings update trigger
drop trigger if exists trg_company_settings_updated on public.company_settings;
create trigger trg_company_settings_updated 
  before update on public.company_settings 
  for each row execute procedure public.set_updated_at();

-- Settings change logging trigger
create or replace function public.log_settings_change()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'UPDATE' and OLD.value != NEW.value then
    insert into public.settings_change_logs (
      company_id,
      user_id,
      setting_category,
      setting_key,
      old_value,
      new_value
    ) values (
      NEW.company_id,
      auth.uid(),
      NEW.category,
      NEW.key,
      OLD.value,
      NEW.value
    );
  end if;
  
  return NEW;
end;
$$;

drop trigger if exists log_settings_changes on public.company_settings;
create trigger log_settings_changes
  after update on public.company_settings
  for each row execute function public.log_settings_change();

-- Function to update company setting
create or replace function public.update_company_setting(
  p_category text,
  p_key text,
  p_value jsonb,
  p_description text default null
) returns void language plpgsql security definer as $$
declare
  v_company_id uuid;
  v_user_id uuid := auth.uid();
begin
  -- Get company_id from user profile
  select company_id into v_company_id 
  from public.user_profiles 
  where id = v_user_id;
  
  if v_company_id is null then
    raise exception 'User not associated with any company';
  end if;
  
  -- Insert or update setting
  insert into public.company_settings (company_id, category, key, value, description)
  values (v_company_id, p_category, p_key, p_value, p_description)
  on conflict (company_id, category, key) do update set
    value = p_value,
    description = coalesce(p_description, company_settings.description),
    updated_at = now();
  
  -- Log user activity
  insert into public.user_activity_logs (
    company_id,
    user_id,
    action,
    resource_type,
    details
  ) values (
    v_company_id,
    v_user_id,
    'setting_updated',
    'company_setting',
    jsonb_build_object(
      'category', p_category,
      'key', p_key,
      'value', p_value
    )
  );
end;
$$;

-- ============================================================================
-- SCALABILITY IMPROVEMENTS
-- ============================================================================

-- Indexes for performance
create index if not exists idx_audit_logs_company_created on public.audit_logs(company_id, created_at desc);
create index if not exists idx_audit_logs_table_operation on public.audit_logs(table_name, operation);
create index if not exists idx_audit_logs_user_created on public.audit_logs(user_id, created_at desc);

create index if not exists idx_user_activity_company_created on public.user_activity_logs(company_id, created_at desc);
create index if not exists idx_user_activity_user_action on public.user_activity_logs(user_id, action);
create index if not exists idx_user_activity_resource on public.user_activity_logs(resource_type, resource_id);

create index if not exists idx_payment_logs_company_created on public.payment_logs(company_id, created_at desc);
create index if not exists idx_payment_logs_order_status on public.payment_logs(order_id, status);
create index if not exists idx_payment_logs_processed_at on public.payment_logs(processed_at desc) where processed_at is not null;

create index if not exists idx_orders_company_status on public.orders(company_id, status);
create index if not exists idx_orders_payment_status on public.orders(payment_status, created_at desc);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);
create index if not exists idx_order_items_fire_state on public.order_items(fire_state, created_at);

create index if not exists idx_products_category_active on public.products(category_id, active);
create index if not exists idx_products_name_search on public.products using gin(to_tsvector('danish', name));

create index if not exists idx_companies_cvr on public.companies(cvr);
create index if not exists idx_user_profiles_company_role on public.user_profiles(company_id, role);

-- Partitioning for large tables (optional, for high-volume systems)
-- This would be implemented later if needed

-- ============================================================================
-- RLS POLICIES FOR AUDIT TABLES
-- ============================================================================

alter table public.audit_logs enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.payment_logs enable row level security;
alter table public.settings_change_logs enable row level security;
alter table public.company_settings enable row level security;

-- Audit logs: Users can only see their company's audit logs
create policy "Users can view company audit logs" on public.audit_logs
  for select using (
    company_id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  );

-- User activity logs: Users can see their company's activity
create policy "Users can view company activity logs" on public.user_activity_logs
  for select using (
    company_id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  );

-- Payment logs: Users can see their company's payments
create policy "Users can view company payment logs" on public.payment_logs
  for select using (
    company_id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  );

-- Settings: Users can view and update their company's settings
create policy "Users can view company settings" on public.company_settings
  for select using (
    company_id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  );

create policy "Users can update company settings" on public.company_settings
  for all using (
    company_id in (
      select company_id from public.user_profiles 
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to log user activity manually
create or replace function public.log_user_activity(
  p_action text,
  p_resource_type text default null,
  p_resource_id uuid default null,
  p_details jsonb default '{}'::jsonb
) returns void language plpgsql security definer as $$
declare
  v_company_id uuid;
  v_user_id uuid := auth.uid();
begin
  -- Get company_id from user profile
  select company_id into v_company_id 
  from public.user_profiles 
  where id = v_user_id;
  
  insert into public.user_activity_logs (
    company_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) values (
    v_company_id,
    v_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
end;
$$;

-- Function to get audit trail for a record
create or replace function public.get_audit_trail(
  p_table_name text,
  p_record_id uuid
) returns table (
  operation text,
  changed_fields text[],
  old_data jsonb,
  new_data jsonb,
  changed_by_email text,
  changed_at timestamptz
) language sql security definer as $$
  select 
    al.operation,
    al.changed_fields,
    al.old_data,
    al.new_data,
    au.email as changed_by_email,
    al.created_at as changed_at
  from public.audit_logs al
  left join auth.users au on al.user_id = au.id
  where al.table_name = p_table_name 
    and al.record_id = p_record_id
    and al.company_id in (
      select company_id from public.user_profiles 
      where id = auth.uid()
    )
  order by al.created_at desc;
$$;

-- Function to clean up old audit logs (run periodically)
create or replace function public.cleanup_old_audit_logs(
  p_days_to_keep integer default 365
) returns integer language plpgsql security definer as $$
declare
  deleted_count integer;
begin
  delete from public.audit_logs 
  where created_at < now() - interval '1 day' * p_days_to_keep;
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
