import { useEffect, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ShoppingBag,
  UtensilsCrossed,
  Settings as SettingsIcon,
  Loader2,
  BarChart3,
  Tag,
  UserCog,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const knownIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAdmin || !user) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audioRef.current.load();
    }

    const sendPushNotification = (title: string, body: string) => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      new Notification(title, {
        body,
        icon: "/muthala-logo.png",
        tag: "new-order",
        requireInteraction: true,
        silent: false,
        badge: "/muthala-logo.png",
      });
    };

    const playBeep = () => {
      const soundOn = localStorage.getItem("muthala_admin_sound") !== "0";
      if (!soundOn || !audioRef.current) return;
      
      audioRef.current.currentTime = 0;
      audioRef.current.loop = false;
      audioRef.current.play().catch(e => console.warn("Erro ao tocar áudio:", e));
    };

    const stopBeep = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };

    supabase
      .from("orders")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        data?.forEach(o => knownIds.current.add(o.id));
      });

    const channel = supabase
      .channel("admin-global-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new as { id: string, customer_name: string | null };
        if (!knownIds.current.has(o.id)) {
          knownIds.current.add(o.id);
          
          const isOrdersPage = location.pathname === "/admin/pedidos";
          
          if (!isOrdersPage) {
            playBeep();
            
            const notifyOn = localStorage.getItem("muthala_admin_notify") === "1";
            if (notifyOn) {
              sendPushNotification(
                "🍔 NOVO PEDIDO!",
                `Novo pedido de ${o.customer_name || "cliente"} recebido agora.`
              );
            }

            toast.success(`🔔 Novo pedido — ${o.customer_name || "cliente"}`, {
              duration: 15000,
              action: {
                label: "Ver pedidos",
                onClick: () => navigate({ to: "/admin/pedidos" })
              }
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user, location.pathname, navigate]);

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
          Sua conta não tem permissão de administrador.
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
    { to: "/admin/bairros", label: "Fretes", icon: MapPin },
    { to: "/admin/cupons", label: "Cupons", icon: Tag },
    { to: "/admin/config", label: "Configurações", icon: SettingsIcon },
    { to: "/admin/conta", label: "Minha conta", icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-black flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-xl uppercase tracking-tighter bg-gradient-gold bg-clip-text text-transparent">Painel Administrativo</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-white hover:bg-white/5 uppercase text-[10px] font-bold tracking-widest"
              onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
        <div className="border-t border-white/5">
          <nav className="container mx-auto flex gap-1 px-4 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to as any}
                activeProps={{ className: "border-primary text-primary bg-primary/5" }}
                inactiveProps={{
                  className: "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5",
                }}
                className="flex items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-widest border-b-2 whitespace-nowrap transition-all"
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
