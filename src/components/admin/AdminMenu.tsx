import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Loader2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ASSET_MAP } from "@/pages/Index";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MenuItem = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  ingredients: string[];
  price: number;
  image_url: string | null;
  available: boolean;
  highlight: boolean;
  sort_order: number;
};

const CATEGORIES = [
  { id: "promocoes", label: "Promoções" },
  { id: "hamburgueres", label: "Hambúrgueres" },
  { id: "hotdogs", label: "Hot Dogs" },
  { id: "porcoes", label: "Porções" },
  { id: "bebidas", label: "Bebidas" },
];

const empty: Partial<MenuItem> = {
  category: "hamburgueres",
  name: "",
  description: "",
  ingredients: [],
  price: 0,
  image_url: "",
  available: true,
  highlight: false,
  sort_order: 0,
};

export default function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<MenuItem> | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category")
      .order("sort_order");
    if (error) toast.error("Erro ao carregar cardápio");
    setItems((data as MenuItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing || saving) return;
    if (!editing.name || !editing.category || editing.price == null) {
      return toast.error("Preencha nome, categoria e preço");
    }
    setSaving(true);
    const payload = {
      category: editing.category!,
      name: editing.name!,
      description: editing.description ?? null,
      ingredients: editing.ingredients ?? [],
      price: Number(editing.price),
      image_url: editing.image_url || null,
      available: editing.available ?? true,
      highlight: editing.highlight ?? false,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) {
      setSaving(false);
      return toast.error("Erro ao salvar");
    }
    toast.success("Salvo!");
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Removido");
    load();
  };

  const toggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ available: !item.available })
      .eq("id", item.id);
    if (error) return toast.error("Erro");
    load();
  };

  const filtered = useMemo(() => {
    return filter === "all" ? items : items.filter((i) => i.category === filter);
  }, [items, filter]);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <Alert className="bg-primary/5 border-primary/20 rounded-2xl p-4">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-[10px] text-primary font-black uppercase tracking-widest ml-2">
          Dica: Os adicionais e variações de peso são calculados automaticamente conforme o nome do item.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center justify-between gap-6 bg-card/30 p-6 rounded-2xl border border-white/5">
        <div>
          <h2 className="font-display text-4xl uppercase bg-gradient-gold bg-clip-text text-transparent tracking-tighter">Cardápio</h2>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1 opacity-70">
            {items.length} produtos cadastrados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-52 h-11 rounded-xl bg-black/40 border-white/10 uppercase text-[10px] font-black tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              <SelectItem value="all" className="uppercase text-[10px] font-black tracking-widest">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id} className="uppercase text-[10px] font-black tracking-widest">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setEditing({ ...empty })}
            className="h-11 px-6 rounded-xl bg-gradient-gold text-primary-foreground font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Produto
          </Button>
        </div>
      </div>

      {items.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum item ainda. Cadastre o primeiro hambúrguer!
        </Card>
      )}

      <div className="grid gap-4">
        {filtered.map((it) => (
          <Card
            key={it.id}
            className={`p-4 flex flex-col sm:flex-row items-center gap-4 bg-card border-border transition-all ${!it.available ? "grayscale opacity-60" : "hover:border-primary/30"}`}
          >
            <div className="relative group shrink-0">
              {it.image_url ? (
                <img
                  src={(it.image_url && ASSET_MAP[it.image_url]) || it.image_url}
                  alt={it.name}
                  className="w-20 h-20 rounded-lg object-cover border border-border shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <p className="font-bold text-lg truncate">{it.name}</p>
                {it.highlight && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase tracking-wider">
                    Destaque
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase tracking-wider">
                  {CATEGORIES.find((c) => c.id === it.category)?.label ?? it.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {it.description}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-center sm:items-end gap-3 sm:border-l sm:border-border sm:pl-6 min-w-[140px]">
              <p className="font-display text-2xl text-primary leading-none">
                R$ {Number(it.price).toFixed(2)}
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    {it.available ? "Ativo" : "Pausado"}
                  </span>
                  <Switch checked={it.available} onCheckedChange={() => toggleAvailable(it)} />
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setEditing(it)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => remove(it.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editing.name ?? ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Base (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editing.price ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ordem de Exibição</Label>
                  <Input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-sm uppercase">Adicionais e Adereços</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold">
                  <div className="p-2 bg-background border border-border rounded flex justify-between">
                    <span>Bacon</span>
                    <span className="text-primary">+R$ 6,90</span>
                  </div>
                  <div className="p-2 bg-background border border-border rounded flex justify-between">
                    <span>Hambúrguer 180g</span>
                    <span className="text-primary">+R$ 6,00</span>
                  </div>
                  <div className="p-2 bg-background border border-border rounded flex justify-between">
                    <span>Queijo Cheddar</span>
                    <span className="text-primary">+R$ 4,90</span>
                  </div>
                  <div className="p-2 bg-background border border-border rounded flex justify-between">
                    <span>Combo Completo</span>
                    <span className="text-primary">+R$ 26,00</span>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase leading-tight italic">
                  * Estes valores são aplicados automaticamente no momento da compra pelo cliente.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Imagem do Produto</Label>
                <ImagePicker
                  value={editing.image_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <Label className="cursor-pointer">Disponível para venda</Label>
                  <Switch
                    checked={editing.available ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, available: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <Label className="cursor-pointer">Destaque (⭐)</Label>
                  <Switch
                    checked={editing.highlight ?? false}
                    onCheckedChange={(v) => setEditing({ ...editing, highlight: v })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-gold text-primary-foreground font-bold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Erro no upload: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  return (
    <div className="space-y-2">
      {value && (
        <img
          src={(value && ASSET_MAP[value]) || value}
          alt="preview"
          className="w-24 h-24 rounded object-cover border border-border"
        />
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Enviando..." : value ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remover
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Input
        placeholder="ou cole uma URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs"
      />
    </div>
  );
}
