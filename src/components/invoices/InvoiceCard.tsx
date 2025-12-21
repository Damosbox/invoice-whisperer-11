import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, AlertTriangle, CheckCircle2, Clock, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/types';

interface InvoiceCardProps {
  invoice: Invoice;
  onClick?: () => void;
  isDragging?: boolean;
}

const getConfidenceLevel = (score: number | null): 'high' | 'medium' | 'low' => {
  if (score === null) return 'low';
  // Score is stored as 0-100 (percentage) or 0-1 (decimal)
  const normalizedScore = score > 1 ? score : score * 100;
  if (normalizedScore >= 90) return 'high';
  if (normalizedScore >= 80) return 'medium';
  return 'low';
};

const formatConfidenceDisplay = (score: number | null): string => {
  if (score === null) return '—';
  const normalizedScore = score > 1 ? score : score * 100;
  return `${Math.round(normalizedScore)}%`;
};

const getMatchStatusIcon = (status: string | null) => {
  switch (status) {
    case 'match_automatique':
      return <CheckCircle2 className="h-3.5 w-3.5 text-status-validated" />;
    case 'match_probable':
      return <Clock className="h-3.5 w-3.5 text-status-pending" />;
    case 'match_incertain':
    case 'aucun_match':
      return <AlertTriangle className="h-3.5 w-3.5 text-status-exception" />;
    default:
      return null;
  }
};

export function InvoiceCard({ invoice, onClick, isDragging }: InvoiceCardProps) {
  const confidenceLevel = getConfidenceLevel(invoice.ocr_confidence_score);
  
  const formattedAmount = invoice.amount_ttc 
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: invoice.currency || 'EUR' }).format(invoice.amount_ttc)
    : '—';

  const formattedDate = invoice.issue_date 
    ? format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })
    : '—';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('invoiceId', invoice.id);
    e.dataTransfer.setData('currentStatus', invoice.status);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card 
      className={cn(
        "kanban-card cursor-grab border-border/50 bg-card hover:border-primary/30 transition-all",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-lg"
      )}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Supplier & Amount */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">
              {invoice.supplier?.name || invoice.supplier_name_extracted || 'Fournisseur inconnu'}
            </span>
          </div>
          <span className="font-semibold text-sm text-primary whitespace-nowrap">
            {formattedAmount}
          </span>
        </div>

        {/* Invoice number & Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">
            {invoice.invoice_number || 'N° en attente'}
          </span>
          <span>{formattedDate}</span>
        </div>

        {/* Footer: Confidence & Match Status */}
        <div className="flex items-center justify-between pt-1">
          {invoice.ocr_confidence_score !== null && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0",
                confidenceLevel === 'high' && "border-green-500/50 text-green-500 bg-green-500/10",
                confidenceLevel === 'medium' && "border-yellow-500/50 text-yellow-500 bg-yellow-500/10",
                confidenceLevel === 'low' && "border-red-500/50 text-red-500 bg-red-500/10"
              )}
            >
              {formatConfidenceDisplay(invoice.ocr_confidence_score)}
            </Badge>
          )}
          
          <div className="flex items-center gap-1">
            {invoice.has_anomalies && (
              <AlertTriangle className="h-3.5 w-3.5 text-status-exception" />
            )}
            {getMatchStatusIcon(invoice.match_status)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
