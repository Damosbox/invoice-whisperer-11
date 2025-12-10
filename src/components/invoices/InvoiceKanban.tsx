import { useMemo } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { KanbanColumn } from './KanbanColumn';
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

export function InvoiceKanban({ invoices, onInvoiceClick }: InvoiceKanbanProps) {
  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(({ status, title }) => {
      const columnInvoices = invoices.filter((inv) => inv.status === status);
      return { status, title, invoices: columnInvoices };
    });
  }, [invoices]);

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
            className="h-full"
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
