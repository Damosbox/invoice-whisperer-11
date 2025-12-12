import { FileText, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoiceKanban } from '@/components/invoices/InvoiceKanban';
import { useInvoices } from '@/hooks/useInvoices';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Invoice } from '@/types';

export default function Invoices() {
  const navigate = useNavigate();
  const { data: invoices, isLoading, error, refetch } = useInvoices();

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
              <h1 className="text-xl font-semibold">Inbox Factures</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Chargement...' : `${invoices?.length || 0} factures`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Kanban Board */}
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
      ) : (
        <InvoiceKanban 
          invoices={invoices || []} 
          onInvoiceClick={handleInvoiceClick}
        />
      )}
    </div>
  );
}
