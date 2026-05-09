import { useEffect, useState, useRef } from "react";
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
  ChefHat,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { formatBRL } from "@/hooks/useCart";
import muthalaLogo from "@/assets/muthala-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STATUS_MAP = {
  novo: { label: "Recebido", icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-400/10", step: 0 },
  preparo: { label: "Na Cozinha", icon: ChefHat, color: "text-yellow-400", bg: "bg-yellow-400/10", step: 1 },
  entrega: { label: "Em Rota", icon: Truck, color: "text-orange-400", bg: "bg-orange-400/10", step: 2 },
  finalizado: { label: "Entregue", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", step: 3 },
  cancelado: { label: "Cancelado", icon: PackageCheck, color: "text-destructive", bg: "bg-destructive/10", step: -1 },
};

export default function OrderStatus() {
  const { user: _user } = useAuth();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const ph = params.get("phone");
    if (id) setOrderId(id);
    if (ph) setPhone(ph);
    
    // Se não tiver na URL, tenta pegar do localStorage
    const savedId = localStorage.getItem("last_order_number");
    const savedPh = localStorage.getItem("last_order_phone");

    if (id && ph) {
      fetchOrder(id, ph);
    } else if (savedId && savedPh) {
      setOrderId(savedId);
      setPhone(savedPh);
      fetchOrder(savedId, savedPh);
    }

    if (!audioRef.current) {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audioRef.current.load();
    }
  }, []);

  const fetchOrder = async (id: string, ph: string) => {
    if (!id && !ph) return;
    setLoading(true);
    setSearched(true);

    const orderNum = id ? parseInt(id) : null;
    
    if (id && !(/^\d+$/.test(id))) {
      setLoading(false);
      setOrder(null);
      return;
    }

    const { data, error } = await supabase.rpc("lookup_order_status", {
      _order_number: orderNum || 0,
      _phone: ph || "",
    });

    const found = Array.isArray(data) && data.length > 0 ? data[0] : null;

    if (found) {
      setOrder(found);
      setLoading(false);
      
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

            const statusInfo = (STATUS_MAP as any)[updatedOrder.status];
            
            // Tocar som e notificar
            const playSound = () => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            };
            
            playSound();
            // Toca novamente após 1s para garantir que o cliente ouça
            setTimeout(playSound, 1500);
            
            toast.info(`Pedido #${updatedOrder.order_number}: ${statusInfo?.label || updatedOrder.status}`, {
              description: "O status do seu pedido foi atualizado!"
            });

            if (Notification.permission === "granted") {
              new Notification(`Muthala Burger: ${statusInfo?.label || updatedOrder.status}`, {
                body: `Seu pedido #${updatedOrder.order_number} mudou de status!`,
                icon: "/muthala-logo.png",
              });
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
            <p className="text-xs text-muted-foreground mb-3">
              Informe o número do pedido <b>e</b> o telefone cadastrado:
            </p>
            <form onSubmit={handleSearch} className="space-y-3">
              <Input
                placeholder="Número do pedido (ex: 5821)"
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                }}
                className="bg-background"
              />
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                E
                <div className="flex-1 h-px bg-border" />
              </div>
              <Input
                placeholder="Seu telefone (ex: 18999998888)"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
                className="bg-background"
              />
              <Button type="submit" className="w-full gap-2" disabled={!orderId && !phone}>
                <Search className="w-4 h-4" /> Buscar
              </Button>
            </form>
            {searched && !order && (
              <p className="text-xs text-destructive mt-3">
                Pedido não encontrado.
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
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <Card className="bg-card border-border overflow-hidden relative shadow-2xl">
              {/* Header do Status */}
              <div className="bg-muted/30 p-6 border-b border-border flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Número do Pedido
                  </p>
                  <h2 className="font-display text-2xl text-primary">#{order.order_number}</h2>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Data
                  </p>
                  <p className="font-bold text-sm">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Visual de Acompanhamento */}
              <div className="p-8">
                {(() => {
                  const s = (STATUS_MAP as any)[order.status] || STATUS_MAP.novo;
                  const Icon = s.icon;
                  const currentStep = s.step;
                  const isCancelled = order.status === 'cancelado';

                  return (
                    <div className="flex flex-col items-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={order.status}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className={`w-28 h-28 rounded-3xl ${s.bg} ${s.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20`}
                        >
                          <Icon className="w-14 h-14" />
                        </motion.div>
                      </AnimatePresence>
                      
                      <h3 className="font-display text-4xl uppercase mb-2 tracking-tighter">{s.label}</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                        {order.status === "novo" && "Recebemos seu pedido e já estamos agilizando tudo."}
                        {order.status === "preparo" && "O Chef já está com a mão na massa preparando seu burger."}
                        {order.status === "entrega" && "Seu pedido está fresquinho e a caminho do seu endereço."}
                        {order.status === "finalizado" && "Sua jornada termina com sabor! Bom apetite."}
                        {order.status === "cancelado" && "Infelizmente este pedido não pôde ser concluído."}
                      </p>

                      {/* Stepper Progressivo */}
                      {!isCancelled && (
                        <div className="w-full mt-10 relative flex justify-between items-center px-2">
                          {/* Linha de fundo */}
                          <div className="absolute h-1 left-8 right-8 bg-muted top-1/2 -translate-y-1/2 z-0" />
                          {/* Linha de progresso ativa */}
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / 3) * 100}%` }}
                            className="absolute h-1 left-8 bg-primary top-1/2 -translate-y-1/2 z-0 origin-left"
                            style={{ maxWidth: 'calc(100% - 64px)' }}
                          />

                          {[
                            { step: 0, icon: ShoppingBag },
                            { step: 1, icon: ChefHat },
                            { step: 2, icon: Truck },
                            { step: 3, icon: CheckCircle2 }
                          ].map((st, i) => {
                            const StepIcon = st.icon;
                            const isActive = currentStep >= st.step;
                            const isCurrent = currentStep === st.step;

                            return (
                              <div key={i} className="relative z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${
                                  isActive ? 'bg-primary border-primary text-black' : 'bg-background border-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                                  <StepIcon className="w-4 h-4" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Detalhes do Pedido Expandíveis ou Simples */}
              <div className="bg-muted/20 p-6 border-t border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Resumo do Pedido</span>
                </div>
                
                <ul className="space-y-3">
                  {order.items?.map((item: any, i: number) => (
                    <li key={i} className="flex flex-col">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold">{item.qty}x {item.name}</span>
                        <span className="text-sm font-display text-primary">{formatBRL(Number(item.price) * item.qty)}</span>
                      </div>
                      {item.options?.notes && (
                        <span className="text-[10px] italic text-muted-foreground mt-0.5">"{item.options.notes}"</span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-border/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">{formatBRL(Number(order.subtotal))}</span>
                  </div>
                  {Number(order.delivery_fee) > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Taxa de Entrega</span>
                      <span className="font-bold">{formatBRL(Number(order.delivery_fee))}</span>
                    </div>
                  )}
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>Desconto</span>
                      <span className="font-bold">-{formatBRL(Number(order.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-display uppercase">Total</span>
                    <span className="text-3xl font-display text-primary">{formatBRL(Number(order.total))}</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl font-bold uppercase text-xs border-border"
                onClick={() => {
                  setOrder(null);
                  setSearched(false);
                  setOrderId("");
                  window.history.pushState({}, '', '/status');
                }}
              >
                Buscar outro
              </Button>
              <Button
                className="h-12 rounded-xl font-bold uppercase text-xs bg-[hsl(142_76%_45%)] hover:bg-[hsl(142_76%_40%)] text-white"
                onClick={() => {
                  const msg = encodeURIComponent(`Olá, gostaria de informações sobre meu pedido #${order.order_number}`);
                  window.open(`https://wa.me/5518997962510?text=${msg}`);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
