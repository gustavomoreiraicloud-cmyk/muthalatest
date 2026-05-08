import { createFileRoute } from "@tanstack/react-router";
import AdminOrders from "@/components/admin/AdminOrders";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});
