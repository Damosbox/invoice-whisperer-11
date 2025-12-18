import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, OcrFields } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, Save } from 'lucide-react';
import { PdfViewer } from '@/components/invoice-detail/PdfViewer';
import { OcrFieldsDisplay } from '@/components/invoice-detail/OcrFieldsDisplay';
import { InvoiceEditForm } from '@/components/invoice-detail/InvoiceEditForm';
import { WorkflowActions } from '@/components/invoice-detail/WorkflowActions';
import { MatchingInfo } from '@/components/invoice-detail/MatchingInfo';
import { ApprovalWorkflowPanel } from '@/components/approval/ApprovalWorkflowPanel';
import { useState } from 'react';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  nouvelle: { label: 'Nouvelle', variant: 'secondary' },
  a_valider_extraction: { label: 'À valider (OCR)', variant: 'default' },
  a_rapprocher: { label: 'À rapprocher', variant: 'default' },
  a_approuver: { label: 'À approuver', variant: 'default' },
  exception: { label: 'Exception', variant: 'destructive' },
  litige: { label: 'Litige', variant: 'destructive' },
  prete_comptabilisation: { label: 'Prête comptabilisation', variant: 'outline' },
  comptabilisee: { label: 'Comptabilisée', variant: 'outline' },
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*),
          purchase_order:purchase_orders(*),
          delivery_note:delivery_notes(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform to Invoice type
      return {
        ...data,
        ocr_fields: data.ocr_fields as unknown as OcrFields | null,
        match_details: data.match_details as unknown as Invoice['match_details'],
        anomaly_details: data.anomaly_details as unknown as Invoice['anomaly_details'],
      } as Invoice;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from('invoices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Facture mise à jour', description: 'Les modifications ont été enregistrées.' });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error instanceof Error ? error.message : 'Échec de la mise à jour',
        variant: 'destructive'
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-semibold">Facture non trouvée</h2>
        <Button onClick={() => navigate('/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux factures
        </Button>
      </div>
    );
  }

  const statusInfo = statusLabels[invoice.status] || { label: invoice.status, variant: 'secondary' as const };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              {invoice.invoice_number || invoice.original_filename || 'Facture sans numéro'}
            </h1>
            <p className="text-muted-foreground">
              {invoice.supplier_name_extracted || invoice.supplier?.name || 'Fournisseur inconnu'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {invoice.has_anomalies && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Anomalies
            </Badge>
          )}
          {invoice.ocr_confidence_score !== null && (
            <Badge variant="outline" className="gap-1">
              OCR: {invoice.ocr_confidence_score}%
            </Badge>
          )}
        </div>
      </div>

      {/* Main content - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PDF Viewer */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Document</CardTitle>
          </CardHeader>
          <CardContent>
            <PdfViewer filePath={invoice.file_path} />
          </CardContent>
        </Card>

        {/* Right: Invoice data and actions */}
        <div className="space-y-6">
          {/* OCR Fields with confidence */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Données extraites</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <InvoiceEditForm 
                  invoice={invoice} 
                  onSave={(updates) => updateMutation.mutate(updates)}
                  isSaving={updateMutation.isPending}
                />
              ) : (
                <OcrFieldsDisplay 
                  invoice={invoice}
                  ocrFields={invoice.ocr_fields as OcrFields | null}
                />
              )}
            </CardContent>
          </Card>

          {/* Matching info */}
          <MatchingInfo invoice={invoice} />

          {/* Approval Workflow */}
          <ApprovalWorkflowPanel
            invoiceId={invoice.id}
            invoiceAmount={invoice.amount_ttc || 0}
            isCriticalSupplier={invoice.supplier?.is_critical || false}
            invoiceStatus={invoice.status}
            currentLevel={(invoice as any).current_approval_level}
            requiredLevels={(invoice as any).required_approval_levels}
          />

          {/* Workflow Actions */}
          <WorkflowActions 
            invoice={invoice}
            onStatusChange={(newStatus) => updateMutation.mutate({ status: newStatus })}
            isUpdating={updateMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
