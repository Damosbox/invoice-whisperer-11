// ============================================
// Auth Service - Point d'entrée
// Changez l'import pour migrer vers Keycloak
// ============================================

export * from "./types";
export { authProvider } from "./supabase-auth";

// Pour migrer vers Keycloak, décommentez:
// export { authProvider } from "./keycloak-auth";