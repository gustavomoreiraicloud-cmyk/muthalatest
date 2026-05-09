import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BusinessHours, DAY_LABELS, DEFAULT_HOURS, isWithinHours } from "@/lib/businessHours";

type Settings = {
  id: string;
  store_name: string;
  phone: string;
  address: string | null;
  delivery_fee: number;
  min_order: number;
  is_open: boolean;
  hours: string | null;
  business_hours: BusinessHours | null;
  pix_key: string | null;
  pix_qr_code_url: string | null;
};

export default function AdminSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("*")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar");
        setS(data as unknown as Settings);
        setLoading(false);
      });
  }, []);

  const bh: BusinessHours = s?.business_hours ?? DEFAULT_HOURS;
  const updateDay = (day: string, patch: Partial<BusinessHours[string]>) => {
    if (!s) return;
    setS({ ...s, business_hours: { ...bh, [day]: { ...bh[day], ...patch } } });
  };

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: s.store_name,
        phone: s.phone,
        address: s.address,
        delivery_fee: s.delivery_fee,
        min_order: s.min_order,
        is_open: s.is_open,
        hours: s.hours,
        business_hours: (s.business_hours ?? DEFAULT_HOURS) as never,
        pix_key: s.pix_key,
        pix_qr_code_url: s.pix_qr_code_url,
      })
      .eq("id", s.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Configurações salvas!");
  };

  if (loading || !s) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-display text-2xl uppercase">Configurações da loja</h2>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/40 bg-primary/5">
          <div>
            <p className="font-bold">Loja {s.is_open ? "ABERTA" : "FECHADA"}</p>
            <p className="text-xs text-muted-foreground">
              {s.is_open ? "Aceitando pedidos" : "Carrinho bloqueado para clientes"}
            </p>
          </div>
          <Switch checked={s.is_open} onCheckedChange={(v) => setS({ ...s, is_open: v })} />
        </div>

        <div>
          <Label>Nome da loja</Label>
          <Input
            value={s.store_name}
            onChange={(e) => setS({ ...s, store_name: e.target.value })}
          />
        </div>
        <div>
          <Label>WhatsApp (com DDD, ex: +5518997962510)</Label>
          <Input value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} />
        </div>
        <div>
          <Label>Endereço</Label>
          <Input
            value={s.address ?? ""}
            onChange={(e) => setS({ ...s, address: e.target.value })}
          />
        </div>
        <div>
          <Label>Texto de horário (exibido no rodapé)</Label>
          <Textarea
            rows={2}
            placeholder="Ter–Dom · 18h–23h"
            value={s.hours ?? ""}
            onChange={(e) => setS({ ...s, hours: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label>Chave PIX (CPF, CNPJ, Celular, etc)</Label>
            <Input 
              value={s.pix_key ?? ""} 
              onChange={(e) => setS({ ...s, pix_key: e.target.value })} 
              placeholder="Ex: 123.456.789-00"
            />
          </div>
          <div className="space-y-2">
            <Label>URL do QR Code (opcional)</Label>
            <Input 
              value={s.pix_qr_code_url ?? ""} 
              onChange={(e) => setS({ ...s, pix_qr_code_url: e.target.value })} 
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-border">
          <Label>Horários por dia da semana</Label>
          <p className="text-xs text-muted-foreground">
            Quando a loja estiver fechada, o site mostra automaticamente "Abrimos em..." baseado
            nestes horários.
          </p>
          <div className="space-y-2 mt-2">
            {DAY_LABELS.map((label, idx) => {
              const key = String(idx);
              const day = bh[key] ?? { open: false, from: "18:00", to: "23:00" };
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background/40"
                >
                  <div className="w-20 text-sm font-bold">{label}</div>
                  <Switch checked={day.open} onCheckedChange={(v) => updateDay(key, { open: v })} />
                  <Input
                    type="time"
                    disabled={!day.open}
                    value={day.from}
                    onChange={(e) => updateDay(key, { from: e.target.value })}
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">até</span>
                  <Input
                    type="time"
                    disabled={!day.open}
                    value={day.to}
                    onChange={(e) => updateDay(key, { to: e.target.value })}
                    className="w-28"
                  />
                  {!day.open && (
                    <span className="text-xs text-muted-foreground ml-auto">Fechado</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Taxa de entrega Padrão (R$)</Label>
            <p className="text-[10px] text-muted-foreground mb-1 leading-tight">
              Usada caso o bairro não tenha taxa específica.
            </p>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={s.delivery_fee}
              onChange={(e) => setS({ ...s, delivery_fee: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Pedido mínimo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={s.min_order}
              onChange={(e) => setS({ ...s, min_order: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full bg-gradient-gold text-primary-foreground font-bold"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </Card>
    </div>
  );
}
