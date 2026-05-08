import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  preparo: { label: "👨‍🍳 Preparando", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  entrega: { label: "🛵 Entrega", color: "bg-orange-500/20 text-orange-300 border-orange-300/40" },
  finalizado: { label: "✅ Finalizado", color: "bg-green-500/20 text-green-300 border-green-500/40" },
  cancelado: { label: "❌ Cancelado", color: "bg-red-500/20 text-red-300 border-red-500/40" },
};

const STATUSES = Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[];

const SOUND_KEY = "muthala_admin_sound";
const NOTIFY_KEY = "muthala_admin_notify";

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

// Som de notificação mais longo e chamativo
const playBeep = () => {
  try {
    // Usar um elemento de áudio real se possível, ou melhorar o AudioContext
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playNote = (freq: number, start: number, duration: number, type: OscillatorType = "sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = type;
      o.frequency.value = freq;
      
      // Envelope de volume
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + duration + 0.1);
    };

    // Sequência mais "alerta" (estilo sirene/campainha forte)
    playNote(880, 0, 0.5, "triangle");
    playNote(880, 0.6, 0.5, "triangle");
    playNote(880, 1.2, 0.8, "triangle");
  } catch (err) {
    console.error("Erro ao tocar som:", err);
  }
};

const printOrder = (o: Order) => {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) return;
  const itemsHtml = o.items
    .map((it) => {
      let opts = "";
      if (it.options && Object.keys(it.options).length > 0) {
        const details = [];
        if (it.options.burgerSize) details.push(`Tamanho: ${it.options.burgerSize}`);
        if (it.options.doneness) details.push(`Ponto: ${it.options.doneness}`);
        if (it.options.beverage) details.push(`Bebida: ${it.options.beverage}`);
        if (it.options.extras?.length) details.push(`Extras: ${it.options.extras.join(", ")}`);
        if (it.options.notes) details.push(`Obs: ${it.options.notes}`);
        opts = `<div style="font-size:10px;margin-left:8px;color:#333">${details.join("<br/>")}</div>`;
      }
      return `<tr><td colspan="3"><b>${it.qty}x ${it.name}</b></td><td style="text-align:right">${it.price}</td></tr>
              <tr><td colspan="4">${opts}</td></tr>`;
    })
    .join("");
  const addr = [o.address_street, o.address_number].filter(Boolean).join(", ");
  w.document.write(`
    <html><head><title>Pedido #${o.order_number ?? o.id.slice(0, 8)}</title>
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
      <p><b>Pedido #${o.order_number ?? o.id.slice(0, 8)}</b></p>
      <p>${new Date(o.created_at).toLocaleString("pt-BR")}</p>
      <hr/>
      <p><b>MÉTODO:</b> ${o.delivery_method === "retirada" ? "RETIRADA NO LOCAL" : "ENTREGA"}</p>
      <p><b>CLIENTE</b><br/>${o.customer_name || "—"}<br/>${o.customer_phone || "—"}</p>
      <hr/>
      ${o.delivery_method !== "retirada" ? `
      <p><b>ENDEREÇO</b><br/>
        ${addr || "—"}<br/>
        ${o.address_neighborhood ? `Bairro: ${o.address_neighborhood}<br/>` : ""}
        ${o.address_complement ? `Compl.: ${o.address_complement}<br/>` : ""}
        ${o.address_reference ? `Ref.: ${o.address_reference}` : ""}
      </p>
      <hr/>` : ""}
      <table>${itemsHtml}</table>
      <hr/>
      <div class="row"><span>Subtotal</span><span>${formatBRL(Number(o.subtotal ?? o.total))}</span></div>
      ${Number(o.discount) > 0 ? `<div class="row"><span>Desc${o.coupon_code ? ` (${o.coupon_code})` : ""}</span><span>-${formatBRL(Number(o.discount))}</span></div>` : ""}
      ${o.delivery_method !== "retirada" ? `<div class="row"><span>Entrega</span><span>${formatBRL(Number(o.delivery_fee ?? 0))}</span></div>` : ""}
      <p class="total">TOTAL: ${formatBRL(Number(o.total))}</p>
      <hr/>
      <p><b>PAGAMENTO:</b> ${PAY_LABEL[o.payment_method ?? ""] ?? "—"}
      ${o.payment_method === "dinheiro" && o.change_for ? `<br/>Troco para ${formatBRL(Number(o.change_for))} (levar ${formatBRL(Number(o.change_for) - Number(o.total))})` : ""}
      </p>
      ${o.notes ? `<hr/><p><b>Obs Geral:</b> ${o.notes}</p>` : ""}
      <hr/>
      <p style="text-align:center">Obrigado! 🍔</p>
      <script>window.print();setTimeout(()=>window.close(),500);</script>
    </body></html>
  `);
  w.document.close();
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== "0");
  const [notifyOn, setNotifyOn] = useState(() => localStorage.getItem(NOTIFY_KEY) === "1");
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const o = payload.new as Order;
          if (!knownIds.current.has(o.id)) {
            knownIds.current.add(o.id);
            if (soundOn) playBeep();
            if (notifyOn) {
              sendPushNotification(
                "🍔 NOVO PEDIDO!",
                `Novo pedido de ${o.customer_name || "cliente"} recebido agora.`
              );
            }
            toast.success(`🔔 Novo pedido — ${o.customer_name || "cliente"}`);
          }
          load();
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, notifyOn]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Pedido atualizado");
  };

  const toggleSound = (v: boolean) => {
    setSoundOn(v);
    localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    if (v) {
      toast.info("Som de alerta ativado (teste tocando agora)");
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

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl uppercase">Pedidos ({orders.length})</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer" title="Notificação no sistema">
            {notifyOn ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
            <Switch checked={notifyOn} onCheckedChange={toggleNotify} />
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" title="Aviso sonoro">
            {soundOn ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            <Switch checked={soundOn} onCheckedChange={toggleSound} />
          </label>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhum pedido ainda.</Card>
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => {
            const fullAddr = [o.address_street, o.address_number].filter(Boolean).join(", ");
            const mapsUrl = fullAddr
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${fullAddr}, ${o.address_neighborhood ?? ""}`)}`
              : null;
            const waUrl = o.customer_phone
              ? `https://wa.me/${o.customer_phone.replace(/\D/g, "")}`
              : null;
            return (
              <Card key={o.id} className="p-4 bg-card border-border">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-lg text-primary">#{o.order_number ?? o.id.slice(0, 6)}</span>
                      <span className="font-bold">{o.customer_name || "Cliente"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {o.customer_phone || "—"} · {new Date(o.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Badge className={STATUS_CONFIG[o.status]?.color ?? ""} variant="outline">
                    {STATUS_CONFIG[o.status]?.label ?? o.status}
                  </Badge>
                </div>

                {/* Endereço */}
                {fullAddr && (
                  <div className="text-xs bg-background/40 border border-border rounded p-2 mb-3">
                    <p className="font-bold mb-0.5">📍 Endereço</p>
                    <p>{fullAddr}{o.address_neighborhood ? ` — ${o.address_neighborhood}` : ""}</p>
                    {o.address_complement && <p>Compl.: {o.address_complement}</p>}
                    {o.address_reference && <p>Ref.: {o.address_reference}</p>}
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Abrir no Google Maps ↗
                      </a>
                    )}
                  </div>
                )}

                <ul className="text-sm space-y-2 mb-3">
                  {o.items?.map((it, idx) => (
                    <li key={idx}>
                      <div className="flex justify-between">
                        <span className="font-bold">• {it.qty}× {it.name}</span>
                        <span className="text-muted-foreground">{it.price}</span>
                      </div>
                      {it.options && Object.keys(it.options).length > 0 && (
                        <div className="text-[11px] text-muted-foreground ml-4 space-y-0.5">
                          {it.options.burgerSize && <p>Tamanho: {it.options.burgerSize}</p>}
                          {it.options.doneness && <p>Ponto: {it.options.doneness}</p>}
                          {it.options.beverage && <p>Bebida: {it.options.beverage}</p>}
                          {it.options.extras && it.options.extras.length > 0 && (
                            <p>Adicionais: {it.options.extras.join(", ")}</p>
                          )}
                          {it.options.notes && <p className="italic">Obs item: {it.options.notes}</p>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Pagamento + valores */}
                <div className="text-xs bg-background/40 border border-border rounded p-2 mb-3 space-y-0.5">
                  <p>💳 <b>{PAY_LABEL[o.payment_method ?? ""] ?? "—"}</b>
                    {o.payment_method === "dinheiro" && o.change_for
                      ? ` — troco p/ ${formatBRL(Number(o.change_for))} (levar ${formatBRL(Number(o.change_for) - Number(o.total))})`
                      : ""}
                  </p>
                  <p className="text-muted-foreground">
                    Subtotal {formatBRL(Number(o.subtotal ?? o.total))}
                    {Number(o.discount) > 0 && ` · Desc ${o.coupon_code ? `(${o.coupon_code}) ` : ""}-${formatBRL(Number(o.discount))}`}
                    {` · Entrega ${formatBRL(Number(o.delivery_fee ?? 0))}`}
                  </p>
                </div>

                {o.notes && (
                  <p className="text-xs italic bg-background/40 border border-border rounded p-2 mb-3">
                    📝 {o.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                  <span className="font-display text-xl text-primary">{formatBRL(Number(o.total))}</span>
                  <div className="flex flex-wrap gap-1">
                    {waUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={waUrl} target="_blank" rel="noreferrer">WhatsApp</a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => printOrder(o)}>
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    {STATUSES.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={o.status === s ? "default" : "outline"}
                        onClick={() => updateStatus(o.id, s)}
                        className={`text-[10px] uppercase font-bold ${o.status === s ? '' : 'opacity-70 hover:opacity-100'}`}
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
    </div>
  );
}
