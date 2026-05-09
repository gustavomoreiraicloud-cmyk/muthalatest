import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  Search,
  ShoppingBag,
  ArrowLeft,
  Award,
} from "lucide-react";
import { formatBRL } from "@/hooks/useCart";
import muthalaLogo from "@/assets/muthala-logo.png";

const STATUS_MAP = {
  novo: { label: "Novo Pedido", icon: ShoppingBag, color: "text-blue-400" },
  preparo: { label: "Preparando", icon: Clock, color: "text-yellow-400" },
  entrega: { label: "Saiu para Entrega", icon: Truck, color: "text-orange-400" },
  finalizado: { label: "Entregue", icon: CheckCircle2, color: "text-green-400" },
  cancelado: { label: "Cancelado", icon: PackageCheck, color: "text-destructive" },
};

export default function OrderStatus() {
  const { user } = useAuth();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        setUserProfile(data);
      };
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const ph = params.get("phone");
    if (id) setOrderId(id);
    if (ph) setPhone(ph);
    if (id && ph) fetchOrder(id, ph);
  }, []);

  const fetchOrder = async (id: string, ph: string) => {
    if (!id && !ph) return;
    setLoading(true);
    setSearched(true);

    const orderNum = id ? parseInt(id) : null;
    
    // Se ID for fornecido, deve ser numérico de 4 dígitos (opcional se ph estiver presente)
    if (id && !(/^\d+$/.test(id))) {
      setLoading(false);
      setOrder(null);
      return;
    }

    const { data, error } = await supabase.rpc("lookup_order_status", {
      _order_number: orderNum ?? undefined,
      _phone: ph || undefined,
    });

    const found = Array.isArray(data) && data.length > 0 ? data[0] : null;

    if (found) {
      setOrder(found);
      const channel = supabase
        .channel(`order-status-${found.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${found.id}`,
          },
          (payload) => {
            const updatedOrder = payload.new as any;
            setOrder((prev: any) => ({ ...prev, ...updatedOrder }));

            if (updatedOrder.status !== found.status) {
              const statusInfo = (STATUS_MAP as any)[updatedOrder.status];
              if (Notification.permission === "granted") {
                new Notification(`Muthala Burger: ${statusInfo?.label || updatedOrder.status}`, {
                  body: `Seu pedido #${updatedOrder.order_number} mudou de status!`,
                  icon: "/muthala-logo.png",
                });
              }
            }
          },
        )
        .subscribe();

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      return () => {
        supabase.removeChannel(channel);
      };
    }

    setLoading(false);
    // Silently handle error for production
    // if (error) console.error(error);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId, phone);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-6">
          <a href="/" className="group transition-transform hover:scale-110 duration-300">
            <img src={muthalaLogo} alt="Muthala Logo" className="w-24 h-24 object-contain" />
          </a>
          <div className="text-center space-y-1">
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tighter leading-none">
              <span className="font-serif-italic normal-case text-gradient-fire">MUTHALA</span>{" "}
              Burguer
            </h1>
            <p className="text-[10px] text-primary font-bold tracking-[0.3em] uppercase opacity-80">
              O Sabor dos Deuses
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Button>
        </div>

        {!order && !loading && (
          <Card className="p-6 bg-card border-border">
            <h2 className="font-bold mb-4">Acompanhar Pedido</h2>
            <form onSubmit={handleSearch} className="space-y-3">
              <Input
                placeholder="Número do pedido (ex: 5821)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="bg-background"
              />
              <Input
                placeholder="Seu telefone (ex: 18999998888)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" className="w-full gap-2">
                <Search className="w-4 h-4" /> Buscar
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 italic">
              Informe o número do pedido OU o telefone usado no pedido para acompanhar.
            </p>
            {searched && !order && (
              <p className="text-xs text-destructive mt-2">
                Pedido não encontrado ou telefone incorreto.
              </p>
            )}
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
                      <div
                        className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 ${s.color}`}
                      >
                        <Icon className="w-10 h-10" />
                      </div>
                      <h3 className="font-display text-3xl uppercase">{s.label}</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {order.status === "novo" && "Novo Pedido recebido."}
                        {order.status === "preparo" &&
                          "Seu lanche está sendo preparado com maestria."}
                        {order.status === "entrega" &&
                          "Um guerreiro está a caminho do seu endereço."}
                        {order.status === "finalizado" && "Pedido entregue. Bom apetite!"}
                        {order.status === "cancelado" && "Este pedido foi cancelado."}
                      </p>

                      {["novo", "preparo"].includes(order.status) && (
                        <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 w-full">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                            Previsão de Entrega
                          </p>
                          <p className="text-2xl font-display text-primary">45 - 60 min</p>
                          <p className="text-[10px] text-muted-foreground mt-1 italic">
                            Ajustado de acordo com a fila de pedidos atual.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-border mt-6 pt-6 space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 border-b border-border/50 pb-2">
                    Detalhes do Pedido
                  </h4>
                  <ul className="space-y-2">
                    {order.items?.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span>
                          {item.qty}x {item.name}
                        </span>
                        <span className="font-bold">
                          {formatBRL(Number(item.price) * item.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-bold">Total</span>
                  <span className="font-display text-2xl text-primary">
                    {formatBRL(Number(order.total))}
                  </span>
                </div>
              </div>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setOrder(null);
                setSearched(false);
                setOrderId("");
              }}
            >
              Consultar outro pedido
            </Button>
          </div>
        )}

        {searched && !loading && !order && (
          <div className="text-center py-8">
            <p className="text-destructive font-bold mb-4">Pedido não encontrado.</p>
            <Button variant="outline" onClick={() => setSearched(false)}>
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
