-- ================================================
-- ADD MENUCARDS SUPPORT TO REORDER_ENTITIES RPC
-- This patch adds menucards table support to the existing RPC function
-- ================================================

-- Update the reorder_entities function to include menucards support
create or replace function public.reorder_entities(
  p_table text,           -- 'categories' | 'product_groups' | 'menucards' | 'product_modifier_groups' | 'menucard_categories'
  p_parent_id uuid,       -- nullable for categories/product_groups/menucards; required for relations
  p_ids uuid[],           -- new order list
  p_sort_start int default 0
) returns void language plpgsql security definer as $$
declare i int := 0; v_id uuid; 
begin
  if p_table = 'categories' then
    foreach v_id in array p_ids loop
      update public.categories set sort_index = p_sort_start + i, updated_at = now() where id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'product_groups' then
    foreach v_id in array p_ids loop
      update public.product_groups set sort_index = p_sort_start + i, updated_at = now() where id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'menucards' then
    foreach v_id in array p_ids loop
      update public.menucards set sort_index = p_sort_start + i, updated_at = now() where id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'product_modifier_groups' then
    -- parent is product_id
    foreach v_id in array p_ids loop
      update public.product_modifier_groups set sort_index = p_sort_start + i
      where product_id = p_parent_id and group_id = v_id;
      i := i + 1;
    end loop;
  elsif p_table = 'menucard_categories' then
    -- parent is menucard_id
    foreach v_id in array p_ids loop
      update public.menucard_categories set sort_index = p_sort_start + i
      where menucard_id = p_parent_id and category_id = v_id;
      i := i + 1;
    end loop;
  else
    raise exception 'Unsupported table %', p_table;
  end if;
end $$;
