// ============================================
// Supabase Storage Provider
// Implémentation par défaut - remplaçable par MinIO
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { 
  StorageProvider, 
  StorageFile, 
  UploadOptions, 
  DownloadOptions, 
  ListOptions, 
  DeleteOptions 
} from "./types";

export class SupabaseStorageProvider implements StorageProvider {
  name = "supabase";

  async upload(options: UploadOptions): Promise<{ path: string; error: Error | null }> {
    const { bucket, path, file, contentType, upsert = false } = options;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: contentType || file.type,
        upsert,
      });

    if (error) {
      return { path: "", error: new Error(error.message) };
    }

    return { path: data.path, error: null };
  }

  async getSignedUrl(
    options: DownloadOptions, 
    expiresIn = 3600
  ): Promise<{ url: string; error: Error | null }> {
    const { bucket, path } = options;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { url: "", error: new Error(error.message) };
    }

    return { url: data.signedUrl, error: null };
  }

  async list(options: ListOptions): Promise<{ files: StorageFile[]; error: Error | null }> {
    const { bucket, path = "", limit = 100, offset = 0 } = options;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit, offset });

    if (error) {
      return { files: [], error: new Error(error.message) };
    }

    const files: StorageFile[] = data.map((item) => ({
      path: path ? `${path}/${item.name}` : item.name,
      name: item.name,
      size: item.metadata?.size || 0,
      mimeType: item.metadata?.mimetype || "application/octet-stream",
      createdAt: item.created_at,
    }));

    return { files, error: null };
  }

  async delete(options: DeleteOptions): Promise<{ error: Error | null }> {
    const { bucket, paths } = options;
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  }

  async exists(options: DownloadOptions): Promise<boolean> {
    const { bucket, path } = options;
    
    // Try to get file metadata
    const { data } = await supabase.storage
      .from(bucket)
      .list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop(),
      });

    return data !== null && data.length > 0;
  }

  async getFileHash(file: File): Promise<string> {
    // Calcul du hash SHA-256 du fichier
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}

// Instance par défaut exportée
export const storageProvider = new SupabaseStorageProvider();