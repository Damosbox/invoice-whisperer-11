import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, AlertCircle, Banknote, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CriticalAlert } from '@/hooks/useDashboardStats';

interface PriorityAlertsProps {
  alerts: CriticalAlert[];
}

const alertConfig = {
  overdue: { icon: Clock, label: 'Retard' },
  exception: { icon: AlertTriangle, label: 'Exception' },
  anomaly: { icon: AlertCircle, label: 'Anomalie' },
  high_value: { icon: Banknote, label: 'Montant élevé' },
};

const severityStyles = {
  critical: 'border-l-status-exception bg-status-exception/5',
  warning: 'border-l-status-pending bg-status-pending/5',
  info: 'border-l-primary bg-primary/5',
};

const severityIconStyles = {
  critical: 'text-status-exception',
  warning: 'text-status-pending',
  info: 'text-primary',
};

export function PriorityAlerts({ alerts }: PriorityAlertsProps) {
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Alertes prioritaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune alerte en cours</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-exception" />
          Alertes prioritaires
          <span className="ml-auto text-xs font-normal bg-status-exception/10 text-status-exception px-2 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, index) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-lg border-l-4 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity',
                severityStyles[alert.severity]
              )}
              onClick={() => alert.link && navigate(alert.link)}
            >
              <Icon className={cn('h-5 w-5 shrink-0', severityIconStyles[alert.severity])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
