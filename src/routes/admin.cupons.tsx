import { createFileRoute } from "@tanstack/react-router";
import AdminCoupons from "@/components/admin/AdminCoupons";

export const Route = createFileRoute("/admin/cupons")({
  component: AdminCoupons,
});
