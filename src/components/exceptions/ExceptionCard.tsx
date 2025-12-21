import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  FileText, 
  Building2, 
  Calendar, 
  Euro,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExceptionInvoice } from '@/hooks/useExceptions';
import { useNavigate } from 'react-router-dom';
import { AnomalyExplanationDialog } from './AnomalyExplanationDialog';

interface ExceptionCardProps {
  invoice: ExceptionInvoice;
  onValidate: () => void;
  onReject: () => void;
  onReprocess: () => void;
  isLoading?: boolean;
}

const anomalyLabels: Record<string, string> = {
  supplier_mismatch: 'Fournisseur non reconnu',
  amount_discrepancy: 'Écart de montant',
  unknown_iban: 'IBAN inconnu',
  potential_duplicate: 'Doublon potentiel',
  missing_po: 'BC manquant',
  date_anomaly: 'Anomalie de date',
  low_confidence: 'Confiance OCR faible',
};

export function ExceptionCard({
  invoice,
  onValidate,
  onReject,
  onReprocess,
  isLoading,
}: ExceptionCardProps) {
  const navigate = useNavigate();
  const anomalies = invoice.anomaly_types || [];
  const anomalyDetails = invoice.anomaly_details as Record<string, any> | null;

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: invoice.currency || 'EUR',
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Invoice Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {invoice.invoice_number || 'Sans numéro'}
                  </span>
                  <Badge variant={invoice.status === 'litige' ? 'destructive' : 'secondary'}>
                    {invoice.status === 'litige' ? 'Litige' : 'Exception'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {invoice.original_filename || 'Fichier inconnu'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{invoice.suppliers?.name || invoice.supplier_name_extracted || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {invoice.issue_date
                    ? format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })
                    : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Euro className="h-4 w-4" />
                <span>{formatCurrency(invoice.amount_ttc)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{invoice.po_number_extracted || 'Pas de BC'}</span>
              </div>
            </div>

            {/* Anomalies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Anomalies détectées
                </p>
                <AnomalyExplanationDialog invoice={invoice} />
              </div>
              <div className="flex flex-wrap gap-2">
                {anomalies.length > 0 ? (
                  anomalies.map((anomaly) => (
                    <TooltipProvider key={anomaly}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-destructive border-destructive/30">
                            {anomalyLabels[anomaly] || anomaly}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {anomalyDetails?.[anomaly]?.message || 'Anomalie détectée'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))
                ) : (
                  <Badge variant="outline">Statut exception</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voir le détail</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={onValidate}
                    disabled={isLoading}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Valider et envoyer en approbation</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={onReprocess}
                    disabled={isLoading}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Retraiter la facture</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onReject}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mettre en litige</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
