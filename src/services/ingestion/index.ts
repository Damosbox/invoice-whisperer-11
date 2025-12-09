// ============================================
// Ingestion Service - Point d'entrée
// Ajoutez d'autres providers (email, sftp) ici
// ============================================

export * from "./types";
export { uploadProvider } from "./upload-provider";

// Pour ajouter l'ingestion email:
// export { emailProvider } from "./email-provider";

// Pour ajouter l'ingestion SFTP:
// export { sftpProvider } from "./sftp-provider";