import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useCreateBankStatement } from '@/hooks/useBankStatements';

interface ColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  headers: string[];
  data: string[][];
  onComplete: () => void;
}

const REQUIRED_FIELDS = [
  { key: 'date', label: 'Date de transaction', required: true },
  { key: 'amount', label: 'Montant', required: true },
  { key: 'description', label: 'Description / Libellé', required: false },
  { key: 'valueDate', label: 'Date de valeur', required: false },
  { key: 'reference', label: 'Référence bancaire', required: false },
  { key: 'counterparty', label: 'Nom contrepartie', required: false },
  { key: 'iban', label: 'IBAN contrepartie', required: false },
];

export function ColumnMappingDialog({
  open,
  onOpenChange,
  fileName,
  headers,
  data,
  onComplete,
}: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const createStatement = useCreateBankStatement();

  // Auto-detect mappings based on header names
  useMemo(() => {
    const autoMapping: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      if (headerLower.includes('date') && !headerLower.includes('valeur') && !headerLower.includes('value')) {
        if (!autoMapping.date) autoMapping.date = index.toString();
      }
      if (headerLower.includes('valeur') || headerLower.includes('value')) {
        autoMapping.valueDate = index.toString();
      }
      if (headerLower.includes('montant') || headerLower.includes('amount') || headerLower.includes('somme')) {
        autoMapping.amount = index.toString();
      }
      if (headerLower.includes('description') || headerLower.includes('libellé') || headerLower.includes('libelle') || headerLower.includes('label')) {
        autoMapping.description = index.toString();
      }
      if (headerLower.includes('référence') || headerLower.includes('reference') || headerLower.includes('ref')) {
        autoMapping.reference = index.toString();
      }
      if (headerLower.includes('contrepartie') || headerLower.includes('beneficiaire') || headerLower.includes('payee') || headerLower.includes('nom')) {
        autoMapping.counterparty = index.toString();
      }
      if (headerLower.includes('iban')) {
        autoMapping.iban = index.toString();
      }
    });

    setMapping(prev => ({ ...autoMapping, ...prev }));
  }, [headers]);

  const previewData = data.slice(0, 5);

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // Try common date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return dateStr; // Already YYYY-MM-DD
        } else {
          // DD/MM/YYYY or similar
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }

    // Try Date.parse as fallback
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return null;
  };

  const parseAmount = (amountStr: string): { amount: number; direction: 'debit' | 'credit' } | null => {
    if (!amountStr) return null;
    
    // Remove currency symbols and spaces
    let cleaned = amountStr.replace(/[€$£\s]/g, '').trim();
    
    // Handle European format (1.234,56 -> 1234.56)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(',', '.');
    }

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return null;

    return {
      amount: Math.abs(amount),
      direction: amount < 0 ? 'debit' : 'credit',
    };
  };

  const handleImport = async () => {
    const dateCol = parseInt(mapping.date);
    const amountCol = parseInt(mapping.amount);
    const descCol = mapping.description ? parseInt(mapping.description) : undefined;
    const valueDateCol = mapping.valueDate ? parseInt(mapping.valueDate) : undefined;
    const refCol = mapping.reference ? parseInt(mapping.reference) : undefined;
    const counterpartyCol = mapping.counterparty ? parseInt(mapping.counterparty) : undefined;
    const ibanCol = mapping.iban ? parseInt(mapping.iban) : undefined;

    const transactions = data
      .map(row => {
        const date = parseDate(row[dateCol]);
        const amountParsed = parseAmount(row[amountCol]);
        
        if (!date || !amountParsed) return null;

        return {
          transaction_date: date,
          value_date: valueDateCol !== undefined ? parseDate(row[valueDateCol]) || undefined : undefined,
          amount: amountParsed.amount,
          direction: amountParsed.direction,
          description: descCol !== undefined ? row[descCol] : undefined,
          bank_reference: refCol !== undefined ? row[refCol] : undefined,
          counterparty_name: counterpartyCol !== undefined ? row[counterpartyCol] : undefined,
          counterparty_iban: ibanCol !== undefined ? row[ibanCol] : undefined,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (transactions.length === 0) {
      return;
    }

    // Calculate period
    const dates = transactions.map(t => t.transaction_date).sort();
    const periodStart = dates[0];
    const periodEnd = dates[dates.length - 1];

    await createStatement.mutateAsync({
      fileName,
      source: fileName.endsWith('.ofx') ? 'ofx' : 'csv',
      periodStart,
      periodEnd,
      transactions,
    });

    onComplete();
  };

  const canImport = mapping.date && mapping.amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapping des colonnes</DialogTitle>
          <DialogDescription>
            Associez les colonnes de votre fichier aux champs requis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mapping fields */}
          <div className="grid grid-cols-2 gap-4">
            {REQUIRED_FIELDS.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {field.label}
                  {field.required && (
                    <Badge variant="destructive" className="text-xs">Requis</Badge>
                  )}
                </Label>
                <Select
                  value={mapping[field.key] || ''}
                  onValueChange={(value) => setMapping(prev => ({
                    ...prev,
                    [field.key]: value === 'none' ? '' : value,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Non mappé --</SelectItem>
                    {headers.map((header, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {header || `Colonne ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Aperçu des données (5 premières lignes)</Label>
            <div className="border rounded-lg overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="whitespace-nowrap">
                        {header || `Col ${index + 1}`}
                        {mapping.date === index.toString() && (
                          <Badge variant="outline" className="ml-2 text-xs">Date</Badge>
                        )}
                        {mapping.amount === index.toString() && (
                          <Badge variant="outline" className="ml-2 text-xs">Montant</Badge>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="whitespace-nowrap">
                          {cell || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.length} transactions trouvées dans le fichier
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!canImport || createStatement.isPending}
          >
            {createStatement.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importer {data.length} transactions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
