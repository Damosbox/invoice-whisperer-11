import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, PurchaseOrder, DeliveryNote } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  FileText, 
  Package, 
  Truck,
  Check, 
  X, 
  AlertTriangle,
  Euro,
  Calendar,
  User,
  Link2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InvoiceMatching() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [selectedBL, setSelectedBL] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch invoice
  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Invoice;
    },
    enabled: !!id,
  });

  // Fetch candidate POs
  const { data: purchaseOrders } = useQuery({
    queryKey: ['matching-pos', invoice?.supplier_id, invoice?.po_number_extracted],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select('*, supplier:suppliers(*)')
        .eq('status', 'actif')
        .order('order_date', { ascending: false })
        .limit(20);

      // Filter by supplier if available
      if (invoice?.supplier_id) {
        query = query.eq('supplier_id', invoice.supplier_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PurchaseOrder[];
    },
    enabled: !!invoice,
  });

  // Fetch candidate BLs
  const { data: deliveryNotes } = useQuery({
    queryKey: ['matching-bls', invoice?.supplier_id, selectedPO],
    queryFn: async () => {
      let query = supabase
        .from('delivery_notes')
        .select('*, supplier:suppliers(*), purchase_order:purchase_orders(*)')
        .order('delivery_date', { ascending: false })
        .limit(20);

      if (selectedPO) {
        query = query.eq('purchase_order_id', selectedPO);
      } else if (invoice?.supplier_id) {
        query = query.eq('supplier_id', invoice.supplier_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DeliveryNote[];
    },
    enabled: !!invoice,
  });

  // Generate PDF URL
  useEffect(() => {
    if (invoice?.file_path) {
      supabase.storage
        .from('invoices')
        .createSignedUrl(invoice.file_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) setPdfUrl(data.signedUrl);
        });
    }
  }, [invoice?.file_path]);

  // Pre-select if already matched
  useEffect(() => {
    if (invoice?.purchase_order_id) {
      setSelectedPO(invoice.purchase_order_id);
    }
    if (invoice?.delivery_note_id) {
      setSelectedBL(invoice.delivery_note_id);
    }
  }, [invoice]);

  // Mutation for saving match
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, unknown> = {
        purchase_order_id: selectedPO,
        delivery_note_id: selectedBL,
        match_status: selectedPO ? 'match_automatique' : 'aucun_match',
        status: 'a_approuver',
        match_score: selectedPO ? 1.0 : 0,
      };

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['matching-queue'] });
      toast.success('Rapprochement enregistré');
      navigate('/matching');
    },
    onError: () => {
      toast.error('Erreur lors du rapprochement');
    },
  });

  // Mark as no PO
  const markNoPOMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('invoices')
        .update({
          purchase_order_id: null,
          delivery_note_id: null,
          match_status: 'aucun_match',
          status: 'a_approuver',
          match_score: 0,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['matching-queue'] });
      toast.success('Facture marquée comme sans PO');
      navigate('/matching');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const calculateAmountDiff = (poAmount: number | null) => {
    if (!poAmount || !invoice?.amount_ttc) return null;
    const diff = ((invoice.amount_ttc - poAmount) / poAmount) * 100;
    return diff;
  };

  if (invoiceLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Facture non trouvée</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">
                Rapprochement - {invoice.invoice_number || 'Facture'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {invoice.supplier?.name || invoice.supplier_name_extracted || 'Fournisseur inconnu'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => markNoPOMutation.mutate()}
              disabled={markNoPOMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Sans PO
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !selectedPO}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Valider le rapprochement
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
        {/* Left: Invoice PDF + Info */}
        <div className="border-r border-border flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facture
            </h2>
          </div>
          
          {/* Invoice summary */}
          <div className="p-4 space-y-3 border-b border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">N° Facture:</span>
                <p className="font-medium">{invoice.invoice_number || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Montant TTC:</span>
                <p className="font-medium text-lg">{formatAmount(invoice.amount_ttc)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">PO extrait:</span>
                <p className="font-medium">{invoice.po_number_extracted || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">BL extrait:</span>
                <p className="font-medium">{invoice.bl_number_extracted || '-'}</p>
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 bg-muted/20">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Invoice PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Chargement du PDF...
              </div>
            )}
          </div>
        </div>

        {/* Right: PO/BL Selection */}
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Purchase Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bons de commande
                </CardTitle>
                <CardDescription>
                  Sélectionnez le PO correspondant à cette facture
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!purchaseOrders?.length ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun PO trouvé pour ce fournisseur
                  </p>
                ) : (
                  <RadioGroup value={selectedPO || ''} onValueChange={setSelectedPO}>
                    <div className="space-y-3">
                      {purchaseOrders.map((po) => {
                        const amountDiff = calculateAmountDiff(po.amount_ttc);
                        const isMatch = invoice.po_number_extracted === po.po_number;
                        
                        return (
                          <div 
                            key={po.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              selectedPO === po.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <RadioGroupItem value={po.id} id={po.id} className="mt-1" />
                            <Label htmlFor={po.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{po.po_number}</span>
                                {isMatch && (
                                  <Badge variant="secondary" className="text-xs">
                                    Correspondance
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Euro className="h-3 w-3" />
                                  {formatAmount(po.amount_ttc)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(po.order_date), 'dd/MM/yyyy')}
                                </div>
                              </div>
                              {amountDiff !== null && Math.abs(amountDiff) > 1 && (
                                <div className="mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      Math.abs(amountDiff) > 10 
                                        ? 'text-red-500 border-red-500/30' 
                                        : 'text-yellow-500 border-yellow-500/30'
                                    }`}
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Écart: {amountDiff > 0 ? '+' : ''}{amountDiff.toFixed(1)}%
                                  </Badge>
                                </div>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Delivery Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Bons de livraison
                </CardTitle>
                <CardDescription>
                  Optionnel: associez un BL à cette facture
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!deliveryNotes?.length ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun BL disponible
                  </p>
                ) : (
                  <RadioGroup value={selectedBL || ''} onValueChange={setSelectedBL}>
                    <div className="space-y-3">
                      <div 
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          !selectedBL 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <RadioGroupItem value="" id="no-bl" />
                        <Label htmlFor="no-bl" className="cursor-pointer text-muted-foreground">
                          Aucun BL
                        </Label>
                      </div>
                      
                      {deliveryNotes.map((bl) => {
                        const isMatch = invoice.bl_number_extracted === bl.bl_number;
                        
                        return (
                          <div 
                            key={bl.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              selectedBL === bl.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <RadioGroupItem value={bl.id} id={bl.id} className="mt-1" />
                            <Label htmlFor={bl.id} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{bl.bl_number}</span>
                                {isMatch && (
                                  <Badge variant="secondary" className="text-xs">
                                    Correspondance
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(bl.delivery_date), 'dd/MM/yyyy', { locale: fr })}
                                </div>
                                {bl.description && (
                                  <p className="mt-1 truncate">{bl.description}</p>
                                )}
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
