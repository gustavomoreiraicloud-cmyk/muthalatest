import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed" | "free_shipping";
  discount_value: number;
  min_order: number;
  active: boolean;
  expires_at: string | null;
};

const TYPE_LABEL: Record<Coupon["discount_type"], string> = {
  percent: "% de desconto",
  fixed: "R$ fixo de desconto",
  free_shipping: "Frete grátis",
};

export default function AdminCoupons() {
  const [list, setList] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // form
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<Coupon["discount_type"]>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar cupons");
    setList((data as Coupon[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return toast.error("Informe o código");
    setCreating(true);
    const { error } = await supabase.from("coupons").insert({
      code: c,
      description: description || null,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      min_order: parseFloat(minOrder) || 0,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
    });
    setCreating(false);
    if (error)
      return toast.error(error.message.includes("duplicate") ? "Cupom já existe" : "Erro ao criar");
    toast.success("Cupom criado!");
    setCode("");
    setDescription("");
    setDiscountValue("");
    setMinOrder("");
    setExpiresAt("");
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("coupons").update({ active }).eq("id", id);
    if (error) return toast.error("Erro");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir cupom?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error("Erro");
    toast.success("Cupom excluído");
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl uppercase flex items-center gap-2">
        <Tag className="w-6 h-6 text-primary" /> Cupons de desconto
      </h2>

      <Card className="p-5 bg-card border-border space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo cupom
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Código *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PRIMEIRA10"
              maxLength={30}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="10% pra primeiro pedido"
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as Coupon["discount_type"])}
            >
              <option value="percent">% de desconto</option>
              <option value="fixed">R$ fixo de desconto</option>
              <option value="free_shipping">Frete grátis</option>
            </select>
          </div>
          <div>
            <Label>
              Valor {discountType === "percent" ? "(%)" : discountType === "fixed" ? "(R$)" : ""}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              disabled={discountType === "free_shipping"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "10" : "5.00"}
            />
          </div>
          <div>
            <Label>Pedido mínimo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="50"
            />
          </div>
          <div>
            <Label>Validade (opcional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={create}
          disabled={creating}
          className="w-full bg-gradient-gold text-primary-foreground font-bold"
        >
          {creating ? "Criando..." : "Criar cupom"}
        </Button>
      </Card>

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />
      ) : list.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Nenhum cupom criado.</Card>
      ) : (
        <div className="grid gap-2">
          {list.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            return (
              <Card
                key={c.id}
                className="p-4 bg-card border-border flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-primary">{c.code}</span>
                    {expired && (
                      <Badge variant="outline" className="text-destructive border-destructive">
                        Expirado
                      </Badge>
                    )}
                    {!c.active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[c.discount_type]}
                    {c.discount_type !== "free_shipping" &&
                      ` · ${c.discount_value}${c.discount_type === "percent" ? "%" : " R$"}`}
                    {Number(c.min_order) > 0 && ` · mínimo R$ ${Number(c.min_order).toFixed(2)}`}
                    {c.expires_at && ` · até ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`}
                  </p>
                  {c.description && <p className="text-xs italic mt-1">{c.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={c.active} onCheckedChange={(v) => toggle(c.id, v)} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(c.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
