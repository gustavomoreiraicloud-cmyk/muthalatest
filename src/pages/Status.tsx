import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Truck, PackageCheck, Search, ShoppingBag, ArrowLeft } from "lucide-react";
import { formatBRL } from "@/hooks/useCart";

const STATUS_MAP = {
  novo: { label: "Recebido", icon: ShoppingBag, color: "text-blue-400" },
  preparo: { label: "Em Preparo", icon: Clock, color: "text-yellow-400" },
  entrega: { label: "Saiu para Entrega", icon: Truck, color: "text-orange-400" },
  finalizado: { label: "Entregue", icon: PackageCheck, color: "text-green-400" },
  cancelado: { label: "Cancelado", icon: PackageCheck, color: "text-destructive" },
};

export default function OrderStatus() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setOrderId(id);
      fetchOrder(id);
    }
  }, []);

  const fetchOrder = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setSearched(true);
    
    // Tentar buscar por ID (UUID) ou por Número do Pedido (4 dígitos)
    let query = supabase.from("orders").select("*");
    
    if (id.length === 4 && /^\d+$/.test(id)) {
      query = query.eq("order_number", parseInt(id));
    } else {
      query = query.eq("id", id);
    }

    const { data, error } = await query.maybeSingle();
    
    setOrder(data);
    setLoading(false);
    if (error) console.error(error);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <h1 className="font-display text-2xl uppercase">Muthala Burger</h1>
        </div>

        {!order && !loading && (
          <Card className="p-6 bg-card border-border">
            <h2 className="font-bold mb-4">Acompanhar Pedido</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                placeholder="Ex: 5821" 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 italic">
              Digite o número de 4 dígitos que apareceu na tela após você finalizar o seu pedido.
            </p>
          </Card>
        )}

        {loading && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto animate-spin text-primary opacity-50 mb-4" />
            <p className="font-bold">Buscando seu pedido...</p>
          </div>
        )}

        {order && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 bg-card border-border overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted/50 px-2 py-1 rounded">
                  #{order.order_number}
                </span>
              </div>
              
              <div className="flex flex-col items-center text-center py-4">
                {(() => {
                  const s = (STATUS_MAP as any)[order.status] || STATUS_MAP.novo;
                  const Icon = s.icon;
                  return (
                    <>
                      <div className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 ${s.color}`}>
                        <Icon className="w-10 h-10" />
                      </div>
                      <h3 className="font-display text-3xl uppercase">{s.label}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {order.status === 'novo' && "Estamos recebendo seu pedido."}
                        {order.status === 'preparo' && "Seu lanche está sendo forjado com maestria."}
                        {order.status === 'entrega' && "Um guerreiro está a caminho do seu endereço."}
                        {order.status === 'finalizado' && "Pedido entregue. Bom apetite!"}
                        {order.status === 'cancelado' && "Este pedido foi cancelado."}
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-border mt-6 pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Resumo</h4>
                  <ul className="space-y-2">
                    {order.items?.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>{item.qty}x {item.name}</span>
                        <span className="font-bold">{formatBRL(Number(item.price) * item.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-bold">Total</span>
                  <span className="font-display text-2xl text-primary">{formatBRL(Number(order.total))}</span>
                </div>
              </div>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => { setOrder(null); setSearched(false); setOrderId(""); }}>
              Consultar outro pedido
            </Button>
          </div>
        )}

        {searched && !loading && !order && (
          <div className="text-center py-8">
            <p className="text-destructive font-bold mb-4">Pedido não encontrado.</p>
            <Button variant="outline" onClick={() => setSearched(false)}>Tentar novamente</Button>
          </div>
        )}
      </div>
    </div>
  );
}
