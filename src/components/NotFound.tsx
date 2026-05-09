import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Utensils className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-display text-5xl md:text-7xl uppercase mb-2">404</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        Parece que você se perdeu no caminho para o Valhalla. Esta página não existe.
      </p>
      <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground font-bold px-8">
        <Link to="/">Voltar ao Cardápio</Link>
      </Button>
    </div>
  );
}
