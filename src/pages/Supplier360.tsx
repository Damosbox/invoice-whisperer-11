import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Euro,
  FileText,
  TrendingUp,
  Clock,
  Star,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupplier360 } from '@/hooks/useSupplier360';

const statusLabels: Record<string, string> = {
  nouvelle: 'Nouvelle',
  a_valider_extraction: 'À valider',
  a_rapprocher: 'À rapprocher',
  a_approuver: 'À approuver',
  exception: 'Exception',
  litige: 'Litige',
  prete_comptabilisation: 'Prête',
  comptabilisee: 'Comptabilisée',
};

const disputeStatusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export default function Supplier360() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useSupplier360(id || null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/suppliers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux fournisseurs
        </Button>
        <p className="mt-4 text-muted-foreground">Fournisseur non trouvé</p>
      </div>
    );
  }

  const { supplier, invoices, disputes, purchaseOrders, stats } = data;
  const riskLevel = supplier.risk_score !== null 
    ? supplier.risk_score < 30 ? 'low' : supplier.risk_score < 70 ? 'medium' : 'high'
    : 'unknown';

  const riskColors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-orange-600 bg-orange-100',
    high: 'text-red-600 bg-red-100',
    unknown: 'text-gray-600 bg-gray-100',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/suppliers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              {supplier.is_critical && (
                <Badge variant="destructive">Critique</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {supplier.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {supplier.email}
                </span>
              )}
              {supplier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {supplier.phone}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {supplier.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="text-right">
          <p className="text-sm text-muted-foreground mb-1">Score de risque</p>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${riskColors[riskLevel]}`}>
            <ShieldAlert className="h-5 w-5" />
            <span className="text-2xl font-bold">{supplier.risk_score ?? '-'}</span>
            <span className="text-sm">/100</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total facturé</p>
                <p className="text-2xl font-bold">
                  {stats.totalInvoicesAmount.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <Euro className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factures</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingInvoicesCount} en cours
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de litige</p>
                <p className="text-2xl font-bold">{stats.disputeRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {disputes.length} litige(s)
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Délai paiement moyen</p>
                <p className="text-2xl font-bold">
                  {Math.round(stats.averagePaymentDelay)} j
                </p>
                <p className="text-xs text-muted-foreground">
                  Terme: {supplier.payment_terms_days || 30} jours
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Rating */}
      {supplier.quality_rating !== null && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Note qualité</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i <= (supplier.quality_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {supplier.quality_rating}/5
                  </span>
                </div>
              </div>
              <div className="w-48">
                <Progress value={(supplier.quality_rating || 0) * 20} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed data */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">
            Factures ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="disputes">
            Litiges ({disputes.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            Bons de commande ({purchaseOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Historique des factures</CardTitle>
              <CardDescription>Les 50 dernières factures</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune facture
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Facture</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow 
                        key={inv.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <TableCell className="font-medium">
                          {inv.invoice_number || '-'}
                        </TableCell>
                        <TableCell>
                          {inv.issue_date
                            ? format(new Date(inv.issue_date), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {inv.due_date
                            ? format(new Date(inv.due_date), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.amount_ttc?.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }) || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {statusLabels[inv.status || ''] || inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader>
              <CardTitle>Historique des litiges</CardTitle>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun litige
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map(d => (
                      <TableRow 
                        key={d.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/disputes/${d.id}`)}
                      >
                        <TableCell className="font-medium">
                          {d.invoice?.invoice_number || '-'}
                        </TableCell>
                        <TableCell>{d.category}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {d.description}
                        </TableCell>
                        <TableCell>
                          {format(new Date(d.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={d.status === 'open' ? 'destructive' : 'outline'}>
                            {disputeStatusLabels[d.status] || d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Bons de commande</CardTitle>
              <CardDescription>Les 50 derniers bons de commande</CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun bon de commande
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° BC</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>
                          {format(new Date(po.order_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {po.amount_ttc.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{po.status || 'Actif'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
