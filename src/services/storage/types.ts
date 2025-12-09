// ============================================
// Storage Service - Interface d'abstraction
// Permet de migrer facilement vers MinIO ou autre
// ============================================

export interface StorageFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url?: string;
}

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  contentType?: string;
  upsert?: boolean;
}

export interface DownloadOptions {
  bucket: string;
  path: string;
}

export interface ListOptions {
  bucket: string;
  path?: string;
  limit?: number;
  offset?: number;
}

export interface DeleteOptions {
  bucket: string;
  paths: string[];
}

export interface StorageProvider {
  name: string;
  
  /**
   * Upload un fichier
   */
  upload(options: UploadOptions): Promise<{ path: string; error: Error | null }>;
  
  /**
   * Télécharge un fichier (retourne l'URL signée ou blob)
   */
  getSignedUrl(options: DownloadOptions, expiresIn?: number): Promise<{ url: string; error: Error | null }>;
  
  /**
   * Liste les fichiers d'un répertoire
   */
  list(options: ListOptions): Promise<{ files: StorageFile[]; error: Error | null }>;
  
  /**
   * Supprime des fichiers
   */
  delete(options: DeleteOptions): Promise<{ error: Error | null }>;
  
  /**
   * Vérifie si un fichier existe
   */
  exists(options: DownloadOptions): Promise<boolean>;
  
  /**
   * Calcule le hash d'un fichier pour détection doublons
   */
  getFileHash(file: File): Promise<string>;
}