import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
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

interface SupplierImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParseResult {
  valid: SupplierFormData[];
  errors: string[];
}

const CSV_HEADERS = ['name', 'identifier', 'email', 'phone', 'address', 'iban', 'bic', 'is_critical', 'payment_terms_days', 'notes'];

function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { valid: [], errors: ['Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données'] };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(/[,;]/).map(h => h.trim().replace(/"/g, ''));
  
  const nameIndex = headers.findIndex(h => h === 'name' || h === 'nom');
  if (nameIndex === -1) {
    return { valid: [], errors: ['Colonne "name" ou "nom" requise'] };
  }

  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const normalized = h === 'nom' ? 'name' : h === 'identifiant' ? 'identifier' : h === 'telephone' ? 'phone' : h === 'adresse' ? 'address' : h === 'critique' ? 'is_critical' : h === 'delai_paiement' ? 'payment_terms_days' : h;
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
      errors.push(`Ligne ${i + 1}: Nom manquant`);
      continue;
    }

    const supplier: SupplierFormData = { name };

    if (headerMap['identifier'] !== undefined) {
      supplier.identifier = values[headerMap['identifier']] || undefined;
    }
    if (headerMap['email'] !== undefined) {
      const email = values[headerMap['email']];
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Ligne ${i + 1}: Email invalide "${email}"`);
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
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Format attendu: CSV avec colonnes <code className="text-xs bg-muted px-1 rounded">name</code> (requis), 
              <code className="text-xs bg-muted px-1 rounded">identifier</code>, 
              <code className="text-xs bg-muted px-1 rounded">email</code>, 
              <code className="text-xs bg-muted px-1 rounded">phone</code>, 
              <code className="text-xs bg-muted px-1 rounded">address</code>, 
              <code className="text-xs bg-muted px-1 rounded">iban</code>, 
              <code className="text-xs bg-muted px-1 rounded">bic</code>, 
              <code className="text-xs bg-muted px-1 rounded">is_critical</code>, 
              <code className="text-xs bg-muted px-1 rounded">payment_terms_days</code>, 
              <code className="text-xs bg-muted px-1 rounded">notes</code>
            </AlertDescription>
          </Alert>

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

          {parseResult && (
            <div className="space-y-2">
              {parseResult.valid.length > 0 && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {parseResult.valid.length} fournisseur(s) prêt(s) à importer
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
                          ...et {parseResult.errors.length - 5} autres erreurs
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

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
