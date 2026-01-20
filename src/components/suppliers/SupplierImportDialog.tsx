import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useImportSuppliers, SupplierFormData } from '@/hooks/useSuppliers';
import { t } from '@/lib/translations';

interface SupplierImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParseResult {
  valid: SupplierFormData[];
  errors: string[];
}

const CSV_HEADERS = ['name', 'fiscal_identifier', 'company_identifier', 'country', 'email', 'phone', 'address', 'iban', 'bic', 'is_critical', 'payment_terms_days', 'notes'];

function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { valid: [], errors: [t.csv.minLines] };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(/[,;]/).map(h => h.trim().replace(/"/g, ''));
  
  const nameIndex = headers.findIndex(h => h === 'name' || h === 'nom');
  if (nameIndex === -1) {
    return { valid: [], errors: [t.csv.nameColumnRequired] };
  }

  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const normalized = h === 'nom' ? 'name' : h;
    if (CSV_HEADERS.includes(normalized)) {
      headerMap[normalized] = i;
    }
  });

  const valid: SupplierFormData[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''));
    
    const name = values[headerMap['name']]?.trim();
    if (!name) {
      errors.push(t.csv.missingName(i + 1));
      continue;
    }

    const supplier: SupplierFormData = { name };

    if (headerMap['fiscal_identifier'] !== undefined) {
      supplier.fiscal_identifier = values[headerMap['fiscal_identifier']] || undefined;
    }
    if (headerMap['company_identifier'] !== undefined) {
      supplier.company_identifier = values[headerMap['company_identifier']] || undefined;
    }
    if (headerMap['country'] !== undefined) {
      supplier.country = values[headerMap['country']] || 'CI';
    }
    if (headerMap['email'] !== undefined) {
      const email = values[headerMap['email']];
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(t.csv.invalidEmail(i + 1, email));
        continue;
      }
      supplier.email = email || undefined;
    }
    if (headerMap['phone'] !== undefined) {
      supplier.phone = values[headerMap['phone']] || undefined;
    }
    if (headerMap['address'] !== undefined) {
      supplier.address = values[headerMap['address']] || undefined;
    }
    if (headerMap['iban'] !== undefined) {
      supplier.iban = values[headerMap['iban']] || undefined;
    }
    if (headerMap['bic'] !== undefined) {
      supplier.bic = values[headerMap['bic']] || undefined;
    }
    if (headerMap['is_critical'] !== undefined) {
      const val = values[headerMap['is_critical']]?.toLowerCase();
      supplier.is_critical = val === 'true' || val === 'oui' || val === '1';
    }
    if (headerMap['payment_terms_days'] !== undefined) {
      const days = parseInt(values[headerMap['payment_terms_days']], 10);
      supplier.payment_terms_days = isNaN(days) ? 30 : days;
    }
    if (headerMap['notes'] !== undefined) {
      supplier.notes = values[headerMap['notes']] || undefined;
    }

    valid.push(supplier);
  }

  return { valid, errors };
}

export function SupplierImportDialog({ open, onOpenChange }: SupplierImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const importSuppliers = useImportSuppliers();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const content = await selectedFile.text();
    const result = parseCSV(content);
    setParseResult(result);
  }, []);

  const handleDownloadTemplate = () => {
    const template = 'name;fiscal_identifier;company_identifier;country;email;phone;address;iban;bic;is_critical;payment_terms_days;notes\nExemple SARL;CI123456789;RCCM-ABJ-2024-B-12345;CI;contact@exemple.ci;+225 07 00 00 00;Abidjan Cocody;CI93 0001 0001 0000 0000 0000 001;BICICIAB;false;30;Notes';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_fournisseurs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!parseResult?.valid.length) return;
    await importSuppliers.mutateAsync(parseResult.valid);
    onOpenChange(false);
    setFile(null);
    setParseResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setParseResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer des fournisseurs</DialogTitle>
          <DialogDescription>
            Importez des fournisseurs depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format attendu */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium">Format attendu (séparateur: point-virgule) :</p>
            <code className="text-xs block overflow-x-auto whitespace-nowrap bg-background p-2 rounded border">
              name;fiscal_identifier;company_identifier;country;email;phone;address;iban;bic;is_critical;payment_terms_days;notes
            </code>
          </div>

          {/* Actions de téléchargement */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-1" />
              Générer template
            </Button>
            <span className="text-sm text-muted-foreground">ou</span>
            <a 
              href="/templates/suppliers_template.csv" 
              download="template_fournisseurs.csv"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Télécharger exemple avec données
            </a>
          </div>

          {/* Zone d'upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
              </p>
            </label>
          </div>

          {/* Résultats du parsing */}
          {parseResult && (
            <div className="space-y-2">
              {parseResult.valid.length > 0 && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {t.csv.readyToImport(parseResult.valid.length)}
                  </AlertDescription>
                </Alert>
              )}

              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="max-h-24 overflow-y-auto text-sm">
                      {parseResult.errors.slice(0, 5).map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <div className="text-muted-foreground">
                          {t.csv.andMoreErrors(parseResult.errors.length - 5)}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parseResult?.valid.length || importSuppliers.isPending}
            >
              {importSuppliers.isPending ? 'Import...' : `Importer ${parseResult?.valid.length || 0} fournisseur(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
