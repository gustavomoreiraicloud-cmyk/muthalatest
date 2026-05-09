import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Converte username -> e-mail interno (Supabase exige e-mail)
const toInternalEmail = (raw: string) => {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  if (v.includes("@")) return v;
  // sanitize: apenas letras, números, ponto, hífen, underline
  const safe = v.replace(/[^a-z0-9._-]/g, "");
  return `${safe}@muthala.local`;
};

export default function Auth() {
  const { signIn, signUp, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" }) as { redirect?: string; mode?: string };
  const [isSignUp, setIsSignUp] = useState(search.mode === "signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate({ to: "/admin", replace: true });
      } else {
        navigate({ to: (search.redirect as any) || "/", replace: true });
      }
    }
  }, [loading, user, isAdmin, navigate, search.redirect]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Informe o usuário");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    const email = toInternalEmail(username);

    if (isSignUp) {
      const { error } = await signUp(email, password, { full_name: username });
      setSubmitting(false);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Conta criada! Entrando...");
      await signIn(email, password);
    } else {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        toast.error("Usuário ou senha inválidos");
        return;
      }
      toast.success("Bem-vindo!");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Button
        variant="ghost"
        className="mb-8 text-muted-foreground hover:text-foreground"
        onClick={() => navigate({ to: "/" })}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
      </Button>

      <Card className="w-full max-w-md p-8 bg-card border-border shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isSignUp ? (
              <User className="w-5 h-5 text-primary" />
            ) : (
              <Lock className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl uppercase">
              {isSignUp ? "Criar Conta" : "Entrar"}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              Muthala Burger
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs uppercase font-bold">
              Usuário
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                className="pl-10 bg-background/50"
                placeholder="ex: admin"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase font-bold">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-10 bg-background/50"
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-gold text-primary-foreground font-black uppercase tracking-widest h-12 mt-4"
          >
            {submitting ? "Processando..." : isSignUp ? "Cadastrar" : "Entrar"}
          </Button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline font-bold"
            >
              {isSignUp ? "Já tem uma conta? Entre agora" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
