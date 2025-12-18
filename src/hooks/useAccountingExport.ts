import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Invoice = Tables<'invoices'>;

export interface ExportableInvoice extends Invoice {
  suppliers: { name: string; identifier: string | null } | null;
}

export interface ExportField {
  key: string;
  label: string;
  enabled: boolean;
  getValue: (invoice: ExportableInvoice) => string;
}

export const defaultExportFields: ExportField[] = [
  { key: 'invoice_number', label: 'N° Facture', enabled: true, getValue: (inv) => inv.invoice_number || '' },
  { key: 'supplier_name', label: 'Fournisseur', enabled: true, getValue: (inv) => inv.suppliers?.name || inv.supplier_name_extracted || '' },
  { key: 'supplier_id', label: 'ID Fournisseur', enabled: true, getValue: (inv) => inv.suppliers?.identifier || '' },
  { key: 'issue_date', label: 'Date Facture', enabled: true, getValue: (inv) => inv.issue_date || '' },
  { key: 'due_date', label: 'Date Échéance', enabled: true, getValue: (inv) => inv.due_date || '' },
  { key: 'amount_ht', label: 'Montant HT', enabled: true, getValue: (inv) => inv.amount_ht?.toString() || '0' },
  { key: 'amount_tva', label: 'Montant TVA', enabled: true, getValue: (inv) => inv.amount_tva?.toString() || '0' },
  { key: 'amount_ttc', label: 'Montant TTC', enabled: true, getValue: (inv) => inv.amount_ttc?.toString() || '0' },
  { key: 'currency', label: 'Devise', enabled: true, getValue: (inv) => inv.currency || 'EUR' },
  { key: 'po_number', label: 'N° BC', enabled: true, getValue: (inv) => inv.po_number_extracted || '' },
  { key: 'bl_number', label: 'N° BL', enabled: false, getValue: (inv) => inv.bl_number_extracted || '' },
  { key: 'iban', label: 'IBAN', enabled: false, getValue: (inv) => inv.iban_extracted || '' },
  { key: 'accounting_ref', label: 'Réf. Comptable', enabled: false, getValue: (inv) => inv.accounting_entry_ref || '' },
];

export function useInvoicesForExport() {
  return useQuery({
    queryKey: ['invoices-export'],
    queryFn: async (): Promise<ExportableInvoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, suppliers(name, identifier)')
        .eq('status', 'prete_comptabilisation')
        .order('issue_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export interface ExportOptions {
  separator: ';' | ',' | '\t';
  dateFormat: 'iso' | 'fr' | 'us';
  includeHeader: boolean;
  encoding: 'utf-8' | 'utf-8-bom';
}

export const formatDate = (dateStr: string | null, format: ExportOptions['dateFormat']): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  switch (format) {
    case 'fr':
      return date.toLocaleDateString('fr-FR');
    case 'us':
      return date.toLocaleDateString('en-US');
    case 'iso':
    default:
      return dateStr;
  }
};

export const generateCSV = (
  invoices: ExportableInvoice[],
  fields: ExportField[],
  options: ExportOptions
): string => {
  const enabledFields = fields.filter((f) => f.enabled);
  const lines: string[] = [];

  // Add BOM for Excel compatibility if requested
  const bom = options.encoding === 'utf-8-bom' ? '\uFEFF' : '';

  // Header
  if (options.includeHeader) {
    lines.push(enabledFields.map((f) => `"${f.label}"`).join(options.separator));
  }

  // Data rows
  invoices.forEach((invoice) => {
    const row = enabledFields.map((field) => {
      let value = field.getValue(invoice);
      
      // Format dates
      if (field.key.includes('date')) {
        value = formatDate(value, options.dateFormat);
      }
      
      // Escape quotes and wrap in quotes
      value = value.replace(/"/g, '""');
      return `"${value}"`;
    });
    lines.push(row.join(options.separator));
  });

  return bom + lines.join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
