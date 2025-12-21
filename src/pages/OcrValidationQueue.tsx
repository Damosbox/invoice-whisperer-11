import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScanSearch, RefreshCw, AlertCircle, CheckCircle, FileText, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OcrValidationQueue() {
  const navigate = useNavigate();

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['ocr-validation-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('status', 'a_valider_extraction')
        .order('ocr_confidence_score', { ascending: true });

      if (error) throw error;
      return data as unknown as Invoice[];
    },
  });

  const getConfidenceColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceBadge = (score: number | null) => {
    if (!score) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 0.9) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Haute</Badge>;
    if (score >= 0.7) return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Moyenne</Badge>;
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Faible</Badge>;
  };

  const countLowConfidenceFields = (invoice: Invoice) => {
    if (!invoice.ocr_fields) return 0;
    return Object.values(invoice.ocr_fields).filter(
      field => field && typeof field === 'object' && 'confidence' in field && field.confidence < 0.7
    ).length;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ScanSearch className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Validation Extraction OCR</h1>
              <p className="text-sm text-muted-foreground">
                {invoices?.length || 0} facture(s) à contrôler
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {!invoices?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Toutes les extractions validées</p>
              <p className="text-muted-foreground">Aucune facture n'attend de validation OCR.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Confiance globale</TableHead>
                  <TableHead>Champs à vérifier</TableHead>
                  <TableHead>Date import</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const lowConfidenceCount = countLowConfidenceFields(invoice);
                  const confidencePercent = (invoice.ocr_confidence_score || 0) * 100;
                  
                  return (
                    <TableRow 
                      key={invoice.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[200px]">
                            {invoice.original_filename || 'Document'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.invoice_number || (
                          <span className="text-muted-foreground italic">Non extrait</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {invoice.supplier?.name || invoice.supplier_name_extracted || (
                            <span className="text-muted-foreground italic">Inconnu</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-32">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${getConfidenceColor(invoice.ocr_confidence_score)}`}>
                              {confidencePercent.toFixed(0)}%
                            </span>
                            {getConfidenceBadge(invoice.ocr_confidence_score)}
                          </div>
                          <Progress 
                            value={confidencePercent} 
                            className="h-1.5"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {lowConfidenceCount > 0 ? (
                          <Badge variant="outline" className="gap-1 text-orange-500 border-orange-500/30">
                            <AlertCircle className="h-3 w-3" />
                            {lowConfidenceCount} champ{lowConfidenceCount > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Tous OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(invoice.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="default">
                          Valider
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
