import { supabase } from '@/integrations/supabase/client';

export interface OcrResult {
  success: boolean;
  invoiceId?: string;
  ocrFields?: Record<string, { value: string | number | null; confidence: number }>;
  confidenceScore?: number;
  error?: string;
}

export async function processInvoiceOcr(invoiceId: string, filePath: string): Promise<OcrResult> {
  try {
    const { data, error } = await supabase.functions.invoke('process-ocr', {
      body: { invoiceId, filePath },
    });

    if (error) {
      console.error('OCR function error:', error);
      return { success: false, error: error.message };
    }

    return data as OcrResult;
  } catch (err) {
    console.error('OCR processing error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    };
  }
}
