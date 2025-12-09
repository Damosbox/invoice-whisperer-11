// ============================================
// Ingestion Service - Interface d'abstraction
// Permet d'ajouter SFTP, Email, etc.
// ============================================

export type IngestionSource = "upload" | "email" | "sftp";

export interface IngestionResult {
  success: boolean;
  invoiceId?: string;
  importLogId?: string;
  error?: string;
  isDuplicate?: boolean;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  hash: string;
}

export interface IngestionOptions {
  source: IngestionSource;
  sourceDetails?: Record<string, unknown>;
  userId?: string;
}

export interface IngestionProvider {
  source: IngestionSource;
  
  /**
   * Ingère un fichier
   */
  ingest(file: File, options: IngestionOptions): Promise<IngestionResult>;
  
  /**
   * Vérifie si un fichier est un doublon
   */
  checkDuplicate(hash: string): Promise<{ isDuplicate: boolean; existingInvoiceId?: string }>;
  
  /**
   * Valide le type de fichier
   */
  validateFile(file: File): { valid: boolean; error?: string };
}