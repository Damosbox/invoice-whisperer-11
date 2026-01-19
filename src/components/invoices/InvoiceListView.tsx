import { Invoice, InvoiceStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface InvoiceListViewProps {
  invoices: Invoice[];
  onInvoiceClick: (invoice: Invoice) => void;
}

const STATUS_LABELS: Record<InvoiceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  nouvelle: { label: 'Nouvelle', variant: 'secondary' },
  a_valider_extraction: { label: 'À valider (OCR)', variant: 'default' },
  a_rapprocher: { label: 'À rapprocher', variant: 'default' },
  a_approuver: { label: 'À approuver', variant: 'default' },
  exception: { label: 'Exception', variant: 'destructive' },
  litige: { label: 'Litige', variant: 'destructive' },
  prete_comptabilisation: { label: 'Prête compta', variant: 'outline' },
  comptabilisee: { label: 'Comptabilisée', variant: 'outline' },
};

function getConfidenceColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  // Score is stored as 0-100 (percentage) or 0-1 (decimal)
  const normalizedScore = score > 1 ? score : score * 100;
  if (normalizedScore >= 90) return 'text-green-500';
  if (normalizedScore >= 80) return 'text-yellow-500';
  return 'text-red-500';
}

function formatConfidenceScore(score: number | null): string {
  if (score === null) return '—';
  // Handle both 0-1 and 0-100 formats
  const normalizedScore = score > 1 ? score : score * 100;
  return `${Math.round(normalizedScore)}%`;
}

export function InvoiceListView({ invoices, onInvoiceClick }: InvoiceListViewProps) {
  const formatAmount = (amount: number | null, currency = 'EUR') => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>N° Facture</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead>Date émission</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead className="text-right">Montant TTC</TableHead>
            <TableHead className="text-center">OCR</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Approbation</TableHead>
            <TableHead className="text-center">Match</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Aucune facture
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => {
              const statusInfo = STATUS_LABELS[invoice.status];
              return (
                <TableRow 
                  key={invoice.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onInvoiceClick(invoice)}
                >
                  <TableCell>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.invoice_number || 'N° en attente'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {invoice.supplier?.name || invoice.supplier_name_extracted || 'Inconnu'}
                      {invoice.supplier?.is_critical && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-500/50 text-orange-500">
                          Critique
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell>
                    {invoice.due_date ? (
                      <span className={cn(
                        new Date(invoice.due_date) < new Date() && 
                        !['comptabilisee', 'prete_comptabilisation'].includes(invoice.status) 
                          ? 'text-destructive font-medium' 
                          : ''
                      )}>
                        {formatDate(invoice.due_date)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(invoice.amount_ttc, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn("font-medium", getConfidenceColor(invoice.ocr_confidence_score))}>
                      {formatConfidenceScore(invoice.ocr_confidence_score)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {invoice.approved_at ? (
                      <span className="text-xs text-green-600">
                        {formatDate(invoice.approved_at)}
                      </span>
                    ) : invoice.status === 'a_approuver' ? (
                      <span className="text-xs text-muted-foreground">En attente</span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {invoice.match_status === 'match_automatique' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                    )}
                    {invoice.match_status === 'match_probable' && (
                      <Clock className="h-4 w-4 text-yellow-500 mx-auto" />
                    )}
                    {(invoice.match_status === 'match_incertain' || invoice.match_status === 'aucun_match') && (
                      <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                    {invoice.has_anomalies && (
                      <AlertTriangle className="h-4 w-4 text-destructive mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
