import { useState } from 'react';
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useImportPurchaseOrders,
  PurchaseOrderWithSupplier,
} from '@/hooks/usePurchaseOrders';
import { PurchaseOrderTable } from '@/components/purchase-orders/PurchaseOrderTable';
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm';
import { PurchaseOrderImportDialog } from '@/components/purchase-orders/PurchaseOrderImportDialog';

export default function PurchaseOrders() {
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrderWithSupplier | null>(null);

  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();
  const importMutation = useImportPurchaseOrders();

  const handleAdd = () => {
    setEditingPO(null);
    setFormOpen(true);
  };

  const handleEdit = (po: PurchaseOrderWithSupplier) => {
    setEditingPO(po);
    setFormOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (editingPO) {
      updateMutation.mutate(
        { id: editingPO.id, ...data },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleImport = (data: any[]) => {
    importMutation.mutate(data, { onSuccess: () => setImportOpen(false) });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bons de commande</h1>
        <p className="text-muted-foreground">
          Référentiel des bons de commande pour le rapprochement automatique
        </p>
      </div>

      <PurchaseOrderTable
        purchaseOrders={purchaseOrders}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
        onAdd={handleAdd}
        onImport={() => setImportOpen(true)}
      />

      <PurchaseOrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        purchaseOrder={editingPO}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <PurchaseOrderImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        isLoading={importMutation.isPending}
      />
    </div>
  );
}
