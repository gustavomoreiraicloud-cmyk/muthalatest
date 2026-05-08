import { createFileRoute } from "@tanstack/react-router";
import AdminMenu from "@/components/admin/AdminMenu";

export const Route = createFileRoute("/admin/cardapio")({
  component: AdminMenu,
});
