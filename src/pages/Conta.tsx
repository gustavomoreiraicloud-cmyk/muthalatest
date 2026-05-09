import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, ClipboardList, User as UserIcon, Loader2 } from "lucide-react";
import { formatBRL } from "@/hooks/useCart";
import muthalaLogo from "@/assets/muthala-logo.png";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  preparo: "Preparando",
  entrega: "Saiu p/ entrega",
  finalizado: "Entregue",
  cancelado: "Cancelado",
};

export default function Conta() {
  const { user, signOut, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth";
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setOrders(data ?? []);
      setLoadingOrders(false);
    })();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const name = (user.user_metadata as any)?.full_name || user.email?.split("@")[0];

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <div className="flex flex-col items-center gap-4">
          <a href="/" className="transition-transform hover:scale-110 duration-300">
            <img src={muthalaLogo} alt="Muthala Logo" className="w-20 h-20 object-contain" />
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Início
          </Button>
        </div>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl uppercase">{name}</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Meus Pedidos</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/status")}
              className="gap-2 text-primary"
            >
              <ClipboardList className="w-4 h-4" /> Rastrear
            </Button>
          </div>

          {loadingOrders ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Você ainda não fez pedidos.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 px-2 rounded"
                  onClick={() =>
                    (window.location.href = `/status?id=${o.order_number}`)
                  }
                >
                  <div>
                    <p className="font-bold text-sm">#{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary font-bold uppercase">
                      {STATUS_LABEL[o.status] ?? o.status}
                    </p>
                    <p className="font-bold">{formatBRL(Number(o.total))}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
