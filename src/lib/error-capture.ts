import { toast } from "sonner";

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
  
  // Log de monitoramento em produção
  console.error("🚨 ERRO CAPTURADO:", {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : "N/A",
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "server"
  });

  // Notificação silenciosa via UI se estiver no navegador
  if (typeof window !== "undefined") {
    // Apenas logamos internamente, mas poderíamos enviar para um serviço como Sentry aqui
  }
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
