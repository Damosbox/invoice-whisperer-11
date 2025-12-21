import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, MatchStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link2, RefreshCw, CheckCircle, FileText, User, Euro, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MATCH_STATUS_CONFIG: Record<MatchStatus, { label: string; color: string }> = {
  match_automatique: { label: 'Match auto', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  match_probable: { label: 'Probable', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  match_incertain: { label: 'Incertain', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  aucun_match: { label: 'Aucun match', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function MatchingQueue() {
  const navigate = useNavigate();

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['matching-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*),
          purchase_order:purchase_orders(*)
        `)
        .eq('status', 'a_rapprocher')
        .order('match_score', { ascending: true });

      if (error) throw error;
      return data as unknown as Invoice[];
    },
  });

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Group by match status
  const groupedInvoices = invoices?.reduce((acc, inv) => {
    const status = inv.match_status || 'aucun_match';
    if (!acc[status]) acc[status] = [];
    acc[status].push(inv);
    return acc;
  }, {} as Record<MatchStatus, Invoice[]>) || {};

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
            <Link2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Rapprochement</h1>
              <p className="text-sm text-muted-foreground">
                {invoices?.length || 0} facture(s) à rapprocher avec PO/BL
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {!invoices?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Toutes les factures rapprochées</p>
              <p className="text-muted-foreground">Aucune facture n'attend de rapprochement.</p>
            </CardContent>
          </Card>
        ) : (
          (Object.entries(groupedInvoices) as [MatchStatus, Invoice[]][])
            .sort(([a], [b]) => {
              const order: MatchStatus[] = ['aucun_match', 'match_incertain', 'match_probable', 'match_automatique'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([status, statusInvoices]) => {
              const config = MATCH_STATUS_CONFIG[status];
              return (
                <Card key={status}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge className={config.color}>{config.label}</Badge>
                      <span className="text-muted-foreground font-normal text-sm">
                        ({statusInvoices.length} facture{statusInvoices.length > 1 ? 's' : ''})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Facture</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Montant TTC</TableHead>
                          <TableHead>PO extrait</TableHead>
                          <TableHead>BL extrait</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statusInvoices.map((invoice) => (
                          <TableRow 
                            key={invoice.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/invoices/${invoice.id}/matching`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {invoice.invoice_number || 'Non extrait'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {invoice.supplier?.name || invoice.supplier_name_extracted || 'Inconnu'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Euro className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{formatAmount(invoice.amount_ttc)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {invoice.po_number_extracted ? (
                                <div className="flex items-center gap-1">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <span>{invoice.po_number_extracted}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {invoice.bl_number_extracted || (
                                <span className="text-muted-foreground italic">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {invoice.match_score ? (
                                <span className="font-medium">
                                  {(invoice.match_score * 100).toFixed(0)}%
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(invoice.created_at), 'dd MMM', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="default">
                                Rapprocher
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
