import { useEffect, useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Minus, Plus, Trash2, ShoppingBag, MessageCircle, CheckCircle2, MapPin, CreditCard, Tag, Loader2, MapPinIcon
} from "lucide-react";
import { useCart, formatBRL, parsePrice } from "@/hooks/useCart";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { z } from "zod";

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

type PaymentMethod = "pix" | "dinheiro" | "cartao_debito" | "cartao_credito";
type DeliveryMethod = "entrega" | "retirada";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_debito: "Cartão de Débito",
  cartao_credito: "Cartão de Crédito",
};

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  deliveryMethod: z.enum(["entrega", "retirada"]),
  street: z.string().trim().max(120).optional(),
  number: z.string().trim().max(10).optional(),
  deliveryRangeId: z.string().optional(),
}).refine((data) => {
  if (data.deliveryMethod === "entrega") {
    return !!data.street && !!data.number && !!data.deliveryRangeId;
  }
  return true;
}, {
  message: "Preencha todos os campos do endereço para entrega",
  path: ["street"],
});

type Coupon = {
  code: string;
  discount_type: "percent" | "fixed" | "free_shipping";
  discount_value: number;
  min_order: number;
  expires_at: string | null;
  active: boolean;
};

export default function CartDrawer() {
  const { items, isOpen, close, inc, dec, remove, clear, total: subtotal, totalLabel } = useCart();
  const { settings } = useStoreSettings();
  const MIN_ORDER = settings?.min_order ?? 30;
  const DEFAULT_DELIVERY_FEE = settings?.delivery_fee ?? 0;
  const isOpenStore = settings?.is_open ?? true;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("entrega");
  const [deliveryRangeId, setDeliveryRangeId] = useState("");
  const [deliveryRanges, setDeliveryRanges] = useState<any[]>([]);
  const [loadingRanges, setLoadingRanges] = useState(false);
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [needsChange, setNeedsChange] = useState<boolean | null>(null);
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [detectedDistance, setDetectedDistance] = useState<number | null>(null);

  const [confirmation, setConfirmation] = useState<{ orderNumber: number | null; orderId: string | null } | null>(null);

  // Load delivery ranges
  useEffect(() => {
    const loadRanges = async () => {
      setLoadingRanges(true);
      const { data } = await supabase
        .from("delivery_ranges")
        .select("*")
        .eq("active", true)
        .order("min_km");
      setDeliveryRanges(data || []);
      setLoadingRanges(false);
    };
    if (isOpen) loadRanges();
  }, [isOpen]);

  // Reset confirmation when reopening
  useEffect(() => {
    if (isOpen) setConfirmation(null);
  }, [isOpen]);

  // Auto-calculate distance and find range when address changes
  useEffect(() => {
    if (deliveryMethod === 'entrega' && street.length > 5 && number.length > 0) {
      const timer = setTimeout(() => {
        handleAutoDistance();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [street, number, deliveryMethod]);

  // Compute discount + total
  const selectedRange = deliveryRanges.find(r => r.id === deliveryRangeId);
  
  const discount = (() => {
    if (!coupon) return 0;
    if (subtotal < coupon.min_order) return 0;
    if (coupon.discount_type === "percent") return +(subtotal * (coupon.discount_value / 100)).toFixed(2);
    if (coupon.discount_type === "fixed") return Math.min(coupon.discount_value, subtotal);
    return 0;
  })();
  const freeShipping = coupon?.discount_type === "free_shipping" && subtotal >= (coupon?.min_order ?? 0);
  const fee = (deliveryMethod === "retirada" || freeShipping) 
    ? 0 
    : (selectedRange ? Number(selectedRange.fee) : DEFAULT_DELIVERY_FEE);
  const total = Math.max(0, subtotal - discount + fee);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("code,discount_type,discount_value,min_order,expires_at,active")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    setValidatingCoupon(false);
    if (error || !data) {
      toast.error("Cupom inválido");
      setCoupon(null);
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error("Cupom expirado");
      setCoupon(null);
      return;
    }
    if (subtotal < Number(data.min_order)) {
      toast.error(`Cupom requer pedido mínimo de ${formatBRL(Number(data.min_order))}`);
      setCoupon(null);
      return;
    }
    setCoupon(data as Coupon);
    toast.success(`Cupom ${code} aplicado!`);
  };

  const handleAutoDistance = async () => {
    if (!street || !number) {
      toast.error("Preencha a rua e o número primeiro");
      return;
    }

    setCalculatingDistance(true);
    try {
      const address = `${street}, ${number}, Assis, SP, Brasil`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (!data || data.length === 0) {
        toast.error("Não encontramos este endereço em Assis. Verifique os dados ou chame no WhatsApp.");
        return;
      }

      const { lat, lon } = data[0];
      const storeLat = (settings as any)?.latitude || -22.6612;
      const storeLon = (settings as any)?.longitude || -50.4132;

      const dist = calculateDistance(storeLat, storeLon, parseFloat(lat), parseFloat(lon));
      
      // Adicionar margem de erro/trajeto (aprox 30% a mais que linha reta)
      const estimatedRoadDist = dist * 1.3;
      setDetectedDistance(estimatedRoadDist);

      const range = deliveryRanges.find(r => estimatedRoadDist >= Number(r.min_km) && estimatedRoadDist <= Number(r.max_km));
      
      if (range) {
        setDeliveryRangeId(range.id);
        toast.success(`Distância estimada: ${estimatedRoadDist.toFixed(1)}km. Frete: ${formatBRL(Number(range.fee))}`);
      } else {
        toast.error("Este endereço parece estar fora da nossa área de entrega.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao calcular distância");
    } finally {
      setCalculatingDistance(false);
    }
  };
  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
  };
  const buildOrderMessage = (orderNumber: number | null, orderId: string | null = null) => {
    const lines: string[] = [];

    lines.push("🍔 *NOVO PEDIDO — MUTHALA BURGER*");
    if (orderNumber) lines.push(`*Pedido #${orderNumber}*`);
    lines.push("━━━━━━━━━━━━━━");
    lines.push("");
    lines.push("👤 *CLIENTE*");
    lines.push(`Nome: ${name}`);
    lines.push(`Telefone: ${phone}`);
    lines.push("");
    lines.push(`🚚 *MÉTODO:* ${deliveryMethod === "entrega" ? "Entrega" : "Retirada no Local"}`);
    if (deliveryMethod === "entrega") {
      lines.push("📍 *ENDEREÇO DE ENTREGA*");
      lines.push(`${street}, ${number}`);
      lines.push(`Distância: ${selectedRange?.label || 'Não informada'}`);
      if (complement) lines.push(`Complemento: ${complement}`);
      if (reference) lines.push(`Referência: ${reference}`);
    }
    lines.push("");
    lines.push("🛒 *PEDIDO*");
    items.forEach((i) => {
      lines.push(`• *${i.qty}x ${i.name}* — ${formatBRL(parsePrice(i.price) * i.qty)}`);
      if (i.options) {
        if (i.options.burgerSize) lines.push(`  └ _Opção:_ ${i.options.burgerSize}`);
        if (i.options.doneness) lines.push(`  └ _Ponto:_ ${i.options.doneness}`);
        if (i.options.beverage) lines.push(`  └ _Bebida:_ ${i.options.beverage}`);
        if (i.options.extras && i.options.extras.length > 0) {
          lines.push(`  └ _Adicionais:_ ${i.options.extras.join(", ")}`);
        }
        if (i.options.notes) lines.push(`  └ _Obs:_ ${i.options.notes}`);
      }
    });
    lines.push("");
    lines.push("💰 *VALORES*");
    lines.push(`Subtotal: ${formatBRL(subtotal)}`);
    if (discount > 0) lines.push(`Desconto (${coupon?.code}): -${formatBRL(discount)}`);
    lines.push(`Taxa de entrega: ${freeShipping ? "GRÁTIS 🎉" : formatBRL(fee)}`);
    lines.push(`*TOTAL: ${formatBRL(total)}*`);
    if (payment === "dinheiro") {
      lines.push(`💵 Pagamento: Dinheiro`);
      if (needsChange === true && changeFor) {
        const val = Number(parsePrice(changeFor));
        lines.push(`👉 *Troco para: ${formatBRL(val)}*`);
        lines.push(`👉 *Levar: ${formatBRL(val - total)}*`);
      } else {
        lines.push(`👉 *Não precisa de troco*`);
      }
    } else {
      lines.push(`💳 Pagamento: ${PAYMENT_LABELS[payment]}`);
    }
    lines.push("");
    lines.push("💳 *PAGAMENTO*");
    lines.push(PAYMENT_LABELS[payment]);
    if (payment === "dinheiro" && changeFor) {
      const ch = parsePrice(changeFor);
      if (ch > total) lines.push(`Troco para ${formatBRL(ch)} (levar ${formatBRL(ch - total)})`);
      else lines.push("Não precisa de troco");
    }
    if (notes) {
      lines.push("");
      lines.push("📝 *OBSERVAÇÕES GERAIS*");
      lines.push(notes);
    }
    lines.push("");
    lines.push("✅ *Confirmar pedido por favor!*");
    lines.push(`🔗 Acompanhe em: https://muthalaburguer.lovable.app/status?id=${orderId || ''}`);
    return lines.join("\n");
  };

  const canCheckout =
    items.length > 0 && !submitting && isOpenStore && subtotal >= MIN_ORDER;

  const handleCheckout = async () => {
    if (!canCheckout) return;

    const parsed = checkoutSchema.safeParse({ 
      name, 
      phone, 
      deliveryMethod,
      street: deliveryMethod === "entrega" ? street : undefined, 
      number: deliveryMethod === "entrega" ? number : undefined, 
      deliveryRangeId: deliveryMethod === "entrega" ? deliveryRangeId : undefined 
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // 1. Inserir o pedido principal
      const { data: order, error: orderError } = await (supabase
        .from("orders") as any)
        .insert({
          customer_name: name,
          customer_phone: phone,
          delivery_method: deliveryMethod,
          subtotal: Number(subtotal),
          discount: Number(discount),
          delivery_fee: Number(fee),
          total: Number(total),
          coupon_code: coupon?.code ?? null,
          payment_method: payment,
          needs_change: needsChange === true,
          change_for: payment === "dinheiro" && changeFor ? Number(parsePrice(changeFor)) : null,
          address_street: deliveryMethod === "entrega" ? street : null,
          address_number: deliveryMethod === "entrega" ? number : null,
          address_neighborhood: deliveryMethod === "entrega" ? (selectedRange?.label || null) : "Retirada no Local",
          address_complement: deliveryMethod === "entrega" ? (complement || null) : null,
          address_reference: deliveryMethod === "entrega" ? (reference || null) : null,
          notes: notes || null,
          status: "novo",
          user_id: user.user?.id || null,
          items: items.map((i) => ({ 
            name: i.name, 
            qty: i.qty, 
            price: Number(parsePrice(i.price)),
            options: i.options 
          }))
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Inserir os itens do pedido para relatórios detalhados
      const itemsToInsert = items.map((i) => ({
        order_id: order.id,
        product_id: (i as any).id || null,
        product_name: i.name,
        quantity: i.qty,
        price: Number(i.price),
        subtotal: Number(i.price) * i.qty,
        options: i.options || [],
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert as any);

      if (itemsError) console.error("Error inserting order items:", itemsError);

      setConfirmation({ orderNumber: order.order_number, orderId: order.id });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("save order failed", err);
      toast.error("Não foi possível registrar o pedido. Verifique o endereço e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setName(""); setPhone(""); setStreet(""); setNumber(""); setDeliveryRangeId("");
    setComplement(""); setReference(""); setNotes(""); setChangeFor("");
    setCoupon(null); setCouponCode(""); setPayment("pix"); setNeedsChange(null);
    setConfirmation(null);
    close();
  };

  // Confirmation screen
  if (confirmation) {
    return (
      <Sheet open={isOpen} onOpenChange={(o) => !o && resetAll()}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-card">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-[hsl(142_76%_45%)] mb-4" />
            <h2 className="font-display text-3xl uppercase mb-2">Pedido enviado!</h2>
            <p className="text-sm text-muted-foreground mb-6 mt-2">
              Seu pedido foi recebido com sucesso! Use o botão abaixo para enviar o pedido via WhatsApp e acompanhar o status com nossa equipe. 🙏
            </p>
            
            <div className="w-full space-y-3">
              <Button asChild size="lg" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold">
                <a 
                  href={buildWhatsAppLink(buildOrderMessage(confirmation.orderNumber, confirmation.orderId))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar no WhatsApp
                </a>
              </Button>

              <Button onClick={resetAll} variant="outline" size="lg" className="w-full font-bold">
                Fechar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-card">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="font-display text-2xl uppercase flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Seu pedido
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Seu carrinho está vazio.</p>
              <p className="text-sm mt-2">Adicione lanches do cardápio.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3 mb-6">
                {items.map((i, idx) => {
                  const lineTotal = parsePrice(i.price) * i.qty;
                  const itemKey = `${i.name}-${idx}`;
                  const uniqueId = i.name + (i.options ? JSON.stringify(i.options) : "");
                  return (
                    <li key={itemKey} className="flex flex-col gap-3 bg-background/40 border border-border rounded-xl p-3">
                      <div className="flex gap-3 items-center">
                        <img 
                          src={i.img} 
                          alt={i.name} 
                          className="w-16 h-16 rounded-lg object-cover shrink-0" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('/src/assets/')) {
                              target.src = target.src.replace('/src/assets/', '/assets/');
                            }
                          }}
                          loading="lazy" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{i.name}</p>
                          <p className="text-xs text-muted-foreground">{i.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => dec(uniqueId)} aria-label="Diminuir" className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:border-primary"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold w-6 text-center">{i.qty}</span>
                            <button onClick={() => inc(uniqueId)} aria-label="Aumentar" className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:border-primary"><Plus className="w-3 h-3" /></button>
                            <button onClick={() => remove(uniqueId)} aria-label="Remover" className="ml-auto w-7 h-7 rounded-md border border-border flex items-center justify-center hover:border-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-primary text-lg">{formatBRL(lineTotal)}</p>
                        </div>
                      </div>
                      
                      {i.options && (
                        <div className="text-[10px] text-muted-foreground space-y-1 pl-1 border-l border-primary/30 ml-2">
                          {i.options.burgerSize && <p>• <b>Opção:</b> {i.options.burgerSize}</p>}
                          {i.options.doneness && <p>• <b>Ponto:</b> {i.options.doneness}</p>}
                          {i.options.beverage && <p>• <b>Bebida:</b> {i.options.beverage}</p>}
                          {i.options.extras && i.options.extras.length > 0 && (
                            <p>• <b>Adicionais:</b> {i.options.extras.join(", ")}</p>
                          )}
                          {i.options.notes && <p className="italic">• "{i.options.notes}"</p>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Cliente */}
              <div className="space-y-3 mb-5">
                <h3 className="font-display uppercase text-sm text-muted-foreground tracking-wide">👤 Seus dados</h3>
                <div>
                  <Label className="text-xs">Nome completo *</Label>
                  <Input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="João Silva" />
                </div>
                <div>
                  <Label className="text-xs">WhatsApp (com DDD) *</Label>
                  <Input maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(18) 99796-2510" />
                </div>
              </div>

              {/* Método de Entrega */}
              <div className="space-y-3 mb-5">
                <h3 className="font-display uppercase text-sm text-muted-foreground tracking-wide">📦 Como prefere receber?</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryMethod("entrega")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-smooth ${
                      deliveryMethod === "entrega"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span className="text-sm font-bold">Entrega</span>
                  </button>
                  <button
                    onClick={() => setDeliveryMethod("retirada")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-smooth ${
                      deliveryMethod === "retirada"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm font-bold">Retirada</span>
                  </button>
                </div>
              </div>

              {/* Endereço (apenas se for entrega) */}
              {deliveryMethod === "entrega" && (
                <div className="space-y-3 mb-5">
                  <h3 className="font-display uppercase text-sm text-muted-foreground tracking-wide flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Endereço de entrega
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Rua *</Label>
                      <Input maxLength={120} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="R. Smith Vasconcelos" />
                    </div>
                    <div>
                      <Label className="text-xs">Número *</Label>
                      <Input maxLength={10} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="312" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Complemento</Label>
                    <Input maxLength={80} value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto 21, bloco B" />
                  </div>
                  <div>
                    <Label className="text-xs">Ponto de referência</Label>
                    <Input maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Próximo ao mercado..." />
                  </div>
                </div>
              )}

              {/* Pagamento */}
              <div className="space-y-3 mb-5">
                <h3 className="font-display uppercase text-sm text-muted-foreground tracking-wide flex items-center gap-1">
                  <CreditCard className="w-4 h-4" /> Pagamento
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayment(m)}
                      className={`p-2 rounded-lg border text-sm font-bold transition-smooth ${
                        payment === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background/40 hover:border-primary/50"
                      }`}
                    >
                      {PAYMENT_LABELS[m]}
                    </button>
                  ))}
                </div>
                {payment === "dinheiro" && (
                  <div className="space-y-3 p-3 rounded-lg bg-background/20 border border-border">
                    <Label className="text-xs font-bold uppercase">Precisa de troco?</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNeedsChange(true)}
                        className={`flex-1 p-2 rounded border text-xs font-bold transition-smooth ${
                          needsChange === true ? "border-primary bg-primary/20 text-primary" : "border-border"
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => {
                          setNeedsChange(false);
                          setChangeFor("");
                        }}
                        className={`flex-1 p-2 rounded border text-xs font-bold transition-smooth ${
                          needsChange === false ? "border-primary bg-primary/20 text-primary" : "border-border"
                        }`}
                      >
                        Não
                      </button>
                    </div>
                    
                    {needsChange === true && (
                      <div className="animate-in fade-in slide-in-from-top-1">
                        <Label className="text-[10px] uppercase">Troco para quanto?</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                          <Input
                            className="pl-8"
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value)}
                            placeholder="Ex: 100,00"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cupom */}
              <div className="space-y-2 mb-5">
                <h3 className="font-display uppercase text-sm text-muted-foreground tracking-wide flex items-center gap-1">
                  <Tag className="w-4 h-4" /> Cupom de desconto
                </h3>
                {coupon ? (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/40 rounded-lg p-2">
                    <span className="font-bold text-sm text-primary">✓ {coupon.code}</span>
                    <button onClick={removeCoupon} className="text-xs text-destructive hover:underline">Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="DIGITE O CUPOM" maxLength={30} />
                    <Button variant="outline" onClick={applyCoupon} disabled={validatingCoupon || !couponCode}>
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea rows={2} maxLength={300} placeholder="Sem cebola, ponto da carne..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-2 bg-background/40">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-[hsl(142_76%_55%)]">
                <span>Desconto</span>
                <span>-{formatBRL(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>{freeShipping ? <span className="text-[hsl(142_76%_55%)] font-bold">GRÁTIS</span> : formatBRL(fee)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-bold">Total</span>
              <span className="font-display text-2xl text-primary">{formatBRL(total)}</span>
            </div>
            {!isOpenStore && (
              <p className="text-xs text-destructive font-bold">🔒 Loja fechada. Volte em breve!</p>
            )}
            {isOpenStore && subtotal < MIN_ORDER && (
              <p className="text-xs text-destructive">
                Pedido mínimo {formatBRL(MIN_ORDER)}. Faltam {formatBRL(MIN_ORDER - subtotal)}.
              </p>
            )}
            <Button
              onClick={handleCheckout}
              disabled={!canCheckout}
              size="lg"
              className="w-full bg-[hsl(142_76%_45%)] hover:bg-[hsl(142_76%_40%)] text-white font-bold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {submitting ? "Enviando..." : "Confirmar pedido"}
            </Button>
            <button onClick={clear} className="w-full text-xs text-muted-foreground hover:text-destructive transition-smooth">
              Limpar carrinho
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
