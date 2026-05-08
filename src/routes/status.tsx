import { createFileRoute } from "@tanstack/react-router";
import StatusPage from "@/pages/Status";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});
