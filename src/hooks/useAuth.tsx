import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthContextType = {
  user: { username: string } | null;
  session: any;
  isAdmin: boolean;
  loading: boolean;
  signIn: (user: string, pass: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateCredentials: (
    oldUser: string,
    newUser: string,
    oldPass: string,
    newPass: string,
  ) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("muthala_admin_user") || "admin";
    const session = localStorage.getItem("muthala_admin_session");
    if (session) {
      setUser({ username: savedUser });
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, pass: string) => {
    const currentAdminUser = localStorage.getItem("muthala_admin_user") || "admin";
    const currentAdminPass = localStorage.getItem("muthala_admin_pass") || "admin";

    if (username === currentAdminUser && pass === currentAdminPass) {
      setUser({ username });
      setIsAdmin(true);
      localStorage.setItem("muthala_admin_session", "true");
      return { error: null };
    }
    return { error: "Credenciais inválidas" };
  };

  const signOut = async () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("muthala_admin_session");
  };

  const updateCredentials = async (
    oldUser: string,
    newUser: string,
    oldPass: string,
    newPass: string,
  ) => {
    const currentAdminUser = localStorage.getItem("muthala_admin_user") || "admin";
    const currentAdminPass = localStorage.getItem("muthala_admin_pass") || "admin";

    if (oldUser !== currentAdminUser || oldPass !== currentAdminPass) {
      return { error: "Usuário ou senha atual incorretos" };
    }

    localStorage.setItem("muthala_admin_user", newUser);
    localStorage.setItem("muthala_admin_pass", newPass);
    setUser({ username: newUser });

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session: null, isAdmin, loading, signIn, signOut, updateCredentials }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
