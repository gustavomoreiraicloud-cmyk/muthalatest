import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, ShoppingBag, DollarSign, Award } from "lucide-react";
import { formatBRL } from "@/hooks/useCart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Order = {
  id: string;
  total: number;
  items: Array<{ name: string; qty: number }>;
  status: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    supabase
      .from("orders")
      .select("id,total,items,status,created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setOrders((data as unknown as Order[]) ?? []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at) >= today && o.status !== "cancelado"
    );
    const validOrders = orders.filter((o) => o.status !== "cancelado");
    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
    const weekRevenue = validOrders.reduce((s, o) => s + Number(o.total), 0);
    const ticket = validOrders.length ? weekRevenue / validOrders.length : 0;

    // Top items
    const itemMap = new Map<string, number>();
    validOrders.forEach((o) =>
      o.items?.forEach((it) => itemMap.set(it.name, (itemMap.get(it.name) ?? 0) + it.qty))
    );
    const top = [...itemMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // Daily chart
    const byDay = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    validOrders.forEach((o) => {
      const k = new Date(o.created_at).toISOString().slice(0, 10);
      if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + Number(o.total));
    });
    const chart = [...byDay.entries()].map(([day, total]) => ({
      day: new Date(day).toLocaleDateString("pt-BR", { weekday: "short" }),
      total,
    }));

    return {
      todayCount: todayOrders.length,
      todayRevenue,
      weekRevenue,
      ticket,
      top,
      chart,
    };
  }, [orders]);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  const cards = [
    { label: "Pedidos hoje", value: stats.todayCount, icon: ShoppingBag, color: "text-blue-400" },
    { label: "Faturamento hoje", value: formatBRL(stats.todayRevenue), icon: DollarSign, color: "text-green-400" },
    { label: "Faturamento 7d", value: formatBRL(stats.weekRevenue), icon: TrendingUp, color: "text-primary" },
    { label: "Ticket médio", value: formatBRL(stats.ticket), icon: Award, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl uppercase">Dashboard</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="font-display text-3xl">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold mb-4">Faturamento — últimos 7 dias</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={stats.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold mb-4">Top 5 itens — últimos 7 dias</h3>
          {stats.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pedidos no período.</p>
          ) : (
            <ul className="space-y-2">
              {stats.top.map((it, idx) => (
                <li key={it.name} className="flex items-center gap-3">
                  <span className="font-display text-2xl text-primary w-8">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{it.name}</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-gold"
                        style={{ width: `${(it.qty / stats.top[0].qty) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-bold text-sm">{it.qty}x</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
