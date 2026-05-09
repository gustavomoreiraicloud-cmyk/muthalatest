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

const SITE_URL = "https://oi-hug-happy.lovable.app/";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Muthala Burger | O Melhor Hambúrguer Artesanal de Assis/SP" },
      {
        name: "description",
        content:
          "Descubra o sabor lendário do Muthala Burger em Assis/SP. Hambúrgueres artesanais, smash burgers suculentos e ingredientes de alta qualidade. Peça online agora!",
      },
      { name: "keywords", content: "hambúrguer artesanal, burger assis sp, delivery hambúrguer, smash burger, muthala burger, melhor lanche assis, hamburgueria assis centro" },
      { property: "og:title", content: "Muthala Burger | O Melhor Hambúrguer Artesanal de Assis/SP" },
      { property: "og:description", content: "Open Interaction allows users to upload and view website files, including images." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Muthala Burger" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0dcd31c4-1eb2-4548-a61a-c83ae6315807/id-preview-519bfb41--aebc800f-48ee-442d-ad4f-261d92d5bcfb.lovable.app-1778273157075.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Muthala Burger | O Melhor Hambúrguer Artesanal de Assis/SP" },
      { name: "twitter:description", content: "Open Interaction allows users to upload and view website files, including images." },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/0dcd31c4-1eb2-4548-a61a-c83ae6315807/id-preview-519bfb41--aebc800f-48ee-442d-ad4f-261d92d5bcfb.lovable.app-1778273157075.png",
      },
      { name: "geo.region", content: "BR-SP" },
      { name: "geo.placename", content: "Assis" },
      { name: "geo.position", content: "-22.6617;-50.4132" },
      { name: "ICBM", content: "-22.6617, -50.4132" },
      { name: "robots", content: "index, follow" },
      { name: "description", content: "Open Interaction allows users to upload and view website files, including images." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ab4ef172-b181-47ae-9875-8463a4762826/id-preview-9d4d8f58--aebc800f-48ee-442d-ad4f-261d92d5bcfb.lovable.app-1778305558028.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ab4ef172-b181-47ae-9875-8463a4762826/id-preview-9d4d8f58--aebc800f-48ee-442d-ad4f-261d92d5bcfb.lovable.app-1778305558028.png" },
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
