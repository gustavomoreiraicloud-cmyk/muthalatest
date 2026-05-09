-- Remove risky direct insert policy
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;

-- Fix privacy leak: unauthenticated users should NOT be able to see all guest orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins still have full access via their own policies