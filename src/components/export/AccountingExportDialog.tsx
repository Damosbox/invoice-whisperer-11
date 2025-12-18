import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, FileSpreadsheet, Settings2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useInvoicesForExport,
  defaultExportFields,
  ExportField,
  ExportOptions,
  generateCSV,
  downloadCSV,
} from '@/hooks/useAccountingExport';
import { toast } from 'sonner';

interface AccountingExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountingExportDialog({ open, onOpenChange }: AccountingExportDialogProps) {
  const { data: invoices = [], isLoading } = useInvoicesForExport();
  
  const [fields, setFields] = useState<ExportField[]>(defaultExportFields);
  const [options, setOptions] = useState<ExportOptions>({
    separator: ';',
    dateFormat: 'fr',
    includeHeader: true,
    encoding: 'utf-8-bom',
  });

  const toggleField = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const enabledFieldsCount = fields.filter((f) => f.enabled).length;

  const handleExport = () => {
    if (invoices.length === 0) {
      toast.error('Aucune facture à exporter');
      return;
    }

    const csv = generateCSV(invoices, fields, options);
    const filename = `export_comptable_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    downloadCSV(csv, filename);
    
    toast.success(`${invoices.length} facture(s) exportée(s)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export comptable
          </DialogTitle>
          <DialogDescription>
            Exportez les factures prêtes à la comptabilisation au format CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice count */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Factures à exporter</p>
              <p className="text-sm text-muted-foreground">
                Statut: Prêtes à la comptabilisation
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {invoices.length}
              </Badge>
            )}
          </div>

          {/* Format Options */}
          <Accordion type="single" collapsible defaultValue="format">
            <AccordionItem value="format">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Options de format
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Séparateur</Label>
                    <Select
                      value={options.separator}
                      onValueChange={(v) =>
                        setOptions({ ...options, separator: v as ExportOptions['separator'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=";">Point-virgule (;)</SelectItem>
                        <SelectItem value=",">Virgule (,)</SelectItem>
                        <SelectItem value={'\t'}>Tabulation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format de date</Label>
                    <Select
                      value={options.dateFormat}
                      onValueChange={(v) =>
                        setOptions({ ...options, dateFormat: v as ExportOptions['dateFormat'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français (JJ/MM/AAAA)</SelectItem>
                        <SelectItem value="us">US (MM/DD/YYYY)</SelectItem>
                        <SelectItem value="iso">ISO (AAAA-MM-JJ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Encodage</Label>
                    <Select
                      value={options.encoding}
                      onValueChange={(v) =>
                        setOptions({ ...options, encoding: v as ExportOptions['encoding'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf-8-bom">UTF-8 avec BOM (Excel)</SelectItem>
                        <SelectItem value="utf-8">UTF-8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="include-header"
                      checked={options.includeHeader}
                      onCheckedChange={(checked) =>
                        setOptions({ ...options, includeHeader: checked === true })
                      }
                    />
                    <Label htmlFor="include-header">Inclure l'en-tête</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fields">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  Colonnes ({enabledFieldsCount} sélectionnées)
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={field.key}
                        checked={field.enabled}
                        onCheckedChange={() => toggleField(field.key)}
                      />
                      <Label
                        htmlFor={field.key}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || invoices.length === 0 || enabledFieldsCount === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter {invoices.length > 0 ? `(${invoices.length})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
