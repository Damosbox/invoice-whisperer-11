import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PurchaseOrderWithSupplier } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';

const purchaseOrderSchema = z.object({
  po_number: z.string().min(1, 'Le numéro de BC est requis').max(50),
  supplier_id: z.string().optional().nullable(),
  amount_ht: z.coerce.number().min(0, 'Le montant HT doit être positif'),
  amount_tva: z.coerce.number().min(0, 'Le montant TVA doit être positif').optional(),
  amount_ttc: z.coerce.number().min(0, 'Le montant TTC doit être positif'),
  currency: z.string().default('EUR'),
  description: z.string().max(500).optional(),
  status: z.string().default('actif'),
  order_date: z.string().min(1, 'La date de commande est requise'),
  expected_delivery_date: z.string().optional(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder?: PurchaseOrderWithSupplier | null;
  onSubmit: (data: PurchaseOrderFormValues) => void;
  isLoading?: boolean;
}

const getDefaultValues = (purchaseOrder?: PurchaseOrderWithSupplier | null): PurchaseOrderFormValues => ({
  po_number: purchaseOrder?.po_number || '',
  supplier_id: purchaseOrder?.supplier_id || null,
  amount_ht: purchaseOrder?.amount_ht || 0,
  amount_tva: purchaseOrder?.amount_tva || 0,
  amount_ttc: purchaseOrder?.amount_ttc || 0,
  currency: purchaseOrder?.currency || 'EUR',
  description: purchaseOrder?.description || '',
  status: purchaseOrder?.status || 'actif',
  order_date: purchaseOrder?.order_date || new Date().toISOString().split('T')[0],
  expected_delivery_date: purchaseOrder?.expected_delivery_date || '',
});

export function PurchaseOrderForm({
  open,
  onOpenChange,
  purchaseOrder,
  onSubmit,
  isLoading,
}: PurchaseOrderFormProps) {
  const { data: suppliers } = useSuppliers();
  
  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: getDefaultValues(purchaseOrder),
  });

  // Synchronise le formulaire quand la modale s'ouvre ou quand le BC change
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(purchaseOrder));
    }
  }, [open, purchaseOrder?.id, form]);

  const handleSubmit = (data: PurchaseOrderFormValues) => {
    onSubmit(data);
  };

  // Auto-calculate TTC when HT or TVA changes
  const watchHT = form.watch('amount_ht');
  const watchTVA = form.watch('amount_tva');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchaseOrder ? 'Modifier le bon de commande' : 'Nouveau bon de commande'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="po_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de BC *</FormLabel>
                  <FormControl>
                    <Input placeholder="BC-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fournisseur</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount_ht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant HT *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_tva"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant TVA</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_ttc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant TTC *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Devise</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de commande *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de livraison prévue</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="cloture">Clôturé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description du bon de commande..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : purchaseOrder ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
