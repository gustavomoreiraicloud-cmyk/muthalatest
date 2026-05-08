import { useEffect } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ShoppingBag, UtensilsCrossed, Settings as SettingsIcon, Loader2, BarChart3, Tag, UserCog } from "lucide-react";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminMenu from "@/components/admin/AdminMenu";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminAccount from "@/components/admin/AdminAccount";

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <h1 className="font-display text-3xl">Acesso negado</h1>
        <p className="text-muted-foreground max-w-md">
          Sua conta ({user.email}) não tem permissão de administrador. Solicite ao dono da loja.
        </p>
        <Button variant="outline" onClick={() => signOut().then(() => navigate("/auth"))}>
          Sair
        </Button>
      </div>
    );
  }

  const tabs = [
    { to: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
    { to: "/admin/cupons", label: "Cupons", icon: Tag },
    { to: "/admin/config", label: "Configurações", icon: SettingsIcon },
    { to: "/admin/conta", label: "Minha conta", icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div>
            <h1 className="font-display text-xl uppercase">Painel Muthala</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate("/auth"))}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
        <nav className="container mx-auto flex gap-1 px-2 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="cardapio" element={<AdminMenu />} />
          <Route path="cupons" element={<AdminCoupons />} />
          <Route path="config" element={<AdminSettings />} />
          <Route path="conta" element={<AdminAccount />} />
        </Routes>
      </main>
    </div>
  );
}
