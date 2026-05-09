import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="font-display text-4xl uppercase mb-2">Ops! Algo deu errado</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Não conseguimos carregar esta página. Pode ser um erro temporário de conexão.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="bg-primary text-primary-foreground font-bold"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = "/"}
        >
          <Home className="w-4 h-4 mr-2" /> Voltar ao início
        </Button>
      </div>
      
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 p-4 bg-muted rounded-lg text-xs text-left overflow-auto max-w-full">
          {error.message}
        </pre>
      )}
    </div>
  );
}
