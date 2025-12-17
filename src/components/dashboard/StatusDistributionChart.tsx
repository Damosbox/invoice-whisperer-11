import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatusCount } from '@/hooks/useDashboardStats';

interface StatusDistributionChartProps {
  data: StatusCount[];
}

const STATUS_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle',
  a_valider_extraction: 'À valider OCR',
  a_rapprocher: 'À rapprocher',
  a_approuver: 'À approuver',
  exception: 'Exception',
  litige: 'Litige',
  prete_comptabilisation: 'Prête compta.',
  comptabilisee: 'Comptabilisée',
};

const STATUS_COLORS: Record<string, string> = {
  nouvelle: 'hsl(var(--primary))',
  a_valider_extraction: 'hsl(210, 80%, 55%)',
  a_rapprocher: 'hsl(200, 70%, 50%)',
  a_approuver: 'hsl(var(--status-pending))',
  exception: 'hsl(var(--status-exception))',
  litige: 'hsl(0, 60%, 45%)',
  prete_comptabilisation: 'hsl(var(--status-validated))',
  comptabilisee: 'hsl(150, 60%, 40%)',
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const chartData = data.map(item => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Répartition par statut</CardTitle>
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
        <CardTitle className="text-base">Répartition par statut</CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted))'}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} facture(s)`, '']}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => <span className="text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
