import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InvoiceCard } from './InvoiceCard';
import type { Invoice, InvoiceStatus } from '@/types';

interface KanbanColumnProps {
  status: InvoiceStatus;
  title: string;
  invoices: Invoice[];
  onInvoiceClick?: (invoice: Invoice) => void;
  className?: string;
}

const statusColors: Record<InvoiceStatus, string> = {
  nouvelle: 'bg-status-new',
  a_valider_extraction: 'bg-status-pending',
  a_rapprocher: 'bg-status-matching',
  a_approuver: 'bg-status-approval',
  exception: 'bg-status-exception',
  litige: 'bg-status-dispute',
  prete_comptabilisation: 'bg-status-validated',
  comptabilisee: 'bg-status-accounted',
};

export function KanbanColumn({ 
  status, 
  title, 
  invoices, 
  onInvoiceClick,
  className 
}: KanbanColumnProps) {
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0);
  const formattedTotal = new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    notation: 'compact'
  }).format(totalAmount);

  return (
    <div className={cn("flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg", className)}>
      {/* Column Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {invoices.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formattedTotal}</p>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {invoices.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Aucune facture
            </p>
          ) : (
            invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onClick={() => onInvoiceClick?.(invoice)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
