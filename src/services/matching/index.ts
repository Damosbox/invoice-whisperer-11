import { supabase } from '@/integrations/supabase/client';

export interface MatchingResult {
  success: boolean;
  invoiceId?: string;
  purchaseOrderId?: string | null;
  deliveryNoteId?: string | null;
  supplierId?: string | null;
  matchScore?: number;
  matchStatus?: 'match_automatique' | 'match_probable' | 'match_incertain' | 'aucun_match';
  matchDetails?: {
    po_match: { found: boolean; score: number; method: string };
    bl_match: { found: boolean; score: number; method: string };
    supplier_match: { found: boolean; score: number; method: string };
    amount_match: { found: boolean; score: number; difference_percent?: number };
    anomalies: string[];
  };
  error?: string;
}

export async function matchInvoice(invoiceId: string): Promise<MatchingResult> {
  try {
    const { data, error } = await supabase.functions.invoke('match-invoice', {
      body: { invoiceId },
    });

    if (error) {
      console.error('Matching function error:', error);
      return { success: false, error: error.message };
    }

    return data as MatchingResult;
  } catch (err) {
    console.error('Matching error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erreur inconnue' 
    };
  }
}
