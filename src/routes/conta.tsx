import { createFileRoute } from "@tanstack/react-router";
import ContaPage from "@/pages/Conta";

export const Route = createFileRoute("/conta")({
  component: ContaPage,
});
