import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DailyCount } from '@/hooks/useDashboardStats';

interface InvoiceTrendChartProps {
  data: DailyCount[];
}

export function InvoiceTrendChart({ data }: InvoiceTrendChartProps) {
  const chartData = data.map(item => ({
    ...item,
    dateLabel: format(parseISO(item.date), 'dd MMM', { locale: fr }),
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Évolution des factures (30 jours)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
          Aucune donnée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Évolution des factures (30 jours)</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="dateLabel" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              allowDecimals={false}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} facture(s)`, 'Nombre']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
