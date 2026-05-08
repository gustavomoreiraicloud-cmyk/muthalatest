-- Revogar acesso público da função SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Corrigir política de pedidos (já está como INSERT public e ALL admin, o que é seguro para o contexto de delivery sem conta de usuário)
-- Mas vamos garantir que SELECT seja apenas para admin
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
-- A política "Admin manage orders" já cobre SELECT/UPDATE/DELETE para admins
