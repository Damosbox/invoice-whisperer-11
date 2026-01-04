import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileSpreadsheet, Eye, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { BankStatement } from '@/hooks/useBankStatements';

interface BankStatementsTableProps {
  statements: BankStatement[];
  isLoading: boolean;
  onViewStatement: (id: string) => void;
}

export function BankStatementsTable({
  statements,
  isLoading,
  onViewStatement,
}: BankStatementsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'csv':
        return <Badge variant="outline">CSV</Badge>;
      case 'ofx':
        return <Badge variant="secondary">OFX</Badge>;
      case 'mt940':
        return <Badge>MT940</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Traité</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Aucun relevé importé</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Importez votre premier relevé bancaire pour commencer la réconciliation
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fichier</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Période</TableHead>
            <TableHead className="text-right">Débits</TableHead>
            <TableHead className="text-right">Crédits</TableHead>
            <TableHead className="text-center">Transactions</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Importé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((statement) => (
            <TableRow key={statement.id}>
              <TableCell className="font-medium">
                {statement.file_name}
              </TableCell>
              <TableCell>
                {getSourceBadge(statement.source)}
              </TableCell>
              <TableCell>
                {statement.period_start && statement.period_end ? (
                  <span className="text-sm">
                    {format(new Date(statement.period_start), 'dd/MM/yy', { locale: fr })}
                    {' → '}
                    {format(new Date(statement.period_end), 'dd/MM/yy', { locale: fr })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right text-destructive">
                {formatCurrency(statement.total_debits)}
              </TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrency(statement.total_credits)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{statement.transactions_count}</Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(statement.status)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(statement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewStatement(statement.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
