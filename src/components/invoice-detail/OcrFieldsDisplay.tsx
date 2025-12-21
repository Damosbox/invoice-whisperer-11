import { Invoice, OcrFields, OcrField } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OcrFieldsDisplayProps {
  invoice: Invoice;
  ocrFields: OcrFields | null;
  onFieldHover?: (field: OcrField | null) => void;
}

interface FieldRowProps {
  label: string;
  value: string | number | null | undefined;
  ocrField?: OcrField;
  format?: 'text' | 'currency' | 'date';
  onHover?: (field: OcrField | null) => void;
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
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

function FieldRow({ label, value, ocrField, format: formatType = 'text', onHover }: FieldRowProps) {
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

  const hasBoundingBox = ocrField?.bounding_box;

  return (
    <div 
      className={cn(
        "flex items-center justify-between py-2 border-b border-border/50 last:border-0 transition-colors",
        hasBoundingBox && "cursor-pointer hover:bg-primary/5 rounded px-2 -mx-2"
      )}
      onMouseEnter={() => hasBoundingBox && onHover?.(ocrField)}
      onMouseLeave={() => onHover?.(null)}
    >
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        {label}
        {hasBoundingBox && (
          <span className="text-[10px] text-primary/60">(survol = zoom)</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {displayValue ?? <span className="text-muted-foreground italic">Non renseigné</span>}
        </span>
        {ocrField && <ConfidenceIndicator confidence={ocrField.confidence} />}
      </div>
    </div>
  );
}

export function OcrFieldsDisplay({ invoice, ocrFields, onFieldHover }: OcrFieldsDisplayProps) {
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
            onHover={onFieldHover}
          />
          <FieldRow 
            label="Fournisseur" 
            value={invoice.supplier_name_extracted || invoice.supplier?.name} 
            ocrField={ocrFields?.supplier_name}
            onHover={onFieldHover}
          />
          <FieldRow 
            label="Date émission" 
            value={invoice.issue_date} 
            ocrField={ocrFields?.issue_date}
            format="date"
            onHover={onFieldHover}
          />
          <FieldRow 
            label="Date échéance" 
            value={invoice.due_date} 
            ocrField={ocrFields?.due_date}
            format="date"
            onHover={onFieldHover}
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
            onHover={onFieldHover}
          />
          <FieldRow 
            label="TVA" 
            value={invoice.amount_tva} 
            ocrField={ocrFields?.amount_tva}
            format="currency"
            onHover={onFieldHover}
          />
          <FieldRow 
            label="Montant TTC" 
            value={invoice.amount_ttc} 
            ocrField={ocrFields?.amount_ttc}
            format="currency"
            onHover={onFieldHover}
          />
          <FieldRow 
            label="Devise" 
            value={invoice.currency} 
            ocrField={ocrFields?.currency}
            onHover={onFieldHover}
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
            onHover={onFieldHover}
          />
          <FieldRow 
            label="N° Bon de Livraison" 
            value={invoice.bl_number_extracted} 
            ocrField={ocrFields?.bl_number}
            onHover={onFieldHover}
          />
          <FieldRow 
            label="IBAN" 
            value={invoice.iban_extracted} 
            ocrField={ocrFields?.iban}
            onHover={onFieldHover}
          />
        </div>
      </div>
    </div>
  );
}
