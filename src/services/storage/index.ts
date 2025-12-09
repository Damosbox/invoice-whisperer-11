// ============================================
// Storage Service - Point d'entrée
// Changez l'import pour migrer vers MinIO
// ============================================

export * from "./types";
export { storageProvider } from "./supabase-storage";

// Pour migrer vers MinIO, décommentez:
// export { storageProvider } from "./minio-storage";