import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthContextType = {
  user: { email: string } | null;
  session: any;
  isAdmin: boolean;
  loading: boolean;
  signIn: (user: string, pass: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("muthala_admin_session");
    if (savedUser) {
      setUser({ email: "admin" });
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, pass: string) => {
    // Login simplificado conforme solicitado: admin / admin
    if (username === "admin" && pass === "admin") {
      setUser({ email: "admin" });
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

  return (
    <AuthContext.Provider value={{ user, session: null, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

