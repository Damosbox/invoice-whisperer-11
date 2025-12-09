// ============================================
// Supabase Auth Provider
// Implémentation par défaut - remplaçable par Keycloak
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { AppRole, UserProfile } from "@/types";
import type { AuthProvider, AuthUser, AuthSession, SignInCredentials, SignUpCredentials } from "./types";

export class SupabaseAuthProvider implements AuthProvider {
  name = "supabase";

  async signIn(credentials: SignInCredentials): Promise<{ user: AuthUser | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    if (!data.user) {
      return { user: null, error: new Error("Utilisateur non trouvé") };
    }

    const authUser = await this.getCurrentUser();
    return { user: authUser, error: null };
  }

  async signUp(credentials: SignUpCredentials): Promise<{ user: AuthUser | null; error: Error | null }> {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: credentials.fullName,
        },
      },
    });

    if (error) {
      return { user: null, error: new Error(error.message) };
    }

    if (!data.user) {
      return { user: null, error: new Error("Erreur lors de l'inscription") };
    }

    const authUser = await this.getCurrentUser();
    return { user: authUser, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  }

  async getSession(): Promise<AuthSession | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }

    const user = await this.getCurrentUser();

    return {
      user,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at || null,
    };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Récupérer le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Récupérer les rôles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles: AppRole[] = rolesData?.map((r) => r.role as AppRole) || [];

    return {
      id: user.id,
      email: user.email || "",
      profile: profile as UserProfile | null,
      roles,
    };
  }

  async hasRole(role: AppRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.roles.includes(role) || false;
  }

  async hasAnyRole(roles: AppRole[]): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.roles.some((r) => roles.includes(r)) || false;
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer the fetch to avoid deadlock
        setTimeout(() => {
          this.getCurrentUser().then(callback);
        }, 0);
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  }
}

// Instance par défaut exportée
export const authProvider = new SupabaseAuthProvider();