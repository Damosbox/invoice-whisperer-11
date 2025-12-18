import React, { useMemo } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateInvoiceStatus } from '@/hooks/useInvoices';
import { toast } from 'sonner';
import type { Invoice, InvoiceStatus } from '@/types';

interface InvoiceKanbanProps {
  invoices: Invoice[];
  onInvoiceClick?: (invoice: Invoice) => void;
}

const KANBAN_COLUMNS: { status: InvoiceStatus; title: string }[] = [
  { status: 'nouvelle', title: 'Nouvelles' },
  { status: 'a_valider_extraction', title: 'À valider (OCR)' },
  { status: 'a_rapprocher', title: 'À rapprocher' },
  { status: 'a_approuver', title: 'À approuver' },
  { status: 'exception', title: 'Exceptions' },
  { status: 'litige', title: 'Litiges' },
  { status: 'prete_comptabilisation', title: 'Prêtes compta' },
  { status: 'comptabilisee', title: 'Comptabilisées' },
];

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  nouvelle: 'Nouvelles',
  a_valider_extraction: 'À valider (OCR)',
  a_rapprocher: 'À rapprocher',
  a_approuver: 'À approuver',
  exception: 'Exceptions',
  litige: 'Litiges',
  prete_comptabilisation: 'Prêtes compta',
  comptabilisee: 'Comptabilisées',
};

export function InvoiceKanban({ invoices, onInvoiceClick }: InvoiceKanbanProps) {
  const updateStatus = useUpdateInvoiceStatus();

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(({ status, title }) => {
      const columnInvoices = invoices.filter((inv) => inv.status === status);
      return { status, title, invoices: columnInvoices };
    });
  }, [invoices]);

  const handleDrop = (invoiceId: string, newStatus: InvoiceStatus) => {
    updateStatus.mutate(
      { id: invoiceId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Facture déplacée vers "${STATUS_LABELS[newStatus]}"`);
        },
      }
    );
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 p-4 min-h-[calc(100vh-200px)]">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            invoices={column.invoices}
            onInvoiceClick={onInvoiceClick}
            onDrop={handleDrop}
            className="h-full"
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
