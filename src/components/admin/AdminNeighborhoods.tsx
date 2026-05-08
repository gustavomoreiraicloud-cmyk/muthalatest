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

type Neighborhood = {
  id: string;
  name: string;
  fee: number;
  active: boolean;
};

const empty: Partial<Neighborhood> = {
  name: "",
  fee: 0,
  active: true,
};

export default function AdminNeighborhoods() {
  const [items, setItems] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Neighborhood> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("neighborhoods")
      .select("*")
      .order("name");
    if (error) toast.error("Erro ao carregar bairros");
    setItems((data as Neighborhood[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name || editing.fee == null) {
      return toast.error("Preencha nome e taxa de entrega");
    }
    const payload = {
      name: editing.name!,
      fee: Number(editing.fee),
      active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("neighborhoods").update(payload).eq("id", editing.id)
      : await supabase.from("neighborhoods").insert(payload);
    
    if (error) {
      if (error.code === '23505') return toast.error("Este bairro já está cadastrado");
      return toast.error("Erro ao salvar");
    }
    
    toast.success("Salvo!");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este bairro?")) return;
    const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Removido");
    load();
  };

  const toggleActive = async (item: Neighborhood) => {
    const { error } = await supabase
      .from("neighborhoods")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) return toast.error("Erro");
    load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase">Taxas de Entrega ({items.length})</h2>
        <Button onClick={() => setEditing({ ...empty })} className="bg-gradient-gold text-primary-foreground font-bold">
          <Plus className="w-4 h-4" /> Novo Bairro
        </Button>
      </div>

      <div className="grid gap-2">
        {items.map((it) => (
          <Card key={it.id} className={`p-4 flex items-center gap-4 bg-card border-border ${!it.active ? "opacity-60" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg">{it.name}</p>
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
            <DialogTitle>{editing?.id ? "Editar Bairro" : "Novo Bairro"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Nome do Bairro</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Centro" />
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
                <Label className="cursor-pointer">Bairro Ativo</Label>
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
