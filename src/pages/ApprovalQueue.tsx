import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, AppRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, RefreshCw, AlertTriangle, Clock, Euro, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLE_APPROVAL_LEVEL: Record<AppRole, number[]> = {
  comptable: [1],
  daf: [1, 2],
  dg: [1, 2, 3],
  admin: [1, 2, 3],
  auditeur: [],
};

interface InvoiceWithApproval extends Invoice {
  current_approval_level?: number | null;
  required_approval_levels?: number | null;
}

export default function ApprovalQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles(user?.id);

  const userApprovalLevels = roles.flatMap(role => ROLE_APPROVAL_LEVEL[role] || []);
  const uniqueLevels = [...new Set(userApprovalLevels)];

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['approval-queue', roles],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(*),
          purchase_order:purchase_orders(*)
        `)
        .eq('status', 'a_approuver')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter invoices based on user's approval levels
      return (data as unknown as InvoiceWithApproval[]).filter(inv => {
        const currentLevel = inv.current_approval_level || 1;
        return uniqueLevels.includes(currentLevel);
      });
    },
    enabled: roles.length > 0,
  });

  const groupedByLevel = invoices?.reduce((acc, inv) => {
    const level = inv.current_approval_level || 1;
    if (!acc[level]) acc[level] = [];
    acc[level].push(inv as Invoice);
    return acc;
  }, {} as Record<number, Invoice[]>) || {};

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Niveau 1 - Comptable';
      case 2: return 'Niveau 2 - DAF';
      case 3: return 'Niveau 3 - DG';
      default: return `Niveau ${level}`;
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">À Approuver</h1>
              <p className="text-sm text-muted-foreground">
                {invoices?.length || 0} facture(s) en attente de validation
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
        {Object.keys(groupedByLevel).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune facture à approuver</p>
              <p className="text-muted-foreground">Toutes les factures ont été traitées.</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByLevel)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, levelInvoices]) => (
              <Card key={level}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline">{getLevelLabel(Number(level))}</Badge>
                    <span className="text-muted-foreground font-normal text-sm">
                      ({levelInvoices.length} facture{levelInvoices.length > 1 ? 's' : ''})
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
                        <TableHead>Date émission</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead>Anomalies</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {levelInvoices.map((invoice) => (
                        <TableRow 
                          key={invoice.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/invoices/${invoice.id}?source=approval`)}
                        >
                          <TableCell className="font-medium">
                            {invoice.invoice_number || 'Non extrait'}
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
                            {invoice.issue_date 
                              ? format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: fr })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {invoice.due_date ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: fr })}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {invoice.has_anomalies ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Anomalie
                              </Badge>
                            ) : (
                              <Badge variant="secondary">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="default">
                              Examiner
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
