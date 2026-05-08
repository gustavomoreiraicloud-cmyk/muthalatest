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
import { Pencil, Plus, Trash2, Loader2, MapPin } from "lucide-react";
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
    const { data, error } = await supabase
      .from("delivery_ranges")
      .select("*")
      .order("min_km");
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase">Taxas por Distância ({items.length})</h2>
        <Button onClick={() => setEditing({ ...empty })} className="bg-gradient-gold text-primary-foreground font-bold">
          <Plus className="w-4 h-4" /> Nova Faixa
        </Button>
      </div>

      <div className="grid gap-2">
        {items.map((it) => (
          <Card key={it.id} className={`p-4 flex items-center gap-4 bg-card border-border ${!it.active ? "opacity-60" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg">{it.label}</p>
              <p className="text-sm text-muted-foreground">Taxa: {formatBRL(Number(it.fee))}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  {it.active ? "Ativo" : "Pausado"}
                </span>
                <Switch checked={it.active} onCheckedChange={() => toggleActive(it)} />
              </div>
              <div className="flex items-center gap-1 border-l border-border pl-4">
                <Button size="icon" variant="ghost" onClick={() => setEditing(it)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar Faixa" : "Nova Faixa"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Rótulo (Ex: 2km a 4km)</Label>
                <Input value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Ex: Até 2km" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>KM Mínimo</Label>
                  <Input
                    type="number" step="0.1"
                    value={editing.min_km ?? 0}
                    onChange={(e) => setEditing({ ...editing, min_km: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>KM Máximo (opcional)</Label>
                  <Input
                    type="number" step="0.1"
                    value={editing.max_km ?? ""}
                    onChange={(e) => setEditing({ ...editing, max_km: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Deixe vazio para 'acima de'"
                  />
                </div>
              </div>
              <div>
                <Label>Taxa de Entrega (R$)</Label>
                <Input
                  type="number" step="0.50" min="0"
                  value={editing.fee ?? 0}
                  onChange={(e) => setEditing({ ...editing, fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                <Label className="cursor-pointer">Faixa Ativa</Label>
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} className="bg-gradient-gold text-primary-foreground font-bold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}