import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Building2,
  Euro,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSuppliers } from '@/hooks/useSuppliers';

type RiskFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

export default function SupplierRiskDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [criticalOnly, setCriticalOnly] = useState(false);

  const { data: suppliers, isLoading } = useSuppliers(search);

  // Enrich suppliers with risk calculations
  const enrichedSuppliers = suppliers?.map(s => {
    const riskScore = (s as any).risk_score ?? 50;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    
    if (riskScore < 25) riskLevel = 'low';
    else if (riskScore < 50) riskLevel = 'medium';
    else if (riskScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      ...s,
      risk_score: riskScore,
      risk_level: riskLevel,
      total_invoices_count: (s as any).total_invoices_count ?? 0,
      disputed_invoices_count: (s as any).disputed_invoices_count ?? 0,
      late_payments_count: (s as any).late_payments_count ?? 0,
      avg_payment_delay_days: (s as any).avg_payment_delay_days ?? 0,
    };
  }) || [];

  // Filter suppliers
  const filteredSuppliers = enrichedSuppliers.filter(s => {
    if (criticalOnly && !s.is_critical) return false;
    if (riskFilter !== 'all' && s.risk_level !== riskFilter) return false;
    return true;
  });

  // Sort by risk score (highest first)
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => b.risk_score - a.risk_score);

  // Stats
  const stats = {
    total: enrichedSuppliers.length,
    critical: enrichedSuppliers.filter(s => s.risk_level === 'critical').length,
    high: enrichedSuppliers.filter(s => s.risk_level === 'high').length,
    medium: enrichedSuppliers.filter(s => s.risk_level === 'medium').length,
    low: enrichedSuppliers.filter(s => s.risk_level === 'low').length,
    isCritical: enrichedSuppliers.filter(s => s.is_critical).length,
  };

  const getRiskBadge = (level: string, score: number) => {
    const colors = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return (
      <div className={`px-2 py-1 rounded text-xs font-medium ${colors[level as keyof typeof colors]}`}>
        {score}
      </div>
    );
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Score de risque fournisseur</h1>
        <p className="text-muted-foreground">
          Évaluation et suivi des risques fournisseurs
        </p>
      </div>

      {/* Risk Distribution Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Critique</p>
            <p className="text-2xl font-bold">{stats.critical}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Élevé</p>
            <p className="text-2xl font-bold">{stats.high}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Moyen</p>
            <p className="text-2xl font-bold">{stats.medium}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Faible</p>
            <p className="text-2xl font-bold">{stats.low}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Critiques stratégiques</p>
            <p className="text-2xl font-bold">{stats.isCritical}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
          <SelectTrigger className="w-[180px]">
            <ShieldAlert className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Niveau de risque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Élevé</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fournisseurs par risque</CardTitle>
          <CardDescription>
            {sortedSuppliers.length} fournisseur(s) affiché(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Niveau</TableHead>
                <TableHead className="text-center">Factures</TableHead>
                <TableHead className="text-center">Litiges</TableHead>
                <TableHead className="text-center">Retards</TableHead>
                <TableHead className="text-center">Délai moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSuppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/suppliers/${supplier.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{supplier.name}</span>
                      {supplier.is_critical && (
                        <Badge variant="destructive" className="text-xs">Critique</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Progress 
                        value={100 - supplier.risk_score} 
                        className="w-16 h-2"
                      />
                      {getRiskBadge(supplier.risk_level, supplier.risk_score)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={
                        supplier.risk_level === 'critical' ? 'destructive' :
                        supplier.risk_level === 'high' ? 'default' :
                        'outline'
                      }
                    >
                      {supplier.risk_level === 'critical' ? 'Critique' :
                       supplier.risk_level === 'high' ? 'Élevé' :
                       supplier.risk_level === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.total_invoices_count}
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.disputed_invoices_count > 0 ? (
                      <Badge variant="destructive">{supplier.disputed_invoices_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.late_payments_count > 0 ? (
                      <Badge variant="secondary">{supplier.late_payments_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {Math.round(supplier.avg_payment_delay_days)} j
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
