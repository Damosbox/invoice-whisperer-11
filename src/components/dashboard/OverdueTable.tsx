import { useNavigate } from 'react-router-dom';
import { Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OverdueInvoice } from '@/hooks/useDashboardStats';

interface OverdueTableProps {
  invoices: OverdueInvoice[];
}

const formatAmount = (value: number | null) => {
  if (value === null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

export function OverdueTable({ invoices }: OverdueTableProps) {
  const navigate = useNavigate();

  if (invoices.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Factures en retard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune facture en retard</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-status-exception" />
          Factures en retard
          <Badge variant="destructive" className="ml-auto">
            {invoices.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {invoice.invoice_number || 'N° inconnu'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {invoice.supplier_name || 'Fournisseur inconnu'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-sm">{formatAmount(invoice.amount_ttc)}</p>
                <p className={cn(
                  'text-xs font-medium',
                  invoice.days_overdue > 30 ? 'text-status-exception' : 'text-status-pending'
                )}>
                  {invoice.days_overdue}j de retard
                </p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
