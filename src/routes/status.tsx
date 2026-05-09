import { createFileRoute } from "@tanstack/react-router";
import StatusPage from "@/pages/Status";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [{ title: "Acompanhar Pedido | Muthala Burger" }],
  }),
  component: StatusPage,
});
