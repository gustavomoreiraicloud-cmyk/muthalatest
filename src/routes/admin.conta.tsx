import { createFileRoute } from "@tanstack/react-router";
import AdminAccount from "@/components/admin/AdminAccount";

export const Route = createFileRoute("/admin/conta")({
  component: AdminAccount,
});
