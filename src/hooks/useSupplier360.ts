import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierInvoice {
  id: string;
  invoice_number: string | null;
  amount_ttc: number | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  created_at: string;
}

export interface SupplierDispute {
  id: string;
  status: string;
  category: string;
  priority: string;
  description: string;
  created_at: string;
  invoice?: {
    invoice_number: string | null;
    amount_ttc: number | null;
  };
}

export interface SupplierPurchaseOrder {
  id: string;
  po_number: string;
  amount_ttc: number;
  status: string | null;
  order_date: string;
}

export interface Supplier360Data {
  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    iban: string | null;
    is_critical: boolean | null;
    risk_score: number | null;
    payment_terms_days: number | null;
    avg_payment_delay_days: number | null;
    total_invoices_count: number | null;
    disputed_invoices_count: number | null;
    quality_rating: number | null;
    created_at: string;
  };
  invoices: SupplierInvoice[];
  disputes: SupplierDispute[];
  purchaseOrders: SupplierPurchaseOrder[];
  stats: {
    totalInvoicesAmount: number;
    averageInvoiceAmount: number;
    paidInvoicesCount: number;
    pendingInvoicesCount: number;
    disputeRate: number;
    averagePaymentDelay: number;
  };
}

export function useSupplier360(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-360', supplierId],
    queryFn: async (): Promise<Supplier360Data | null> => {
      if (!supplierId) return null;

      // Fetch supplier with new fields
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (supplierError) throw supplierError;

      // Fetch invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount_ttc, status, issue_date, due_date, created_at')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (invoicesError) throw invoicesError;

      // Fetch disputes related to supplier's invoices
      const invoiceIds = invoices?.map(i => i.id) || [];
      let disputes: SupplierDispute[] = [];
      
      if (invoiceIds.length > 0) {
        const { data: disputeData, error: disputesError } = await supabase
          .from('disputes')
          .select(`
            id, status, category, priority, description, created_at,
            invoice:invoices(invoice_number, amount_ttc)
          `)
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: false });

        if (disputesError) throw disputesError;
        disputes = disputeData as SupplierDispute[];
      }

      // Fetch purchase orders
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select('id, po_number, amount_ttc, status, order_date')
        .eq('supplier_id', supplierId)
        .order('order_date', { ascending: false })
        .limit(50);

      if (poError) throw poError;

      // Calculate stats
      const totalInvoicesAmount = invoices?.reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0) || 0;
      const paidInvoices = invoices?.filter(inv => inv.status === 'comptabilisee') || [];
      const pendingInvoices = invoices?.filter(inv => 
        !['comptabilisee', 'litige'].includes(inv.status || '')
      ) || [];

      const stats = {
        totalInvoicesAmount,
        averageInvoiceAmount: invoices?.length ? totalInvoicesAmount / invoices.length : 0,
        paidInvoicesCount: paidInvoices.length,
        pendingInvoicesCount: pendingInvoices.length,
        disputeRate: invoices?.length ? (disputes.length / invoices.length) * 100 : 0,
        averagePaymentDelay: supplier.avg_payment_delay_days || 0,
      };

      return {
        supplier,
        invoices: invoices || [],
        disputes,
        purchaseOrders: purchaseOrders || [],
        stats,
      };
    },
    enabled: !!supplierId,
  });
}

export function useUpdateSupplierRisk() {
  // This could be called periodically or on-demand to recalculate risk scores
  return async (supplierId: string) => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, status, due_date, amount_ttc')
      .eq('supplier_id', supplierId);

    const { data: disputes } = await supabase
      .from('disputes')
      .select('id, invoice_id')
      .in('invoice_id', invoices?.map(i => i.id) || []);

    const totalInvoices = invoices?.length || 0;
    const disputedCount = disputes?.length || 0;
    const lateCount = invoices?.filter(inv => {
      if (!inv.due_date) return false;
      return new Date(inv.due_date) < new Date() && inv.status !== 'comptabilisee';
    }).length || 0;

    // Calculate risk score (0-100, lower is better)
    let riskScore = 50; // Base score
    
    if (totalInvoices > 0) {
      const disputeRate = disputedCount / totalInvoices;
      const lateRate = lateCount / totalInvoices;
      
      riskScore = Math.min(100, Math.max(0, 
        50 + (disputeRate * 30) + (lateRate * 20)
      ));
    }

    await supabase
      .from('suppliers')
      .update({
        risk_score: Math.round(riskScore),
        total_invoices_count: totalInvoices,
        disputed_invoices_count: disputedCount,
        late_payments_count: lateCount,
      })
      .eq('id', supplierId);
  };
}
