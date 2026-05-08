import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ShoppingBag, UtensilsCrossed, Settings as SettingsIcon, Loader2, BarChart3, Tag, UserCog } from "lucide-react";

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
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
        <Button variant="outline" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
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
          <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
        <nav className="container mx-auto flex gap-1 px-2 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to as any}
              activeProps={{ className: "border-primary text-primary" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground hover:text-foreground" }}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
