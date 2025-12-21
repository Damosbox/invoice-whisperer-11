import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceKanban } from '@/components/invoices/InvoiceKanban';
import { InvoiceListView } from '@/components/invoices/InvoiceListView';
import { AccountingExportDialog } from '@/components/export/AccountingExportDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Upload, RefreshCw, Download, LayoutGrid, List } from 'lucide-react';
import { Invoice } from '@/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function Invoices() {
  const navigate = useNavigate();
  const { data: invoices, isLoading, error, refetch } = useInvoices();
  const [exportOpen, setExportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const handleInvoiceClick = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-destructive">Erreur lors du chargement des factures</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Factures</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Chargement...' : `${invoices?.length || 0} factures`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'kanban' | 'list')}>
              <ToggleGroupItem value="kanban" aria-label="Vue Kanban">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Vue Liste">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export compta
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button size="sm" onClick={() => navigate('/upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="flex gap-4 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[280px] space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <InvoiceKanban 
          invoices={invoices || []} 
          onInvoiceClick={handleInvoiceClick}
        />
      ) : (
        <div className="p-4">
          <InvoiceListView 
            invoices={invoices || []} 
            onInvoiceClick={handleInvoiceClick}
          />
        </div>
      )}

      {/* Export Dialog */}
      <AccountingExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
