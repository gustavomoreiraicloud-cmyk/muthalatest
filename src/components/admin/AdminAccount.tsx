import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminAccount() {
  const { user, updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      return toast.error("A senha deve ter pelo menos 8 caracteres");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem");
    }
    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);
    if (error) return toast.error(error);
    toast.success("Senha atualizada com sucesso!");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-display text-2xl uppercase">Minha conta</h2>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Conta</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          E-mail: <b className="text-primary">{user?.email?.split('@')[0]}</b>
        </p>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm uppercase">Alterar Senha</h3>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleUpdatePassword} disabled={saving}>
              {saving ? "Salvando..." : "Atualizar senha"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
