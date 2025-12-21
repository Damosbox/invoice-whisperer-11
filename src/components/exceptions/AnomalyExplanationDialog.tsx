import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ExceptionInvoice } from '@/hooks/useExceptions';

interface AnomalyExplanationDialogProps {
  invoice: ExceptionInvoice;
}

export function AnomalyExplanationDialog({ invoice }: AnomalyExplanationDialogProps) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async () => {
    if (explanation) return; // Already fetched
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('explain-anomaly', {
        body: {
          invoice: {
            invoice_number: invoice.invoice_number,
            supplier_name: invoice.suppliers?.name,
            supplier_name_extracted: invoice.supplier_name_extracted,
            amount_ttc: invoice.amount_ttc,
            amount_ht: invoice.amount_ht,
            currency: invoice.currency,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            po_number_extracted: invoice.po_number_extracted,
            iban_extracted: invoice.iban_extracted,
            ocr_confidence_score: invoice.ocr_confidence_score,
            anomaly_types: invoice.anomaly_types,
            anomaly_details: invoice.anomaly_details,
          },
        },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setExplanation(data.explanation);
    } catch (err) {
      console.error('Error fetching explanation:', err);
      const message = err instanceof Error ? err.message : "Impossible de générer l'explication";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchExplanation();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Expliquer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analyse IA de l'anomalie
          </DialogTitle>
          <DialogDescription>
            Facture {invoice.invoice_number || 'sans numéro'} - {invoice.suppliers?.name || invoice.supplier_name_extracted || 'Fournisseur inconnu'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyse en cours...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchExplanation}>
                Réessayer
              </Button>
            </div>
          )}

          {explanation && !isLoading && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {explanation}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
