// ============================================
// Upload Provider - Ingestion manuelle
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { storageProvider } from "@/services/storage";
import { processInvoiceOcr } from "@/services/ocr";
import type { IngestionProvider, IngestionResult, IngestionOptions } from "./types";
import type { Json } from "@/integrations/supabase/types";
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export class UploadIngestionProvider implements IngestionProvider {
  source = "upload" as const;

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Type de fichier non supporté. Types acceptés: PDF, JPG, PNG, TIFF` 
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Fichier trop volumineux. Taille max: 20MB` 
      };
    }

    return { valid: true };
  }

  async checkDuplicate(hash: string): Promise<{ isDuplicate: boolean; existingInvoiceId?: string }> {
    const { data } = await supabase
      .from("invoices")
      .select("id")
      .eq("file_hash", hash)
      .maybeSingle();

    if (data) {
      return { isDuplicate: true, existingInvoiceId: data.id };
    }

    return { isDuplicate: false };
  }

  async ingest(file: File, options: IngestionOptions): Promise<IngestionResult> {
    // 1. Valider le fichier
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Calculer le hash pour détection doublons
    const hash = await storageProvider.getFileHash(file);

    // 3. Vérifier les doublons
    const duplicate = await this.checkDuplicate(hash);
    if (duplicate.isDuplicate) {
      // Créer un log d'import pour le doublon
      await supabase.from("import_logs").insert([{
        source: this.source,
        source_details: (options.sourceDetails || null) as Json,
        file_name: file.name,
        file_hash: hash,
        status: "duplicate",
        error_message: `Doublon détecté. Facture existante: ${duplicate.existingInvoiceId}`,
        invoice_id: duplicate.existingInvoiceId,
        processed_by: options.userId,
        processed_at: new Date().toISOString(),
      }]);

      return { 
        success: false, 
        isDuplicate: true, 
        error: "Ce fichier a déjà été importé",
        invoiceId: duplicate.existingInvoiceId,
      };
    }

    // 4. Créer un log d'import en statut pending
    const { data: importLog, error: logError } = await supabase
      .from("import_logs")
      .insert([{
        source: this.source,
        source_details: (options.sourceDetails || null) as Json,
        file_name: file.name,
        file_hash: hash,
        status: "processing",
        processed_by: options.userId,
      }])
      .select()
      .single();

    if (logError || !importLog) {
      return { success: false, error: "Erreur lors de la création du log d'import" };
    }

    try {
      // 5. Upload du fichier
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${timestamp}_${safeName}`;

      const { path, error: uploadError } = await storageProvider.upload({
        bucket: "invoices",
        path: filePath,
        file,
      });

      if (uploadError) {
        await this.updateImportLog(importLog.id, "failed", uploadError.message);
        return { success: false, error: uploadError.message, importLogId: importLog.id };
      }

      // 6. Créer l'entrée facture
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          file_path: path,
          file_hash: hash,
          original_filename: file.name,
          file_size: file.size,
          source: this.source,
          status: "nouvelle",
          created_by: options.userId,
        })
        .select()
        .single();

      if (invoiceError || !invoice) {
        await this.updateImportLog(importLog.id, "failed", invoiceError?.message || "Erreur création facture");
        return { success: false, error: "Erreur lors de la création de la facture", importLogId: importLog.id };
      }

      // 7. Mettre à jour le log d'import
      await this.updateImportLog(importLog.id, "success", null, invoice.id);

      // 8. Créer un log d'audit
      await supabase.from("audit_logs").insert({
        entity_type: "invoice",
        entity_id: invoice.id,
        action: "created",
        changes: { source: this.source, filename: file.name },
        performed_by: options.userId,
      });

      // 9. Lancer l'OCR automatiquement (async, ne bloque pas)
      processInvoiceOcr(invoice.id, path).then(ocrResult => {
        if (!ocrResult.success) {
          console.error('OCR processing failed:', ocrResult.error);
        } else {
          console.log('OCR completed, confidence:', ocrResult.confidenceScore);
        }
      }).catch(err => {
        console.error('OCR processing error:', err);
      });

      return { 
        success: true, 
        invoiceId: invoice.id, 
        importLogId: importLog.id 
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      await this.updateImportLog(importLog.id, "failed", message);
      return { success: false, error: message, importLogId: importLog.id };
    }
  }

  private async updateImportLog(
    id: string, 
    status: string, 
    errorMessage: string | null, 
    invoiceId?: string
  ) {
    await supabase
      .from("import_logs")
      .update({
        status,
        error_message: errorMessage,
        invoice_id: invoiceId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);
  }
}

export const uploadProvider = new UploadIngestionProvider();