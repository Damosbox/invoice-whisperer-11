import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Invoice, InvoiceStatus, MatchStatus } from '@/types';

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(id, name, identifier, is_critical),
          purchase_order:purchase_orders(id, po_number, amount_ttc),
          delivery_note:delivery_notes(id, bl_number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((invoice) => ({
        id: invoice.id,
        file_path: invoice.file_path,
        file_hash: invoice.file_hash,
        original_filename: invoice.original_filename,
        file_size: invoice.file_size,
        invoice_number: invoice.invoice_number,
        supplier_id: invoice.supplier_id,
        supplier_name_extracted: invoice.supplier_name_extracted,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        received_date: invoice.received_date || invoice.created_at,
        amount_ht: invoice.amount_ht,
        amount_tva: invoice.amount_tva,
        amount_ttc: invoice.amount_ttc,
        currency: invoice.currency || 'EUR',
        po_number_extracted: invoice.po_number_extracted,
        bl_number_extracted: invoice.bl_number_extracted,
        iban_extracted: invoice.iban_extracted,
        ocr_raw_text: invoice.ocr_raw_text,
        ocr_fields: (invoice.ocr_fields as unknown) as Invoice['ocr_fields'],
        ocr_confidence_score: invoice.ocr_confidence_score ? Number(invoice.ocr_confidence_score) : null,
        purchase_order_id: invoice.purchase_order_id,
        delivery_note_id: invoice.delivery_note_id,
        match_status: (invoice.match_status || 'aucun_match') as MatchStatus,
        match_score: invoice.match_score ? Number(invoice.match_score) : null,
        match_details: (invoice.match_details as unknown) as Invoice['match_details'],
        status: (invoice.status || 'nouvelle') as InvoiceStatus,
        current_approver_id: invoice.current_approver_id,
        approved_by: invoice.approved_by,
        approved_at: invoice.approved_at,
        rejection_reason: invoice.rejection_reason,
        has_anomalies: invoice.has_anomalies || false,
        anomaly_types: invoice.anomaly_types,
        anomaly_details: (invoice.anomaly_details as unknown) as Invoice['anomaly_details'],
        accounting_entry_ref: invoice.accounting_entry_ref,
        exported_at: invoice.exported_at,
        source: invoice.source || 'upload',
        created_by: invoice.created_by,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        // Partial relations for display
        supplier: invoice.supplier ? {
          id: invoice.supplier.id,
          name: invoice.supplier.name,
          identifier: invoice.supplier.identifier,
          is_critical: invoice.supplier.is_critical,
        } as Invoice['supplier'] : undefined,
        purchase_order: invoice.purchase_order ? {
          id: invoice.purchase_order.id,
          po_number: invoice.purchase_order.po_number,
          amount_ttc: invoice.purchase_order.amount_ttc,
        } as Invoice['purchase_order'] : undefined,
        delivery_note: invoice.delivery_note ? {
          id: invoice.delivery_note.id,
          bl_number: invoice.delivery_note.bl_number,
        } as Invoice['delivery_note'] : undefined,
      }));
    },
  });
}
