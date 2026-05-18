import { createFileRoute } from "@tanstack/react-router";
import IndexPage from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Muthala Burger | Melhor Hambúrguer Artesanal de Assis/SP",
      },
      {
        name: "description",
        content: "Hambúrgueres artesanais lendários em Assis/SP. Prove nossos smash burgers suculentos feitos com ingredientes premium. Delivery rápido e prático!",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://muthalatest.lovable.app/",
      },
    ],
  }),
  component: IndexPage,
});
