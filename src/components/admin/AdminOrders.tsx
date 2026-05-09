import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Printer, Volume2, VolumeX, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/hooks/useCart";

type Order = {
  id: string;
  order_number: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  items: Array<{ name: string; qty: number; price: string; options?: any }>;
  subtotal: number | null;
  discount: number | null;
  delivery_fee: number | null;
  delivery_method: string | null;
  total: number;
  coupon_code: string | null;
  payment_method: string | null;
  needs_change: boolean | null;
  change_for: number | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  address_reference: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const PAY_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: "🆕 Novo", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  preparo: {
    label: "👨‍🍳 Preparando",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  },
  entrega: { label: "🛵 Entrega", color: "bg-orange-500/20 text-orange-300 border-orange-300/40" },
  finalizado: {
    label: "✅ Finalizado",
    color: "bg-green-500/20 text-green-300 border-green-500/40",
  },
  cancelado: { label: "❌ Cancelado", color: "bg-red-500/20 text-red-300 border-red-500/40" },
};

const STATUSES = Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[];

const SOUND_KEY = "muthala_admin_sound";
const NOTIFY_KEY = "muthala_admin_notify";
const AUTO_PRINT_KEY = "muthala_admin_auto_print";

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const sendPushNotification = (title: string, body: string) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body,
    icon: "/muthala-logo.png", // Usando o logo como ícone
    tag: "new-order",
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

// Referência global para o áudio para evitar recriação constante e facilitar o controle
let audioInstance: HTMLAudioElement | null = null;

const playBeep = () => {
  try {
    // No ambiente do navegador, precisamos de interação prévia do usuário.
    // Criamos o áudio apenas uma vez e reutilizamos.
    if (!audioInstance) {
      // Usando um som de notificação real (estilo campainha de balcão) que é mais audível que osciladores sintetizados
      audioInstance = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audioInstance.load();
    }
    
    // Reinicia e toca
    audioInstance.currentTime = 0;
    const playPromise = audioInstance.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Autoplay bloqueado pelo navegador. Interaja com a página primeiro.", error);
      });
    }
  } catch (err) {
    console.error("Erro ao tocar som:", err);
  }
};

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const printOrder = (o: Order) => {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) return;
  const itemsHtml = o.items
    .map((it) => {
      let opts = "";
      if (it.options && Object.keys(it.options).length > 0) {
        const details = [];
        if (it.options.burgerSize) details.push(`Tamanho: ${esc(it.options.burgerSize)}`);
        if (it.options.doneness) details.push(`Ponto: ${esc(it.options.doneness)}`);
        if (it.options.beverage) details.push(`Bebida: ${esc(it.options.beverage)}`);
        if (it.options.extras?.length)
          details.push(`Extras: ${esc((it.options.extras as unknown[]).map(String).join(", "))}`);
        if (it.options.notes) details.push(`Obs: ${esc(it.options.notes)}`);
        opts = `<div style="font-size:10px;margin-left:8px;color:#333">${details.join("<br/>")}</div>`;
      }
      return `<tr><td colspan="3"><b>${esc(it.qty)}x ${esc(it.name)}</b></td><td style="text-align:right">${esc(it.price)}</td></tr>
              <tr><td colspan="4">${opts}</td></tr>`;
    })
    .join("");
  const addr = [o.address_street, o.address_number].filter(Boolean).join(", ");
  w.document.write(`
    <html><head><title>Pedido #${esc(o.order_number ?? o.id.slice(0, 8))}</title>
    <style>
      body{font-family:monospace;width:280px;padding:8px;color:#000}
      h2{text-align:center;margin:4px 0}
      table{width:100%;border-collapse:collapse;font-size:12px}
      td{padding:2px 0;vertical-align:top}
      hr{border:none;border-top:1px dashed #000;margin:8px 0}
      .total{font-size:16px;font-weight:bold;text-align:right}
      .row{display:flex;justify-content:space-between;font-size:12px}
    </style></head><body>
      <h2>MUTHALA BURGER</h2>
      <p><b>Pedido #${esc(o.order_number ?? o.id.slice(0, 8))}</b></p>
      <p>${esc(new Date(o.created_at).toLocaleString("pt-BR"))}</p>
      <hr/>
      <p><b>MÉTODO:</b> ${o.delivery_method === "retirada" ? "RETIRADA NO LOCAL" : "ENTREGA"}</p>
      <p><b>CLIENTE</b><br/>${esc(o.customer_name || "—")}<br/>${esc(o.customer_phone || "—")}</p>
      <hr/>
      ${
        o.delivery_method !== "retirada"
          ? `
      <p><b>ENDEREÇO</b><br/>
        ${esc(addr || "—")}<br/>
        ${o.address_neighborhood ? `Bairro: ${esc(o.address_neighborhood)}<br/>` : ""}
        ${o.address_complement ? `Compl.: ${esc(o.address_complement)}<br/>` : ""}
        ${o.address_reference ? `Ref.: ${esc(o.address_reference)}` : ""}
      </p>
      <hr/>`
          : ""
      }
      <table>${itemsHtml}</table>
      <hr/>
      <div class="row"><span>Subtotal</span><span>${esc(formatBRL(Number(o.subtotal ?? o.total)))}</span></div>
      ${Number(o.discount) > 0 ? `<div class="row"><span>Desc${o.coupon_code ? ` (${esc(o.coupon_code)})` : ""}</span><span>-${esc(formatBRL(Number(o.discount)))}</span></div>` : ""}
      ${o.delivery_method !== "retirada" ? `<div class="row"><span>Entrega</span><span>${esc(formatBRL(Number(o.delivery_fee ?? 0)))}</span></div>` : ""}
      <p class="total">TOTAL: ${esc(formatBRL(Number(o.total)))}</p>
      <hr/>
      <p><b>PAGAMENTO:</b> ${esc(PAY_LABEL[o.payment_method ?? ""] ?? "—")}
      ${o.payment_method === "dinheiro" && o.change_for ? `<br/>Troco para ${esc(formatBRL(Number(o.change_for)))} (levar ${esc(formatBRL(Number(o.change_for) - Number(o.total)))})` : ""}
      </p>
      ${o.notes ? `<hr/><p><b>Obs Geral:</b> ${esc(o.notes)}</p>` : ""}
      <hr/>
      <p style="text-align:center">Obrigado! 🍔</p>
      <script>
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
          // Fallback para navegadores que não suportam onafterprint ou se o usuário cancelar
          setTimeout(() => window.close(), 10000);
        };
      </script>
    </body></html>
  `);
  w.document.close();
};

const printDailyReport = (orders: Order[], autoPrint: boolean = true) => {
  const today = new Date().toLocaleDateString("pt-BR");
  const finishedOrders = orders.filter(
    (o) =>
      o.status === "finalizado" &&
      new Date(o.created_at).toLocaleDateString("pt-BR") === today
  );

  const totalRevenue = finishedOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const totalOrders = finishedOrders.length;
  
  const paymentTotals: Record<string, number> = {};
  finishedOrders.forEach((o) => {
    const method = PAY_LABEL[o.payment_method ?? ""] ?? "Outros";
    paymentTotals[method] = (paymentTotals[method] || 0) + Number(o.total);
  });

  const productStats: Record<string, number> = {};
  finishedOrders.forEach((o) => {
    o.items?.forEach((it) => {
      productStats[it.name] = (productStats[it.name] || 0) + it.qty;
    });
  });

  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;

  w.document.write(`
    <html><head><title>Relatório Diário - ${today}</title>
    <style>
      body{font-family:monospace;width:300px;padding:10px;color:#000}
      h2, h3{text-align:center;margin:10px 0;text-transform:uppercase}
      .summary{border:1px solid #000;padding:8px;margin-bottom:15px}
      .row{display:flex;justify-content:space-between;font-size:12px;margin:2px 0}
      hr{border:none;border-top:1px dashed #000;margin:10px 0}
      table{width:100%;font-size:12px}
      .footer{text-align:center;font-size:10px;margin-top:20px}
    </style></head><body>
      <h2>MUTHALA BURGER</h2>
      <h3>RELATÓRIO DO DIA</h3>
      <p style="text-align:center">Data: ${today}</p>
      
      <div class="summary">
        <div class="row"><b>PEDIDOS FINALIZADOS:</b> <b>${totalOrders}</b></div>
        <div class="row"><b>TOTAL VENDIDO:</b> <b>${formatBRL(totalRevenue)}</b></div>
      </div>

      <h4>VENDAS POR PAGAMENTO</h4>
      ${Object.entries(paymentTotals)
        .map(([m, val]) => `<div class="row"><span>${esc(m)}</span><span>${esc(formatBRL(val))}</span></div>`)
        .join("")}

      <hr/>
      <h4>PRODUTOS MAIS VENDIDOS</h4>
      <table>
        ${Object.entries(productStats)
          .sort((a, b) => b[1] - a[1])
          .map(([name, qty]) => `<tr><td>${esc(qty)}x</td><td>${esc(name)}</td></tr>`)
          .join("")}
      </table>

      <hr/>
      <p class="footer">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
      <script>
        window.onload = () => {
          if (${autoPrint}) {
            window.print();
            window.onafterprint = () => window.close();
            // Fallback
            setTimeout(() => window.close(), 10000);
          }
        };
      </script>
    </body></html>
  `);
  w.document.close();
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== "0");
  const [notifyOn, setNotifyOn] = useState(() => localStorage.getItem(NOTIFY_KEY) === "1");
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem(AUTO_PRINT_KEY) === "1");
  const knownIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Erro ao carregar pedidos");
    const list = (data as unknown as Order[]) ?? [];
    setOrders(list);
    if (!initialLoadDone.current) {
      list.forEach((o) => knownIds.current.add(o.id));
      initialLoadDone.current = true;
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("orders-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new as Order;
        if (!knownIds.current.has(o.id)) {
          knownIds.current.add(o.id);
          if (soundOn) playBeep();
          if (notifyOn) {
            sendPushNotification(
              "🍔 NOVO PEDIDO!",
              `Novo pedido de ${o.customer_name || "cliente"} recebido agora.`,
            );
          }
          toast.success(`🔔 Novo pedido — ${o.customer_name || "cliente"}`);
        }
        load();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, notifyOn]);

  const updateStatus = async (id: string, status: string) => {
    const prev = orders;
    // Atualização otimista — UI muda na hora
    setOrders((curr) => curr.map((o) => (o.id === id ? { ...o, status } : o)));

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id");

    if (error) {
      setOrders(prev);
      return toast.error("Erro: " + error.message);
    }
    if (!data || data.length === 0) {
      setOrders(prev);
      return toast.error("Sem permissão. Faça login como administrador.");
    }

    // Se mudou para preparo e auto-print estiver ligado, imprime
    if ((status === "preparo" || status === "entrega") && autoPrint) {
      const order = prev.find((o) => o.id === id);
      if (order) printOrder(order);
    }

    toast.success("Pedido atualizado");
  };

  const toggleSound = (v: boolean) => {
    setSoundOn(v);
    localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    if (v) {
      toast.info("Som de alerta ativado! (Tocando teste...)");
      // Importante: a interação de clicar no switch permite que o áudio seja tocado
      playBeep();
    }
  };

  const toggleNotify = async (v: boolean) => {
    if (v) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error("Permissão de notificação negada pelo navegador");
        return;
      }
    }
    setNotifyOn(v);
    localStorage.setItem(NOTIFY_KEY, v ? "1" : "0");
    if (v) toast.success("Notificações de sistema ativadas");
  };

  const toggleAutoPrint = (v: boolean) => {
    setAutoPrint(v);
    localStorage.setItem(AUTO_PRINT_KEY, v ? "1" : "0");
    if (v) toast.success("Impressão automática ativada");
    else toast.info("Impressão automática desativada");
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  const activeOrders = orders.filter(
    (o) => o.status === "novo" || o.status === "preparo" || o.status === "entrega",
  );
  const finishedOrders = orders.filter(
    (o) => o.status === "finalizado" || o.status === "cancelado",
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl uppercase">Pedidos</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <label
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight cursor-pointer"
            title="Impressão automática ao aceitar"
          >
            <Printer className={`w-4 h-4 ${autoPrint ? "text-primary" : "text-muted-foreground"}`} />
            <span className="hidden sm:inline">Auto Imprimir</span>
            <Switch checked={autoPrint} onCheckedChange={toggleAutoPrint} />
          </label>

          <label
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight cursor-pointer"
            title="Notificação no sistema"
          >
            {notifyOn ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">Notificar</span>
            <Switch checked={notifyOn} onCheckedChange={toggleNotify} />
          </label>

          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight cursor-pointer" title="Aviso sonoro">
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">Sons</span>
            <Switch checked={soundOn} onCheckedChange={toggleSound} />
          </label>

          <Button variant="outline" size="sm" onClick={() => printDailyReport(orders, autoPrint)} className="font-bold uppercase text-xs h-8">
            <Printer className="w-3.5 h-3.5 mr-1" /> Relatório
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="font-bold h-8">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg h-10">
          <TabsTrigger value="ativos" className="text-xs uppercase font-bold">
            Ativos ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="entregando" className="text-xs uppercase font-bold">
            Entregando ({orders.filter(o => o.status === 'entrega').length})
          </TabsTrigger>
          <TabsTrigger value="finalizados" className="text-xs uppercase font-bold">
            Histórico ({finishedOrders.length})
          </TabsTrigger>
        </TabsList>

        {(["ativos", "entregando", "finalizados"] as const).map((tab) => {
          let list = [];
          if (tab === "ativos") list = activeOrders;
          else if (tab === "entregando") list = orders.filter(o => o.status === "entrega");
          else list = finishedOrders;

          return (
            <TabsContent key={tab} value={tab}>
              {list.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                  {tab === "ativos" ? "Nenhum pedido em andamento." : tab === "entregando" ? "Nenhum pedido em rota de entrega." : "Nenhum pedido finalizado ainda."}
                </Card>
              ) : (
                <div className="grid gap-4">
                  {list.map((o) => {
            const fullAddr = [o.address_street, o.address_number].filter(Boolean).join(", ");
            const mapsUrl = fullAddr
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${fullAddr}, ${o.address_neighborhood ?? ""}`)}`
              : null;
            const waUrl = o.customer_phone
              ? `https://wa.me/${o.customer_phone.replace(/\D/g, "")}`
              : null;

            return (
              <Card key={o.id} className="overflow-hidden bg-card border-border shadow-md">
                {/* Header do Card - Informações Principais */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border bg-muted/40">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary px-3 py-1.5 rounded-lg shadow-glow">
                      <span className="font-display text-2xl text-primary-foreground leading-none">
                        #{o.order_number ?? o.id.slice(0, 6)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-black text-2xl leading-none mb-1 tracking-tight text-foreground uppercase">
                        {o.customer_name || "Cliente"}
                      </h3>
                      <p className="text-xs font-bold text-primary flex items-center gap-1">
                        {new Date(o.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {o.customer_phone || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${STATUS_CONFIG[o.status]?.color ?? ""} px-3 py-1 text-xs uppercase font-black`}
                      variant="outline"
                    >
                      {STATUS_CONFIG[o.status]?.label ?? o.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                  {/* Coluna 1: Itens e Observações */}
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Itens do Pedido
                      </h4>
                      <ul className="space-y-3">
                        {o.items?.map((it, idx) => (
                          <li
                            key={idx}
                            className="bg-background border border-border/60 rounded-xl p-3 shadow-sm"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-black text-lg text-foreground leading-tight">
                                <span className="text-primary mr-1.5">{it.qty}×</span> {it.name}
                              </span>
                              <span className="font-bold text-sm text-muted-foreground whitespace-nowrap">
                                {it.price}
                              </span>
                            </div>
                            {it.options && Object.keys(it.options).length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-border/30 grid grid-cols-1 gap-1 text-[11px] font-medium text-muted-foreground">
                                {it.options.burgerSize && <span className="flex items-center gap-1.5"><span className="text-primary/70">📏</span> {it.options.burgerSize}</span>}
                                {it.options.doneness && <span className="flex items-center gap-1.5"><span className="text-primary/70">🔥</span> {it.options.doneness}</span>}
                                {it.options.beverage && <span className="flex items-center gap-1.5"><span className="text-primary/70">🥤</span> {it.options.beverage}</span>}
                                {it.options.extras && it.options.extras.length > 0 && (
                                  <span className="flex items-center gap-1.5"><span className="text-primary/70">➕</span> {it.options.extras.join(", ")}</span>
                                )}
                                {it.options.notes && (
                                  <span className="mt-1 p-2 bg-primary/5 rounded border border-primary/10 italic text-primary font-bold">
                                    📝 {it.options.notes}
                                  </span>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {o.notes && (
                      <div className="p-4 bg-orange-500/10 border-2 border-orange-500/20 rounded-xl">
                        <p className="text-xs font-black uppercase text-orange-400 mb-2 flex items-center gap-2">
                          📢 Observação do Cliente
                        </p>
                        <p className="text-sm font-bold italic leading-relaxed text-foreground">{o.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Coluna 2: Entrega e Pagamento */}
                  <div className="p-4 space-y-4 bg-muted/5">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Entrega e Contato
                      </h4>
                      {fullAddr ? (
                        <div className="space-y-2">
                          <div className="text-xs leading-relaxed">
                            <p className="font-bold">📍 {fullAddr}</p>
                            <p className="text-muted-foreground">
                              {o.address_neighborhood || "Bairro não informado"}
                            </p>
                            {(o.address_complement || o.address_reference) && (
                              <p className="text-[10px] mt-1 text-muted-foreground italic border-l-2 border-border pl-2">
                                {o.address_complement && `Compl: ${o.address_complement} `}
                                {o.address_reference && `Ref: ${o.address_reference}`}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {mapsUrl && (
                              <Button
                                asChild
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[10px] font-bold"
                              >
                                <a href={mapsUrl} target="_blank" rel="noreferrer">
                                  📍 Ver no Mapa
                                </a>
                              </Button>
                            )}
                            {waUrl && (
                              <Button
                                asChild
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[10px] font-bold text-green-500 hover:text-green-600"
                              >
                                <a href={waUrl} target="_blank" rel="noreferrer">
                                  💬 WhatsApp
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                        >
                          🏃 Retirada no Local
                        </Badge>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">
                            Pagamento
                          </p>
                          <p className="text-xs font-bold">
                            💳 {PAY_LABEL[o.payment_method ?? ""] ?? "—"}
                          </p>
                          {o.payment_method === "dinheiro" && o.change_for && (
                            <p className="text-[10px] text-orange-400 font-bold mt-0.5">
                              Troco p/ {formatBRL(Number(o.change_for))} (Levar{" "}
                              {formatBRL(Number(o.change_for) - Number(o.total))})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">
                            Total
                          </p>
                          <p className="font-display text-2xl text-primary leading-none">
                            {formatBRL(Number(o.total))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer do Card - Ações */}
                <div className="p-3 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printOrder(o)}
                      className="h-9 px-3"
                    >
                      <Printer className="w-4 h-4 mr-2" />{" "}
                      <span className="text-xs font-bold">Imprimir</span>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={o.status === s ? "default" : "outline"}
                        onClick={() => updateStatus(o.id, s)}
                        className={`h-9 px-3 text-[10px] uppercase font-black transition-all ${
                          o.status === s ? "bg-primary shadow-glow" : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
