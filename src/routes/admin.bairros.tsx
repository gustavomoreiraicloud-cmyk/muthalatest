import { createFileRoute } from "@tanstack/react-router";
import AdminNeighborhoods from "@/components/admin/AdminNeighborhoods";

export const Route = createFileRoute("/admin/bairros")({
  component: AdminNeighborhoods,
});
