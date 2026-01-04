import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OcrSupplierStats {
  supplier_id: string;
  supplier_name: string;
  total_invoices: number;
  avg_confidence: number | null;
  low_confidence_count: number;
  pending_validation_count: number;
  template_corrections_count: number;
  last_invoice_date: string | null;
  error_rate: number;
}

export interface OcrGlobalStats {
  totalInvoices: number;
  avgConfidence: number;
  lowConfidenceCount: number;
  pendingValidationCount: number;
  validatedCount: number;
  errorRate: number;
  confidenceByMonth: { month: string; avgConfidence: number; count: number }[];
}

export function useOcrQualityBySupplier() {
  return useQuery({
    queryKey: ['ocr-quality-by-supplier'],
    queryFn: async (): Promise<OcrSupplierStats[]> => {
      // Fetch invoice data grouped by supplier
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          supplier_id,
          ocr_confidence_score,
          status,
          created_at,
          suppliers(id, name)
        `)
        .not('supplier_id', 'is', null);

      if (error) throw error;

      // Fetch template corrections
      const { data: templates } = await supabase
        .from('supplier_templates')
        .select('supplier_id, corrections_count');

      const templateCounts = templates?.reduce((acc, t) => {
        acc[t.supplier_id] = (acc[t.supplier_id] || 0) + (t.corrections_count || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      // Group by supplier
      const supplierMap = new Map<string, OcrSupplierStats>();

      invoices?.forEach(inv => {
        const supplierId = inv.supplier_id!;
        const supplierName = (inv.suppliers as any)?.name || 'Inconnu';

        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            supplier_name: supplierName,
            total_invoices: 0,
            avg_confidence: null,
            low_confidence_count: 0,
            pending_validation_count: 0,
            template_corrections_count: templateCounts[supplierId] || 0,
            last_invoice_date: null,
            error_rate: 0,
          });
        }

        const stats = supplierMap.get(supplierId)!;
        stats.total_invoices++;

        if (inv.ocr_confidence_score !== null) {
          const currentTotal = (stats.avg_confidence || 0) * (stats.total_invoices - 1);
          stats.avg_confidence = (currentTotal + inv.ocr_confidence_score) / stats.total_invoices;

          if (inv.ocr_confidence_score < 0.7) {
            stats.low_confidence_count++;
          }
        }

        if (inv.status === 'a_valider_extraction') {
          stats.pending_validation_count++;
        }

        if (!stats.last_invoice_date || inv.created_at > stats.last_invoice_date) {
          stats.last_invoice_date = inv.created_at;
        }
      });

      // Calculate error rates
      supplierMap.forEach(stats => {
        stats.error_rate = stats.total_invoices > 0 
          ? (stats.low_confidence_count / stats.total_invoices) * 100 
          : 0;
      });

      return Array.from(supplierMap.values())
        .sort((a, b) => b.total_invoices - a.total_invoices);
    },
  });
}

export function useOcrGlobalStats() {
  return useQuery({
    queryKey: ['ocr-global-stats'],
    queryFn: async (): Promise<OcrGlobalStats> => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, ocr_confidence_score, status, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const totalInvoices = invoices?.length || 0;
      const invoicesWithScore = invoices?.filter(i => i.ocr_confidence_score !== null) || [];
      const avgConfidence = invoicesWithScore.length > 0
        ? invoicesWithScore.reduce((sum, i) => sum + (i.ocr_confidence_score || 0), 0) / invoicesWithScore.length
        : 0;

      const lowConfidenceCount = invoices?.filter(i => 
        i.ocr_confidence_score !== null && i.ocr_confidence_score < 0.7
      ).length || 0;

      const pendingValidationCount = invoices?.filter(i => 
        i.status === 'a_valider_extraction'
      ).length || 0;

      const validatedCount = invoices?.filter(i => 
        !['nouvelle', 'a_valider_extraction'].includes(i.status || '')
      ).length || 0;

      // Group by month for trend
      const monthlyData = new Map<string, { sum: number; count: number }>();
      
      invoices?.forEach(inv => {
        if (inv.ocr_confidence_score === null) return;
        
        const date = new Date(inv.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { sum: 0, count: 0 });
        }
        
        const data = monthlyData.get(monthKey)!;
        data.sum += inv.ocr_confidence_score;
        data.count++;
      });

      const confidenceByMonth = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          avgConfidence: data.sum / data.count,
          count: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months

      return {
        totalInvoices,
        avgConfidence,
        lowConfidenceCount,
        pendingValidationCount,
        validatedCount,
        errorRate: totalInvoices > 0 ? (lowConfidenceCount / totalInvoices) * 100 : 0,
        confidenceByMonth,
      };
    },
  });
}
