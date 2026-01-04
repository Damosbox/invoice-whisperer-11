import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ScanSearch,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Bar, BarChart } from 'recharts';
import { useOcrQualityBySupplier, useOcrGlobalStats } from '@/hooks/useOcrQuality';
import { useNavigate } from 'react-router-dom';

const chartConfig = {
  avgConfidence: {
    label: 'Confiance moyenne',
    color: 'hsl(var(--primary))',
  },
  count: {
    label: 'Nombre de factures',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

export default function OcrQuality() {
  const navigate = useNavigate();
  const { data: supplierStats, isLoading: loadingSuppliers } = useOcrQualityBySupplier();
  const { data: globalStats, isLoading: loadingGlobal } = useOcrGlobalStats();

  if (loadingSuppliers || loadingGlobal) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const confidenceTrend = globalStats?.confidenceByMonth || [];
  const latestConfidence = confidenceTrend[confidenceTrend.length - 1]?.avgConfidence || 0;
  const previousConfidence = confidenceTrend[confidenceTrend.length - 2]?.avgConfidence || latestConfidence;
  const confidenceChange = latestConfidence - previousConfidence;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Qualité OCR</h1>
        <p className="text-muted-foreground">
          Statistiques d'extraction par fournisseur et évolution
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confiance moyenne</p>
                <p className="text-2xl font-bold">
                  {((globalStats?.avgConfidence || 0) * 100).toFixed(1)}%
                </p>
                <div className={`flex items-center text-xs ${confidenceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {confidenceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {confidenceChange >= 0 ? '+' : ''}{(confidenceChange * 100).toFixed(1)}%
                </div>
              </div>
              <ScanSearch className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factures traitées</p>
                <p className="text-2xl font-bold">{globalStats?.totalInvoices || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {globalStats?.validatedCount || 0} validées
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faible confiance</p>
                <p className="text-2xl font-bold">{globalStats?.lowConfidenceCount || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {globalStats?.errorRate.toFixed(1)}% du total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente validation</p>
                <p className="text-2xl font-bold">{globalStats?.pendingValidationCount || 0}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de la confiance OCR</CardTitle>
          <CardDescription>12 derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          {confidenceTrend.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Pas assez de données pour afficher le graphique
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[250px]">
              <LineChart data={confidenceTrend}>
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(v) => {
                    const [year, month] = v.split('-');
                    return format(new Date(+year, +month - 1), 'MMM', { locale: fr });
                  }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="avgConfidence"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Supplier Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques par fournisseur</CardTitle>
          <CardDescription>
            Classé par nombre de factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!supplierStats || supplierStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée disponible
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-center">Factures</TableHead>
                  <TableHead className="text-center">Confiance moy.</TableHead>
                  <TableHead className="text-center">Taux erreur</TableHead>
                  <TableHead className="text-center">À valider</TableHead>
                  <TableHead className="text-center">Corrections</TableHead>
                  <TableHead>Dernière facture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierStats.slice(0, 20).map((s) => (
                  <TableRow 
                    key={s.supplier_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/suppliers/${s.supplier_id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{s.supplier_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{s.total_invoices}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress 
                          value={(s.avg_confidence || 0) * 100} 
                          className="w-16 h-2"
                        />
                        <span className="text-sm">
                          {((s.avg_confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={s.error_rate > 20 ? 'destructive' : s.error_rate > 10 ? 'secondary' : 'outline'}
                      >
                        {s.error_rate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {s.pending_validation_count > 0 ? (
                        <Badge variant="default">{s.pending_validation_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.template_corrections_count}
                    </TableCell>
                    <TableCell>
                      {s.last_invoice_date
                        ? format(new Date(s.last_invoice_date), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
