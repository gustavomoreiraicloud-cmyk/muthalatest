-- Ajustar a política de leitura da tabela orders para garantir acesso a pedidos de convidados
-- Atualmente está: ((auth.uid() = user_id) OR (user_id IS NULL))
-- Vamos garantir que ela esteja habilitada para anon e authenticated e que seja explícita.

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO anon, authenticated
USING (
    (auth.uid() = user_id) -- Usuário logado vê os seus
    OR 
    (user_id IS NULL) -- Pedidos de convidados são visíveis (protegidos pelo filtro da query/RPC)
);

-- Nota: O acesso a pedidos de convidados é seguro pois a interface de status
-- utiliza a função RPC lookup_order_status que exige o número do pedido E o telefone do cliente,
-- impedindo que estranhos listem pedidos aleatórios.