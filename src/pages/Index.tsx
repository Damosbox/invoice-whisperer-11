import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Euro,
  Timer,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PriorityAlerts } from '@/components/dashboard/PriorityAlerts';
import { StatusDistributionChart } from '@/components/dashboard/StatusDistributionChart';
import { InvoiceTrendChart } from '@/components/dashboard/InvoiceTrendChart';
import { TopSuppliersChart } from '@/components/dashboard/TopSuppliersChart';
import { OverdueTable } from '@/components/dashboard/OverdueTable';

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k€`;
  return `${value.toFixed(0)}€`;
};

const quickActions = [
  { 
    label: 'Importer des factures', 
    description: 'Upload de fichiers PDF ou images',
    to: '/upload',
    icon: FileText 
  },
  { 
    label: 'Voir les factures', 
    description: 'Tableau Kanban de toutes les factures',
    to: '/invoices',
    icon: TrendingUp 
  },
  { 
    label: 'Gérer les exceptions', 
    description: 'Factures nécessitant une attention',
    to: '/exceptions',
    icon: AlertTriangle 
  },
];

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { data: stats, isLoading, refetch, isRefetching } = useDashboardStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenue sur SUTA Finance - Plateforme de gestion des factures fournisseurs
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Factures ce mois"
          value={stats?.totalInvoicesThisMonth ?? 0}
          icon={FileText}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <KpiCard
          label="En attente"
          value={stats?.pendingCount ?? 0}
          icon={Clock}
          colorClass="text-status-pending"
          bgClass="bg-status-pending/10"
        />
        <KpiCard
          label="Validées"
          value={stats?.validatedCount ?? 0}
          icon={CheckCircle2}
          colorClass="text-status-validated"
          bgClass="bg-status-validated/10"
        />
        <KpiCard
          label="Exceptions"
          value={stats?.exceptionCount ?? 0}
          icon={AlertTriangle}
          colorClass="text-status-exception"
          bgClass="bg-status-exception/10"
        />
        <KpiCard
          label="Montant à payer"
          value={formatCurrency(stats?.totalAmountToPay ?? 0)}
          icon={Euro}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <KpiCard
          label="Délai moyen"
          value={`${stats?.averageProcessingDays ?? 0}j`}
          icon={Timer}
          colorClass="text-muted-foreground"
          bgClass="bg-muted"
        />
      </div>

      {/* Priority Alerts + Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PriorityAlerts alerts={stats?.criticalAlerts ?? []} />
        <div className="lg:col-span-2">
          <InvoiceTrendChart data={stats?.invoicesByDay ?? []} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatusDistributionChart data={stats?.invoicesByStatus ?? []} />
        <TopSuppliersChart data={stats?.topSuppliers ?? []} />
        <OverdueTable invoices={stats?.overdueInvoices ?? []} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.label} 
              className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => navigate(action.to)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <action.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
