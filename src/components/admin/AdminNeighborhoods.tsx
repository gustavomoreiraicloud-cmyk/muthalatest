import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Loader2, MapPin, Navigation, Info, Car } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/hooks/useCart";

type DeliveryRange = {
  id: string;
  label: string;
  min_km: number;
  max_km: number | null;
  fee: number;
  active: boolean;
};

const empty: Partial<DeliveryRange> = {
  label: "",
  min_km: 0,
  max_km: null,
  fee: 0,
  active: true,
};

export default function AdminNeighborhoods() {
  const [items, setItems] = useState<DeliveryRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DeliveryRange> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("delivery_ranges").select("*").order("min_km");
    if (error) toast.error("Erro ao carregar faixas");
    setItems((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.label || editing.fee == null) {
      return toast.error("Preencha o rótulo e a taxa");
    }
    const payload = {
      label: editing.label!,
      min_km: Number(editing.min_km || 0),
      max_km: editing.max_km ? Number(editing.max_km) : null,
      fee: Number(editing.fee),
      active: editing.active ?? true,
    };

    const { error } = editing.id
      ? await supabase.from("delivery_ranges").update(payload).eq("id", editing.id)
      : await supabase.from("delivery_ranges").insert(payload);

    if (error) {
      return toast.error("Erro ao salvar");
    }

    toast.success("Salvo!");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta faixa?")) return;
    const { error } = await supabase.from("delivery_ranges").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Removido");
    load();
  };

  const toggleActive = async (item: DeliveryRange) => {
    const { error } = await supabase
      .from("delivery_ranges")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) return toast.error("Erro");
    load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border">
        <div>
          <h2 className="font-display text-3xl uppercase text-primary">Gestão de Fretes</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Configuração automática baseada em KM
          </p>
        </div>
        <Button
          onClick={() => setEditing({ ...empty })}
          className="bg-gradient-gold text-primary-foreground font-bold h-12 px-6 rounded-xl hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 mr-2" /> Nova Faixa
        </Button>
      </div>

      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-3xl border-2 border-dashed border-border flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <Navigation className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <div className="max-w-xs">
              <p className="font-bold text-lg">Nenhuma faixa configurada</p>
              <p className="text-sm text-muted-foreground">Adicione faixas de distância para que o sistema possa calcular o frete automaticamente.</p>
            </div>
            <Button onClick={() => setEditing({ ...empty })} variant="outline" className="mt-2">
              Começar agora
            </Button>
          </div>
        ) : (
          items.map((it) => (
            <Card
              key={it.id}
              className={`group overflow-hidden bg-card border-border transition-all hover:border-primary/50 hover:shadow-lg ${!it.active ? "opacity-60 grayscale-[0.5]" : ""}`}
            >
              <div className="flex items-center p-5 gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${it.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Car className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display text-xl uppercase tracking-tight">{it.label}</p>
                    {it.active ? (
                      <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/20">Ativo</span>
                    ) : (
                      <span className="bg-muted text-muted-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-border">Inativo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="text-primary">{formatBRL(Number(it.fee))}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {it.min_km}km até {it.max_km ? `${it.max_km}km` : '∞'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 pr-4 border-r border-border">
                    <Switch checked={it.active} onCheckedChange={() => toggleActive(it)} className="data-[state=checked]:bg-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(it)} className="hover:bg-primary/10 hover:text-primary rounded-xl">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)} className="hover:bg-destructive/10 hover:text-destructive rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))
        )}
      </div>

      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-200/80 leading-relaxed">
          <p className="font-bold text-blue-400 uppercase mb-1">Como funciona?</p>
          <p>O sistema usa o <b>KM real</b> calculado via GPS. Certifique-se de que as faixas não se sobreponham. Se o KM do cliente não cair em nenhuma faixa ativa, o sistema usará a <b>Taxa Padrão</b> definida nas Configurações Gerais.</p>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase text-primary">
              {editing?.id ? "Editar Faixa" : "Nova Faixa de Frete"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome da Faixa</Label>
                  <Input
                    className="h-12 rounded-xl bg-muted/30 border-border focus:border-primary/50"
                    value={editing.label ?? ""}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                    placeholder="Ex: Entrega Local (Até 2km)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distância Mínima (km)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        className="h-12 rounded-xl bg-muted/30 border-border pl-10"
                        value={editing.min_km ?? 0}
                        onChange={(e) =>
                          setEditing({ ...editing, min_km: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distância Máxima (km)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        className="h-12 rounded-xl bg-muted/30 border-border pl-10"
                        value={editing.max_km ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            max_km: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        placeholder="Infinito"
                      />
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Valor da Taxa (R$)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.50"
                      min="0"
                      className="h-12 rounded-xl bg-muted/30 border-border pl-10 text-xl font-display text-primary"
                      value={editing.fee ?? 0}
                      onChange={(e) => setEditing({ ...editing, fee: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                  <div>
                    <Label className="font-bold uppercase text-xs cursor-pointer">Faixa Habilitada</Label>
                    <p className="text-[10px] text-muted-foreground">Define se esta regra de cálculo está ativa</p>
                  </div>
                  <Switch
                    checked={editing.active ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setEditing(null)} className="h-12 rounded-xl font-bold uppercase text-xs">
                Descartar
              </Button>
              <Button onClick={save} className="h-12 rounded-xl bg-gradient-gold text-primary-foreground font-bold px-8 hover:scale-105 transition-transform uppercase text-xs">
                Salvar Faixa
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
