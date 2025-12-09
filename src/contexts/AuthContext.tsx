import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authProvider, type AuthUser } from "@/services/auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authProvider.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    authProvider.getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, error } = await authProvider.signIn({ email, password });
    if (user) setUser(user);
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { user, error } = await authProvider.signUp({ email, password, fullName });
    if (user) setUser(user);
    return { error };
  };

  const signOut = async () => {
    await authProvider.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}