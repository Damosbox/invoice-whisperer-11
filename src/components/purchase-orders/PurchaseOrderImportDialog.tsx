import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PurchaseOrderImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (purchaseOrders: any[]) => void;
  isLoading?: boolean;
}

export function PurchaseOrderImportDialog({
  open,
  onOpenChange,
  onImport,
  isLoading,
}: PurchaseOrderImportDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }

    const headers = lines[0].split(';').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['po_number', 'amount_ht', 'amount_ttc', 'order_date'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Colonnes manquantes: ${missingHeaders.join(', ')}`);
    }

    return lines.slice(1).map((line, index) => {
      const values = line.split(';').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, i) => {
        const value = values[i] || '';
        switch (header) {
          case 'po_number':
            row.po_number = value;
            break;
          case 'amount_ht':
            row.amount_ht = parseFloat(value) || 0;
            break;
          case 'amount_tva':
            row.amount_tva = parseFloat(value) || 0;
            break;
          case 'amount_ttc':
            row.amount_ttc = parseFloat(value) || 0;
            break;
          case 'currency':
            row.currency = value || 'EUR';
            break;
          case 'description':
            row.description = value || null;
            break;
          case 'status':
            row.status = value || 'actif';
            break;
          case 'order_date':
            row.order_date = value;
            break;
          case 'expected_delivery_date':
            row.expected_delivery_date = value || null;
            break;
        }
      });

      if (!row.po_number) {
        throw new Error(`Ligne ${index + 2}: Numéro de BC manquant`);
      }
      if (!row.order_date) {
        throw new Error(`Ligne ${index + 2}: Date de commande manquante`);
      }

      return row;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview);
      setPreview([]);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setPreview([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des bons de commande</DialogTitle>
          <DialogDescription>
            Importez vos bons de commande depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Format attendu: CSV avec séparateur point-virgule (;)
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Colonnes requises: po_number, amount_ht, amount_ttc, order_date
              <br />
              Colonnes optionnelles: amount_tva, currency, description, status, expected_delivery_date
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner un fichier CSV
              </label>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Aperçu: {preview.length} bon(s) de commande à importer
              </p>
              <div className="max-h-48 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">N° BC</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Montant HT</th>
                      <th className="p-2 text-right">Montant TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((po, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{po.po_number}</td>
                        <td className="p-2">{po.order_date}</td>
                        <td className="p-2 text-right">{po.amount_ht?.toFixed(2)} €</td>
                        <td className="p-2 text-right">{po.amount_ttc?.toFixed(2)} €</td>
                      </tr>
                    ))}
                    {preview.length > 5 && (
                      <tr className="border-t">
                        <td colSpan={4} className="p-2 text-center text-muted-foreground">
                          ... et {preview.length - 5} autre(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={preview.length === 0 || isLoading}
            >
              {isLoading ? 'Import en cours...' : `Importer ${preview.length} BC`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
