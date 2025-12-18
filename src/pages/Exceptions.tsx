import React, { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useExceptions, useResolveException } from '@/hooks/useExceptions';
import { ExceptionFilters, ExceptionFiltersState } from '@/components/exceptions/ExceptionFilters';
import { ExceptionCard } from '@/components/exceptions/ExceptionCard';

export default function Exceptions() {
  const [filters, setFilters] = useState<ExceptionFiltersState>({
    search: '',
    status: 'all',
    anomalyType: 'all',
  });

  const { data: exceptions = [], isLoading } = useExceptions();
  const resolveMutation = useResolveException();

  // Extract all unique anomaly types
  const anomalyTypes = useMemo(() => {
    const types = new Set<string>();
    exceptions.forEach((inv) => {
      inv.anomaly_types?.forEach((t) => types.add(t));
    });
    return Array.from(types);
  }, [exceptions]);

  // Filter exceptions
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((inv) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          inv.invoice_number?.toLowerCase().includes(searchLower) ||
          inv.suppliers?.name?.toLowerCase().includes(searchLower) ||
          inv.supplier_name_extracted?.toLowerCase().includes(searchLower) ||
          inv.original_filename?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && inv.status !== filters.status) {
        return false;
      }

      // Anomaly type filter
      if (filters.anomalyType !== 'all') {
        if (!inv.anomaly_types?.includes(filters.anomalyType)) {
          return false;
        }
      }

      return true;
    });
  }, [exceptions, filters]);

  const handleAction = (id: string, action: 'validate' | 'reject' | 'reprocess') => {
    resolveMutation.mutate({ id, action });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Exceptions</h1>
        <p className="text-muted-foreground">
          {exceptions.length} facture(s) avec anomalies nécessitant une attention particulière
        </p>
      </div>

      {/* Filters */}
      <ExceptionFilters
        filters={filters}
        onFiltersChange={setFilters}
        anomalyTypes={anomalyTypes}
      />

      {/* Exception List */}
      {filteredExceptions.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {exceptions.length === 0
                    ? 'Aucune exception'
                    : 'Aucun résultat'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {exceptions.length === 0
                    ? 'Les factures avec anomalies apparaîtront ici'
                    : 'Essayez de modifier vos filtres'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredExceptions.map((invoice) => (
            <ExceptionCard
              key={invoice.id}
              invoice={invoice}
              onValidate={() => handleAction(invoice.id, 'validate')}
              onReject={() => handleAction(invoice.id, 'reject')}
              onReprocess={() => handleAction(invoice.id, 'reprocess')}
              isLoading={resolveMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
