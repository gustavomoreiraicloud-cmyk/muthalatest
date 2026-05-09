-- Função para adicionar pontos ao finalizar pedido
CREATE OR REPLACE FUNCTION public.handle_order_completion_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Só adiciona pontos se o pedido for finalizado e tiver um user_id associado
    IF NEW.status = 'finalizado' AND OLD.status != 'finalizado' AND NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET points = points + FLOOR(NEW.total * 0.05) -- 5% do total em pontos (1 ponto = 1 real de cashback para simplificar ou proporcional)
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para pontos
CREATE OR REPLACE TRIGGER on_order_finalized_points
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_completion_points();

-- Adicionar campo para usar pontos no place_order se necessário no futuro
-- Por enquanto vamos focar no ganho automático.
