import { useState, useEffect } from 'react';
import { Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface InvoiceEditFormProps {
  invoice: Invoice;
  onSave: (updates: Partial<Invoice>) => void;
  isSaving: boolean;
}

export function InvoiceEditForm({ invoice, onSave, isSaving }: InvoiceEditFormProps) {
  const [formData, setFormData] = useState({
    invoice_number: invoice.invoice_number || '',
    supplier_name_extracted: invoice.supplier_name_extracted || '',
    issue_date: invoice.issue_date || '',
    due_date: invoice.due_date || '',
    amount_ht: invoice.amount_ht?.toString() || '',
    amount_tva: invoice.amount_tva?.toString() || '',
    amount_ttc: invoice.amount_ttc?.toString() || '',
    currency: invoice.currency || 'EUR',
    po_number_extracted: invoice.po_number_extracted || '',
    bl_number_extracted: invoice.bl_number_extracted || '',
    iban_extracted: invoice.iban_extracted || '',
  });

  // INV-06: Reset form when invoice changes
  useEffect(() => {
    setFormData({
      invoice_number: invoice.invoice_number || '',
      supplier_name_extracted: invoice.supplier_name_extracted || '',
      issue_date: invoice.issue_date || '',
      due_date: invoice.due_date || '',
      amount_ht: invoice.amount_ht?.toString() || '',
      amount_tva: invoice.amount_tva?.toString() || '',
      amount_ttc: invoice.amount_ttc?.toString() || '',
      currency: invoice.currency || 'EUR',
      po_number_extracted: invoice.po_number_extracted || '',
      bl_number_extracted: invoice.bl_number_extracted || '',
      iban_extracted: invoice.iban_extracted || '',
    });
  }, [invoice]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<Invoice> = {
      invoice_number: formData.invoice_number || null,
      supplier_name_extracted: formData.supplier_name_extracted || null,
      issue_date: formData.issue_date || null,
      due_date: formData.due_date || null,
      amount_ht: formData.amount_ht ? parseFloat(formData.amount_ht) : null,
      amount_tva: formData.amount_tva ? parseFloat(formData.amount_tva) : null,
      amount_ttc: formData.amount_ttc ? parseFloat(formData.amount_ttc) : null,
      currency: formData.currency,
      po_number_extracted: formData.po_number_extracted || null,
      bl_number_extracted: formData.bl_number_extracted || null,
      iban_extracted: formData.iban_extracted || null,
    };

    onSave(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Identification */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Identification
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="invoice_number" className="text-xs">N° Facture</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
              placeholder="FAC-2024-001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier_name" className="text-xs">Fournisseur</Label>
            <Input
              id="supplier_name"
              value={formData.supplier_name_extracted}
              onChange={(e) => handleChange('supplier_name_extracted', e.target.value)}
              placeholder="Nom du fournisseur"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="issue_date" className="text-xs">Date émission</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => handleChange('issue_date', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due_date" className="text-xs">Date échéance</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Montants */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Montants
        </h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount_ht" className="text-xs">Montant HT</Label>
            <Input
              id="amount_ht"
              type="number"
              step="0.01"
              value={formData.amount_ht}
              onChange={(e) => handleChange('amount_ht', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount_tva" className="text-xs">TVA</Label>
            <Input
              id="amount_tva"
              type="number"
              step="0.01"
              value={formData.amount_tva}
              onChange={(e) => handleChange('amount_tva', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount_ttc" className="text-xs">Montant TTC</Label>
            <Input
              id="amount_ttc"
              type="number"
              step="0.01"
              value={formData.amount_ttc}
              onChange={(e) => handleChange('amount_ttc', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="w-24 space-y-1.5">
          <Label htmlFor="currency" className="text-xs">Devise</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            placeholder="EUR"
          />
        </div>
      </div>

      {/* Références */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Références
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="po_number" className="text-xs">N° Bon de Commande</Label>
            <Input
              id="po_number"
              value={formData.po_number_extracted}
              onChange={(e) => handleChange('po_number_extracted', e.target.value)}
              placeholder="BC-2024-001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bl_number" className="text-xs">N° Bon de Livraison</Label>
            <Input
              id="bl_number"
              value={formData.bl_number_extracted}
              onChange={(e) => handleChange('bl_number_extracted', e.target.value)}
              placeholder="BL-2024-001"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="iban" className="text-xs">IBAN</Label>
          <Input
            id="iban"
            value={formData.iban_extracted}
            onChange={(e) => handleChange('iban_extracted', e.target.value)}
            placeholder="FR76 1234 5678 9012 3456 7890 123"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
