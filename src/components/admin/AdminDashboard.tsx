import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  MapPin,
  Clock,
  FileDown,
} from "lucide-react";
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
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 30); // Aumentar para 30 dias para métricas mensais
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,total,items,status,created_at,payment_method,delivery_method")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      
      setOrders((data as unknown as Order[]) ?? []);
      setLastUpdate(new Date());
      setLoading(false);
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    // Canal em tempo real para atualizar o dashboard quando houver novos pedidos ou mudanças
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          // Recarrega os dados quando algo muda
          const since = new Date();
          since.setDate(since.getDate() - 30);
          supabase
            .from("orders")
            .select("id,total,items,status,created_at,payment_method,delivery_method")
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: true })
            .then(({ data }) => {
              setOrders((data as unknown as Order[]) ?? []);
              setLastUpdate(new Date());
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Se a loja ainda não abriu hoje (antes das 18h), mostrar os dados desde o início da última noite de operação
    // Por padrão, vamos focar no faturamento do "dia operacional" (de hoje até o fechamento)
    const operationalDay = new Date(today);

    const validOrders = Array.isArray(orders) ? orders.filter((o) => o && o.status !== "cancelado") : [];
    const todayOrders = validOrders.filter((o) => o.created_at && new Date(o.created_at) >= operationalDay);
    const monthOrders = validOrders.filter(
      (o) => o.created_at && new Date(o.created_at) >= new Date(now.getFullYear(), now.getMonth(), 1),
    );

    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total), 0);

    // Métodos de pagamento (Pie Chart)
    const paymentMap = new Map<string, number>();
    validOrders.forEach((o) => {
      const method = o.payment_method || "Não informado";
      paymentMap.set(method, (paymentMap.get(method) ?? 0) + 1);
    });
    const paymentData = [...paymentMap.entries()].map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));

    // Entrega vs Retirada
    const deliveryMap = new Map<string, number>();
    validOrders.forEach((o) => {
      const method = o.delivery_method || "entrega";
      deliveryMap.set(method, (deliveryMap.get(method) ?? 0) + 1);
    });
    const deliveryData = [...deliveryMap.entries()].map(([name, value]) => ({
      name: name === "entrega" ? "Entrega" : "Retirada",
      value,
    }));

    // Top items
    const itemMap = new Map<string, number>();
    validOrders.forEach((o) =>
      o.items?.forEach((it) => itemMap.set(it.name, (itemMap.get(it.name) ?? 0) + it.qty)),
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
    {
      label: "Fila de espera",
      value: `${orders.filter((o) => ["novo", "preparo"].includes(o.status)).length} pedidos`,
      icon: Clock,
      color: "text-orange-400",
    },
    { label: "Vendas mês", value: stats.monthCount, icon: Calendar, color: "text-primary" },
    {
      label: "Receita mês",
      value: formatBRL(stats.monthRevenue),
      icon: Wallet,
      color: "text-yellow-400",
    },
  ];

  const COLORS = ["#e94560", "#f97316", "#fbbf24", "#4ade80", "#60a5fa"];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
        <div>
          <h2 className="font-display text-3xl uppercase text-primary">Resumo Geral</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Métricas dos últimos 30 dias
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="font-bold uppercase text-[10px] tracking-widest h-9"
            onClick={() => {
              const esc = (s: unknown) =>
                String(s ?? "")
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#39;");

              const validOrders = orders.filter(o => o.status !== 'cancelado');
              const totalRevenue = validOrders.reduce((acc, o) => acc + Number(o.total), 0);

              const html = `
                <html><head><title>Relatório de Vendas - Muthala Burger</title>
                <style>
                  body{font-family:sans-serif;padding:40px;color:#333;line-height:1.5}
                  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e94560;padding-bottom:20px;margin-bottom:30px}
                  .title{font-size:24px;font-weight:bold;color:#e94560}
                  .meta{font-size:12px;color:#666}
                  table{width:100%;border-collapse:collapse;margin-top:20px}
                  th{background:#f8f9fa;text-align:left;padding:12px;border-bottom:2px solid #dee2e6;font-size:12px;text-transform:uppercase}
                  td{padding:12px;border-bottom:1px solid #dee2e6;font-size:13px}
                  .total-row{background:#f8f9fa;font-weight:bold}
                  .footer{margin-top:40px;text-align:center;font-size:10px;color:#999}
                  .badge{padding:4px 8px;border-radius:4px;font-size:10px;font-weight:bold;text-transform:uppercase}
                  @media print { .no-print { display: none } }
                </style></head><body>
                  <div class="header">
                    <div>
                      <div class="title">MUTHALA BURGER</div>
                      <div class="meta">Relatório de Vendas (Últimos 30 dias)</div>
                    </div>
                    <div style="text-align:right">
                      <div class="meta">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
                      <div class="meta">Total de Pedidos: ${validOrders.length}</div>
                    </div>
                  </div>

                  <div style="display:grid;grid-template-cols:1fr 1fr;gap:20px;margin-bottom:30px">
                    <div style="background:#fef2f2;padding:20px;border-radius:10px;border:1px solid #fee2e2">
                      <div class="meta" style="color:#e94560;font-weight:bold;margin-bottom:5px">FATURAMENTO TOTAL</div>
                      <div style="font-size:28px;font-weight:bold;color:#e94560">${formatBRL(totalRevenue)}</div>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Nº Pedido</th>
                        <th>Método</th>
                        <th>Pagamento</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${validOrders.reverse().map(o => `
                        <tr>
                          <td>${esc(new Date(o.created_at).toLocaleDateString('pt-BR'))}</td>
                          <td>#${esc(o.id.slice(0, 6).toUpperCase())}</td>
                          <td>${esc(o.delivery_method === 'retirada' ? 'Retirada' : 'Entrega')}</td>
                          <td style="text-transform:uppercase">${esc(o.payment_method)}</td>
                          <td style="font-weight:bold">${esc(formatBRL(Number(o.total)))}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot>
                      <tr class="total-row">
                        <td colspan="4" style="text-align:right">TOTAL ACUMULADO:</td>
                        <td>${esc(formatBRL(totalRevenue))}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div class="footer">
                    Muthala Burger - Sistema de Gestão Interna<br/>
                    © ${new Date().getFullYear()} - Todos os direitos reservados
                  </div>
                </body></html>
              `;

              const blob = new Blob([html], { type: "text/html;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `relatorio-muthala-${new Date().toISOString().slice(0,10)}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Última atualização</p>
            <p className="text-sm font-bold text-foreground">{lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais - Mais limpos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-6 bg-card border-border shadow-sm flex items-center gap-4 group hover:border-primary/50 transition-colors">
            <div className={`p-3 rounded-2xl bg-muted/50 ${c.color.replace('text-', 'bg-').split(' ')[0]}/10 group-hover:scale-110 transition-transform`}>
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
                {c.label}
              </p>
              <p className="font-display text-3xl leading-none text-white">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de Faturamento - Estilo Moderno */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest text-white">
              <TrendingUp className="w-4 h-4 text-primary" /> Faturamento Semanal
            </h3>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={stats.chart}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e94560" stopOpacity={1} />
                    <stop offset="100%" stopColor="#e94560" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" vertical={false} opacity={0.1} />
                <XAxis
                  dataKey="day"
                  stroke="#ffffff"
                  fontSize={12}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                  tick={{ dy: 10, fill: "#ffffff" }}
                />
                <YAxis
                  stroke="#ffffff"
                  fontSize={11}
                  fontWeight="bold"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                  tick={{ fill: "#ffffff" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "2px solid #e94560",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                    padding: "12px",
                  }}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  labelStyle={{ color: "#e94560", fontWeight: "black", marginBottom: "4px" }}
                  formatter={(v: number) => [formatBRL(v), "Faturamento"]}
                />
                <Bar
                  dataKey="total"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Itens - Ranking Simplificado (Curva ABC) */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold uppercase text-xs tracking-widest flex items-center gap-2 text-white">
              <ShoppingBag className="w-4 h-4 text-primary" /> Curva ABC (Mais Vendidos)
            </h3>
            <div className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase">
              Ranking {stats.top.length}
            </div>
          </div>
          {stats.top.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
              <ShoppingBag className="w-8 h-8 opacity-20" />
              <p className="text-sm italic">Nenhum dado registrado.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {stats.top.map((it, idx) => (
                <div key={it.name} className="flex items-center gap-4 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-lg shrink-0 ${
                    idx === 0 ? 'bg-gradient-gold text-primary-foreground' : 'bg-muted text-primary/60'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1.5">
                      <p className="font-bold text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">
                        {it.name}
                      </p>
                      <div className="text-right">
                        <span className="font-black text-xs text-white block">{it.qty} unidades</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                          {((it.qty / stats.top.reduce((a, b) => a + b.qty, 0)) * 100).toFixed(1)}% do volume
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(it.qty / stats.top[0].qty) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${idx === 0 ? 'bg-gradient-fire shadow-[0_0_10px_rgba(233,69,96,0.5)]' : 'bg-gradient-gold'}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-8 pt-6 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-black text-center tracking-widest">
                  Analise o volume para otimizar seu estoque de insumos
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Métodos de Entrega e Pagamento - Lado a Lado Simplificado */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-card border-border">
          <h3 className="font-bold mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Preferência de Entrega
          </h3>
          <div className="flex items-center justify-around py-4">
            {stats.deliveryData.map((d, i) => (
              <div key={d.name} className="text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{d.name}</p>
                <p className="font-display text-4xl text-white leading-none">{d.value}</p>
                <div className={`h-1 w-12 mx-auto mt-3 rounded-full ${i === 0 ? 'bg-primary' : 'bg-orange-500'}`} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="font-bold mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Métodos de Pagamento
          </h3>
          <div className="flex flex-wrap gap-4 justify-center py-2">
            {stats.paymentData.map((p, i) => (
              <div key={p.name} className="bg-muted/30 border border-border/50 px-4 py-3 rounded-xl min-w-[120px] text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{p.name}</p>
                <p className="font-display text-2xl text-white leading-none">{p.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
