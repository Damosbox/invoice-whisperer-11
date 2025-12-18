import { useState } from 'react';
import { Plus, Search, Upload, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { SupplierImportDialog } from '@/components/suppliers/SupplierImportDialog';
import { Tables } from '@/integrations/supabase/types';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Tables<'suppliers'> | null>(null);

  const { data: suppliers, isLoading } = useSuppliers(debouncedSearch);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Simple debounce
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  const handleEdit = (supplier: Tables<'suppliers'>) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingSupplier(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground">
            Gérez votre référentiel fournisseurs ({suppliers?.length || 0} enregistrés)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, identifiant, email..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : suppliers && suppliers.length > 0 ? (
        <SupplierTable suppliers={suppliers} onEdit={handleEdit} />
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Aucun fournisseur</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {debouncedSearch
                    ? 'Aucun fournisseur ne correspond à votre recherche'
                    : 'Ajoutez des fournisseurs manuellement ou importez-les via CSV'}
                </p>
              </div>
              {!debouncedSearch && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer CSV
                  </Button>
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <SupplierForm
        open={formOpen}
        onOpenChange={handleFormClose}
        supplier={editingSupplier}
      />
      <SupplierImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
