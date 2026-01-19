import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceKanban } from '@/components/invoices/InvoiceKanban';
import { InvoiceListView } from '@/components/invoices/InvoiceListView';
import { AccountingExportDialog } from '@/components/export/AccountingExportDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Upload, RefreshCw, Download, LayoutGrid, List, X, Clock, Search } from 'lucide-react';
import { Invoice, InvoiceStatus } from '@/types';

const STATUS_OPTIONS: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'a_valider_extraction', label: 'À valider (OCR)' },
  { value: 'a_rapprocher', label: 'À rapprocher' },
  { value: 'a_approuver', label: 'À approuver' },
  { value: 'exception', label: 'Exception' },
  { value: 'litige', label: 'Litige' },
  { value: 'prete_comptabilisation', label: 'Prête compta' },
  { value: 'comptabilisee', label: 'Comptabilisée' },
];

export default function Invoices() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get('filter');
  const statusFilter = searchParams.get('status') as InvoiceStatus | null;
  const { data: invoices, isLoading, error, refetch } = useInvoices();
  const [exportOpen, setExportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter invoices based on active filters and search
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    let result = invoices;
    
    // Overdue filter
    if (activeFilter === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(inv => {
        if (!inv.due_date) return false;
        const dueDate = new Date(inv.due_date);
        const isOverdue = dueDate < today;
        const isPending = !['comptabilisee', 'prete_comptabilisation'].includes(inv.status || '');
        return isOverdue && isPending;
      });
    }
    
    // Status filter
    if (statusFilter) {
      result = result.filter(inv => inv.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.supplier_name_extracted?.toLowerCase().includes(query) ||
        inv.supplier?.name?.toLowerCase().includes(query) ||
        inv.po_number_extracted?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [invoices, activeFilter, statusFilter, searchQuery]);

  const clearFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filter');
    setSearchParams(newParams);
  };

  const handleStatusFilterChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', value);
    }
    setSearchParams(newParams);
  };

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
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold">Factures</h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Chargement...' : `${filteredInvoices.length} facture${filteredInvoices.length > 1 ? 's' : ''}`}
                </p>
              </div>
              {activeFilter === 'overdue' && (
                <Badge variant="destructive" className="flex items-center gap-1.5 h-7 px-3">
                  <Clock className="h-3.5 w-3.5" />
                  Factures en retard
                  <button 
                    onClick={clearFilter}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    aria-label="Supprimer le filtre"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Filters row */}
        <div className="flex items-center gap-3 px-4 pb-4">
          {/* View mode tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Liste
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          invoices={filteredInvoices} 
          onInvoiceClick={handleInvoiceClick}
        />
      ) : (
        <div className="p-4">
          <InvoiceListView 
            invoices={filteredInvoices} 
            onInvoiceClick={handleInvoiceClick}
          />
        </div>
      )}

      {/* Export Dialog */}
      <AccountingExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
