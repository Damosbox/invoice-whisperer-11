import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Clock, FileText } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export function CopilotContextCard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Contexte analysé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Contexte analysé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Factures totales:</span>
          <span className="font-medium">{stats?.totalInvoicesThisMonth || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Délai moyen:</span>
          <span className="font-medium">{stats?.averageProcessingDays?.toFixed(1) || '—'} jours</span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Données mises à jour en temps réel
        </div>
      </CardContent>
    </Card>
  );
}
