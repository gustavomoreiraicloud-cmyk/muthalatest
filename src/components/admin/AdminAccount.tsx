import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminAccount() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const updateEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      return toast.error("E-mail inválido");
    }
    if (trimmed === user?.email) {
      return toast.info("Esse já é o seu e-mail atual");
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSavingEmail(false);
    if (error) return toast.error(error.message);
    toast.success("Confirme a alteração no novo e-mail para concluir.");
  };

  const updatePassword = async () => {
    if (newPassword.length < 8) {
      return toast.error("A senha precisa ter ao menos 8 caracteres");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem");
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Senha atualizada!");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-display text-2xl uppercase">Minha conta</h2>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Alterar e-mail</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Ao alterar, você receberá um e-mail de confirmação no novo endereço. A troca só é
          concluída após o clique no link.
        </p>
        <div>
          <Label>Novo e-mail</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground mt-1">Atual: {user?.email}</p>
        </div>
        <Button
          onClick={updateEmail}
          disabled={savingEmail}
          className="w-full bg-gradient-gold text-primary-foreground font-bold"
        >
          {savingEmail ? "Enviando..." : "Atualizar e-mail"}
        </Button>
      </Card>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Alterar senha</h3>
        </div>
        <div>
          <Label>Nova senha</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label>Confirmar nova senha</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button
          onClick={updatePassword}
          disabled={savingPassword}
          className="w-full bg-gradient-gold text-primary-foreground font-bold"
        >
          {savingPassword ? "Salvando..." : "Atualizar senha"}
        </Button>
      </Card>
    </div>
  );
}
