import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, ShoppingBag, DollarSign, Calendar, CreditCard, Wallet, MapPin } from "lucide-react";
import { formatBRL } from "@/hooks/useCart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Order = {
  id: string;
  total: number;
  items: Array<{ name: string; qty: number }>;
  status: string;
  created_at: string;
  payment_method: string;
  delivery_method: string;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 30); // Aumentar para 30 dias para métricas mensais
    supabase
      .from("orders")
      .select("id,total,items,status,created_at,payment_method,delivery_method")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setOrders((data as unknown as Order[]) ?? []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Se a loja ainda não abriu hoje (antes das 18h), mostrar os dados desde o início da última noite de operação
    // Por padrão, vamos focar no faturamento do "dia operacional" (de hoje até o fechamento)
    const operationalDay = new Date(today);

    const validOrders = orders.filter((o) => o.status !== "cancelado");
    const todayOrders = validOrders.filter((o) => new Date(o.created_at) >= operationalDay);
    const monthOrders = validOrders.filter((o) => new Date(o.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1));

    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total), 0);

    // Métodos de pagamento (Pie Chart)
    const paymentMap = new Map<string, number>();
    validOrders.forEach((o) => {
      const method = o.payment_method || "Não informado";
      paymentMap.set(method, (paymentMap.get(method) ?? 0) + 1);
    });
    const paymentData = [...paymentMap.entries()].map(([name, value]) => ({ name: name.toUpperCase(), value }));

    // Entrega vs Retirada
    const deliveryMap = new Map<string, number>();
    validOrders.forEach((o) => {
      const method = o.delivery_method || "entrega";
      deliveryMap.set(method, (deliveryMap.get(method) ?? 0) + 1);
    });
    const deliveryData = [...deliveryMap.entries()].map(([name, value]) => ({ 
      name: name === "entrega" ? "Entrega" : "Retirada", 
      value 
    }));

    // Top items
    const itemMap = new Map<string, number>();
    validOrders.forEach((o) =>
      o.items?.forEach((it) => itemMap.set(it.name, (itemMap.get(it.name) ?? 0) + it.qty))
    );
    const top = [...itemMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    // Daily chart (últimos 7 dias)
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
      monthRevenue,
      monthCount: monthOrders.length,
      top,
      chart,
      paymentData,
      deliveryData,
    };
  }, [orders]);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  const cards = [
    { label: "Vendas hoje", value: stats.todayCount, icon: ShoppingBag, color: "text-blue-400" },
    { label: "Receita hoje", value: formatBRL(stats.todayRevenue), icon: DollarSign, color: "text-green-400" },
    { label: "Vendas mês", value: stats.monthCount, icon: Calendar, color: "text-primary" },
    { label: "Receita mês", value: formatBRL(stats.monthRevenue), icon: Wallet, color: "text-yellow-400" },
  ];

  const COLORS = ["#e94560", "#f97316", "#fbbf24", "#4ade80", "#60a5fa"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase">Dashboard</h2>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
          Atualizado em {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 bg-card border-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase font-bold tracking-wider">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="font-display text-2xl md:text-3xl truncate">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Gráfico de Faturamento */}
        <Card className="p-4 lg:col-span-2 bg-card border-border">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Faturamento — últimos 7 dias
          </h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={stats.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontWeight: "bold",
                  }}
                  formatter={(v: number) => formatBRL(v)}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Itens */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold mb-6">Top 5 itens vendidos</h3>
          {stats.top.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Sem dados suficientes.</p>
          ) : (
            <ul className="space-y-5">
              {stats.top.map((it, idx) => (
                <li key={it.name} className="flex items-center gap-3">
                  <span className="font-display text-xl text-primary/40 w-6">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{it.name}</p>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-gradient-gold"
                        style={{ width: `${(it.qty / stats.top[0].qty) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-bold text-sm text-muted-foreground">{it.qty}x</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pagamentos */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Distribuição de Pagamentos
          </h3>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.paymentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {stats.paymentData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground font-medium">{p.name}: <span className="text-foreground font-bold">{p.value}</span></span>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery vs Retirada */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Delivery vs Retirada
          </h3>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.deliveryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.deliveryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {stats.deliveryData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                <span className="text-muted-foreground font-medium">{p.name}: <span className="text-foreground font-bold">{p.value}</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
