import { Invoice, OcrFields, OcrField } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OcrFieldsDisplayProps {
  invoice: Invoice;
  ocrFields: OcrFields | null;
}

interface FieldRowProps {
  label: string;
  value: string | number | null | undefined;
  ocrField?: OcrField;
  format?: 'text' | 'currency' | 'date';
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  // Normalize confidence to 0-100 if it's in 0-1 format
  const normalizedConfidence = confidence > 1 ? confidence : confidence * 100;
  
  if (normalizedConfidence >= 90) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </TooltipTrigger>
        <TooltipContent>Confiance élevée ({Math.round(normalizedConfidence)}%)</TooltipContent>
      </Tooltip>
    );
  }
  if (normalizedConfidence >= 80) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </TooltipTrigger>
        <TooltipContent>Confiance moyenne ({Math.round(normalizedConfidence)}%)</TooltipContent>
      </Tooltip>
    );
  }
  if (normalizedConfidence > 0) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <XCircle className="h-4 w-4 text-red-500" />
        </TooltipTrigger>
        <TooltipContent>Confiance faible ({Math.round(normalizedConfidence)}%)</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger>
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>Non détecté</TooltipContent>
    </Tooltip>
  );
}

function FieldRow({ label, value, ocrField, format: formatType = 'text' }: FieldRowProps) {
  let displayValue = value;
  
  if (formatType === 'currency' && typeof value === 'number') {
    displayValue = new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  } else if (formatType === 'date' && value) {
    try {
      displayValue = format(new Date(value as string), 'dd MMMM yyyy', { locale: fr });
    } catch {
      displayValue = value;
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {displayValue ?? <span className="text-muted-foreground italic">Non renseigné</span>}
        </span>
        {ocrField && <ConfidenceIndicator confidence={ocrField.confidence} />}
      </div>
    </div>
  );
}

export function OcrFieldsDisplay({ invoice, ocrFields }: OcrFieldsDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Identification */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Identification
        </h4>
        <div className="bg-muted/30 rounded-lg p-3">
          <FieldRow 
            label="N° Facture" 
            value={invoice.invoice_number} 
            ocrField={ocrFields?.invoice_number}
          />
          <FieldRow 
            label="Fournisseur" 
            value={invoice.supplier_name_extracted || invoice.supplier?.name} 
            ocrField={ocrFields?.supplier_name}
          />
          <FieldRow 
            label="Date émission" 
            value={invoice.issue_date} 
            ocrField={ocrFields?.issue_date}
            format="date"
          />
          <FieldRow 
            label="Date échéance" 
            value={invoice.due_date} 
            ocrField={ocrFields?.due_date}
            format="date"
          />
        </div>
      </div>

      {/* Montants */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Montants
        </h4>
        <div className="bg-muted/30 rounded-lg p-3">
          <FieldRow 
            label="Montant HT" 
            value={invoice.amount_ht} 
            ocrField={ocrFields?.amount_ht}
            format="currency"
          />
          <FieldRow 
            label="TVA" 
            value={invoice.amount_tva} 
            ocrField={ocrFields?.amount_tva}
            format="currency"
          />
          <FieldRow 
            label="Montant TTC" 
            value={invoice.amount_ttc} 
            ocrField={ocrFields?.amount_ttc}
            format="currency"
          />
          <FieldRow 
            label="Devise" 
            value={invoice.currency} 
            ocrField={ocrFields?.currency}
          />
        </div>
      </div>

      {/* Références */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Références
        </h4>
        <div className="bg-muted/30 rounded-lg p-3">
          <FieldRow 
            label="N° Bon de Commande" 
            value={invoice.po_number_extracted} 
            ocrField={ocrFields?.po_number}
          />
          <FieldRow 
            label="N° Bon de Livraison" 
            value={invoice.bl_number_extracted} 
            ocrField={ocrFields?.bl_number}
          />
          <FieldRow 
            label="IBAN" 
            value={invoice.iban_extracted} 
            ocrField={ocrFields?.iban}
          />
        </div>
      </div>
    </div>
  );
}
