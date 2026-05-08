import { createFileRoute, redirect } from "@tanstack/react-router";
import AdminPage from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin") {
      throw redirect({
        to: "/admin/dashboard",
        replace: true,
      });
    }
  },
  component: AdminPage,
});
