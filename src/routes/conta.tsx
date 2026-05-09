import { createFileRoute } from "@tanstack/react-router";
import ContaPage from "@/pages/Conta";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [{ title: "Minha Conta | Muthala Burger" }],
  }),
  component: ContaPage,
});
