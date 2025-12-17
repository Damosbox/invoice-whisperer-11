import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  bgClass?: string;
}

export function KpiCard({ label, value, icon: Icon, trend, colorClass = 'text-primary', bgClass = 'bg-primary/10' }: KpiCardProps) {
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-lg', bgClass)}>
            <Icon className={cn('h-5 w-5', colorClass)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold truncate">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </div>
          {trend && (
            <div className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              trend.isPositive ? 'bg-status-validated/10 text-status-validated' : 'bg-status-exception/10 text-status-exception'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
