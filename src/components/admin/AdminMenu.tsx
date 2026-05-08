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
import { Pencil, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

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
    if (!editing) return;
    if (!editing.name || !editing.category || editing.price == null) {
      return toast.error("Preencha nome, categoria e preço");
    }
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
    if (error) return toast.error("Erro ao salvar");
    toast.success("Salvo!");
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

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase">Cardápio ({items.length})</h2>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setEditing({ ...empty })} className="bg-gradient-gold text-primary-foreground font-bold">
            <Plus className="w-4 h-4" /> Novo item
          </Button>
        </div>
      </div>

      {items.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum item ainda. Cadastre o primeiro hambúrguer!
        </Card>
      )}

      <div className="grid gap-2">
        {filtered.map((it) => (
          <Card key={it.id} className={`p-3 flex items-center gap-3 bg-card border-border ${!it.available ? "opacity-60" : ""}`}>
            {it.image_url ? (
              <img src={it.image_url} alt={it.name} className="w-14 h-14 rounded object-cover" />
            ) : (
              <div className="w-14 h-14 rounded bg-muted" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold truncate">{it.name}</p>
                {it.highlight && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">Destaque</span>}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {CATEGORIES.find((c) => c.id === it.category)?.label ?? it.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{it.description}</p>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="flex flex-col items-end">
                <p className="font-display text-primary whitespace-nowrap">R$ {Number(it.price).toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {it.available ? "Ativo" : "Pausado"}
                  </span>
                  <Switch checked={it.available} onCheckedChange={() => toggleAvailable(it)} />
                </div>
              </div>
              <div className="flex items-center gap-1 border-l border-border pl-4">
                <Button size="icon" variant="ghost" onClick={() => setEditing(it)} title="Editar">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)} title="Excluir">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
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
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Ingredientes (um por linha)</Label>
                <Textarea
                  rows={4}
                  value={(editing.ingredients ?? []).join("\n")}
                  onChange={(e) => setEditing({ ...editing, ingredients: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Imagem</Label>
                <ImagePicker
                  value={editing.image_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Disponível</Label>
                <Switch checked={editing.available ?? true} onCheckedChange={(v) => setEditing({ ...editing, available: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Destaque</Label>
                <Switch checked={editing.highlight ?? false} onCheckedChange={(v) => setEditing({ ...editing, highlight: v })} />
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
        <img src={value} alt="preview" className="w-32 h-32 rounded object-cover border border-border" />
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
