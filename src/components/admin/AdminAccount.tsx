import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function AdminAccount() {
  const { user, updateCredentials } = useAuth();
  
  const [oldUsername, setOldUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateUser = async () => {
    if (!oldUsername || !newUsername) {
      return toast.error("Preencha o usuário atual e o novo");
    }
    setSavingUser(true);
    // Para atualizar só o usuário, precisamos passar a senha atual também. 
    // Como simplificamos, vamos pedir tudo no mesmo fluxo ou usar a senha atual salva.
    // Mas seguindo o pedido: "peça o anterior e o novo"
    toast.info("Para segurança, altere usuário e senha juntos ou use os campos abaixo");
    setSavingUser(false);
  };

  const handleFullUpdate = async () => {
    if (!oldUsername || !newUsername || !oldPassword || !newPassword) {
      return toast.error("Preencha todos os campos para atualizar");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem");
    }
    
    setSavingPassword(true);
    const { error } = await updateCredentials(oldUsername, newUsername, oldPassword, newPassword);
    setSavingPassword(false);

    if (error) {
      return toast.error(error);
    }

    toast.success("Credenciais atualizadas com sucesso!");
    setOldUsername("");
    setNewUsername("");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="font-display text-2xl uppercase">Minha conta</h2>

      <Card className="p-6 space-y-4 bg-card border-border">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Alterar Acesso</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Usuário atual logado: <b className="text-primary">{user?.username}</b>
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Usuário Anterior</Label>
            <Input
              value={oldUsername}
              onChange={(e) => setOldUsername(e.target.value)}
              placeholder="Ex: admin"
            />
          </div>
          <div className="space-y-2">
            <Label>Novo Usuário</Label>
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Ex: mestre_viking"
            />
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm uppercase">Segurança</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Senha Anterior</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
          </div>
        </div>

        <Button
          onClick={handleFullUpdate}
          disabled={savingPassword}
          className="w-full bg-gradient-gold text-primary-foreground font-bold mt-6"
        >
          {savingPassword ? "Salvando..." : "Atualizar Credenciais de Acesso"}
        </Button>
      </Card>
    </div>
  );
}
