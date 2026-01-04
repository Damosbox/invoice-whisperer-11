import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock, Ban } from 'lucide-react';
import { useBankTransactions } from '@/hooks/useBankStatements';

export function ReconciliationStats() {
  const { data: transactions } = useBankTransactions();

  const stats = useMemo(() => {
    if (!transactions) {
      return { matched: 0, pending: 0, ignored: 0, total: 0, matchRate: 0 };
    }

    const matched = transactions.filter(t => t.status === 'matched').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const ignored = transactions.filter(t => t.status === 'ignored').length;
    const total = transactions.length;
    const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;

    return { matched, pending, ignored, total, matchRate };
  }, [transactions]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rapprochées</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatNumber(stats.matched)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.matchRate}% du total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En attente</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.pending)}</div>
          <p className="text-xs text-muted-foreground">
            À rapprocher
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ignorées</CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.ignored)}</div>
          <p className="text-xs text-muted-foreground">
            Non pertinentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total transactions</CardTitle>
          <AlertCircle className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          <p className="text-xs text-muted-foreground">
            Toutes les transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
