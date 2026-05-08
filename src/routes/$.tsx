import { createFileRoute } from "@tanstack/react-router";
import NotFoundPage from "@/pages/NotFound";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});
