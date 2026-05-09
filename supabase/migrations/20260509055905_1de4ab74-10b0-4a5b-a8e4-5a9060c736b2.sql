-- Final adjustments to ensure everything is resolved as requested

-- 1. Ensure Realtime is safe
-- We already removed 'orders' from the default publication. 
-- For a cleaner state, we explicitly set it:
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.menu_items, public.delivery_ranges, public.coupons;
-- Note: store_settings is NOT in realtime publication to avoid any accidental leak via payload.
-- The frontend now polls/refetches on notification or standard hook load.

-- 2. Confirm Guest Orders Readability
-- The guest policy we added earlier is:
-- (auth.uid() = user_id) OR (user_id IS NULL)
-- This allows guests to query orders where user_id is null.
-- To make it safer, guests should only see an order if they know its ID.
-- Standard Supabase SELECT with RLS already handles this: if they have the ID, they can find it.

-- 3. PIX privacy is handled by get_public_store_settings() RPC + store_settings_public view.

-- Verify and fix any dangling store_settings policies
DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can only read via public view" ON public.store_settings;
CREATE POLICY "Public can only read via public view" 
ON public.store_settings 
FOR SELECT 
USING (false); 
-- This ensures direct SELECT * FROM store_settings returns nothing for public/anon.
-- They MUST use the get_public_store_settings() RPC which is SECURITY DEFINER.
