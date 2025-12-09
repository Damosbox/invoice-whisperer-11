// ============================================
// Auth Service - Interface d'abstraction
// Permet de migrer facilement vers Keycloak ou autre
// ============================================

import type { AppRole, UserProfile } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
  roles: AppRole[];
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  fullName?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface AuthProvider {
  name: string;
  
  /**
   * Connexion avec email/password
   */
  signIn(credentials: SignInCredentials): Promise<{ user: AuthUser | null; error: Error | null }>;
  
  /**
   * Inscription
   */
  signUp(credentials: SignUpCredentials): Promise<{ user: AuthUser | null; error: Error | null }>;
  
  /**
   * Déconnexion
   */
  signOut(): Promise<{ error: Error | null }>;
  
  /**
   * Récupère la session courante
   */
  getSession(): Promise<AuthSession | null>;
  
  /**
   * Récupère l'utilisateur courant avec son profil et ses rôles
   */
  getCurrentUser(): Promise<AuthUser | null>;
  
  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: AppRole): Promise<boolean>;
  
  /**
   * Vérifie si l'utilisateur a au moins un des rôles
   */
  hasAnyRole(roles: AppRole[]): Promise<boolean>;
  
  /**
   * Écoute les changements d'état d'authentification
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}