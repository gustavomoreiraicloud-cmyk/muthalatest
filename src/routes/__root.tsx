import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import CartDrawer from "@/components/CartDrawer";
import { NotFound } from "@/components/NotFound";
import { RouteError } from "@/components/RouteError";

import appCss from "../styles.css?url";

const SITE_URL = "https://muthalatest.lovable.app/";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Muthala Burger | Melhor Hambúrguer Artesanal em Assis/SP" },
      {
        name: "description",
        content:
          "O melhor hambúrguer artesanal de Assis/SP. Smash burgers suculentos, ingredientes premium e sabor lendário. Peça seu delivery agora no Muthala Burger!",
      },
      { name: "keywords", content: "hambúrguer artesanal Assis, burger Assis SP, delivery lanches Assis, melhor hambúrguer Assis, hamburgueria Assis centro, smash burger Assis" },
      { property: "og:title", content: "Muthala Burger | O Sabor dos Deuses em Assis/SP" },
      { property: "og:description", content: "Hambúrgueres artesanais forjados com paixão. Experimente o melhor smash burger de Assis e região." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Muthala Burger" },
      {
        property: "og:image",
        content: "https://muthalatest.lovable.app/og-image.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Muthala Burger | Hambúrguer Artesanal em Assis" },
      { name: "twitter:description", content: "O melhor smash burger de Assis/SP. Peça online e receba em casa." },
      {
        name: "twitter:image",
        content: "https://muthalatest.lovable.app/og-image.jpg",
      },
      { name: "geo.region", content: "BR-SP" },
      { name: "geo.placename", content: "Assis" },
      { name: "geo.position", content: "-22.6617;-50.4132" },
      { name: "ICBM", content: "-22.6617, -50.4132" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <Outlet />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
