import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import CartDrawer from "@/components/CartDrawer";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Muthala Burger" },
      { name: "description", content: "O melhor hambúrguer artesanal de Assis" },
      { property: "og:title", content: "Muthala Burger" },
      { name: "twitter:title", content: "Muthala Burger" },
      { property: "og:description", content: "O melhor hambúrguer artesanal de Assis" },
      { name: "twitter:description", content: "O melhor hambúrguer artesanal de Assis" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0dcd31c4-1eb2-4548-a61a-c83ae6315807/id-preview-519bfb41--aebc800f-48ee-442d-ad4f-261d92d5bcfb.lovable.app-1778273157075.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0dcd31c4-1eb2-4548-a61a-c83ae6315807/id-preview-519bfb41--aebc800f-48ee-442d-ad4f-261d92d5bcfb.lovable.app-1778273157075.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
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

