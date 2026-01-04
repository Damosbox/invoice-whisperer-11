import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ArrowRight, 
  Check, 
  X, 
  Search, 
  Link2, 
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUnmatchedTransactions, useMatchTransaction, useIgnoreTransaction, type BankTransaction } from '@/hooks/useBankStatements';
import { useInvoices } from '@/hooks/useInvoices';
import type { Invoice } from '@/types';

export function MatchingWorkbench() {
  const { data: transactions, isLoading: transactionsLoading } = useUnmatchedTransactions();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const matchTransaction = useMatchTransaction();
  const ignoreTransaction = useIgnoreTransaction();

  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [searchInvoice, setSearchInvoice] = useState('');
  const [confirmMatch, setConfirmMatch] = useState<{
    transaction: BankTransaction;
    invoice: Invoice;
    confidence: number;
  } | null>(null);

  // Unpaid invoices (ready to be paid or waiting for approval)
  const unpaidInvoices = useMemo(() => {
    return (invoices || []).filter(
      inv => inv.status === 'prete_comptabilisation' || inv.status === 'a_approuver'
    );
  }, [invoices]);

  // Filter invoices by search
  const filteredInvoices = useMemo(() => {
    if (!searchInvoice) return unpaidInvoices;
    const search = searchInvoice.toLowerCase();
    return unpaidInvoices.filter(inv => 
      inv.invoice_number?.toLowerCase().includes(search) ||
      inv.supplier_name_extracted?.toLowerCase().includes(search) ||
      inv.supplier?.name?.toLowerCase().includes(search) ||
      inv.amount_ttc?.toString().includes(search)
    );
  }, [unpaidInvoices, searchInvoice]);

  // Calculate match suggestions for selected transaction
  const suggestions = useMemo(() => {
    if (!selectedTransaction || !unpaidInvoices.length) return [];

    return unpaidInvoices
      .map(invoice => {
        let confidence = 0;
        const reasons: string[] = [];

        // Amount match (within 5% tolerance)
        const amountDiff = Math.abs((invoice.amount_ttc || 0) - selectedTransaction.amount);
        const amountTolerance = selectedTransaction.amount * 0.05;
        
        if (amountDiff === 0) {
          confidence += 50;
          reasons.push('Montant exact');
        } else if (amountDiff <= amountTolerance) {
          confidence += 30;
          reasons.push('Montant proche');
        }

        // Supplier name match
        const counterparty = selectedTransaction.counterparty_name?.toLowerCase() || '';
        const supplierName = (invoice.supplier?.name || invoice.supplier_name_extracted || '').toLowerCase();
        
        if (counterparty && supplierName) {
          if (counterparty.includes(supplierName) || supplierName.includes(counterparty)) {
            confidence += 30;
            reasons.push('Fournisseur correspondant');
          }
        }

        // Reference match
        const bankRef = selectedTransaction.bank_reference?.toLowerCase() || '';
        const description = selectedTransaction.description?.toLowerCase() || '';
        const invoiceNumber = invoice.invoice_number?.toLowerCase() || '';
        
        if (invoiceNumber && (bankRef.includes(invoiceNumber) || description.includes(invoiceNumber))) {
          confidence += 20;
          reasons.push('Référence facture trouvée');
        }

        return {
          invoice,
          confidence,
          reasons,
        };
      })
      .filter(s => s.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }, [selectedTransaction, unpaidInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleMatch = (invoice: Invoice, confidence: number) => {
    if (!selectedTransaction) return;
    setConfirmMatch({ transaction: selectedTransaction, invoice, confidence });
  };

  const confirmMatchAction = async () => {
    if (!confirmMatch) return;

    await matchTransaction.mutateAsync({
      transactionId: confirmMatch.transaction.id,
      invoiceId: confirmMatch.invoice.id,
      confidence: confirmMatch.confidence,
      method: 'manual',
    });

    setConfirmMatch(null);
    setSelectedTransaction(null);
  };

  const handleIgnore = async (transaction: BankTransaction) => {
    await ignoreTransaction.mutateAsync(transaction.id);
    if (selectedTransaction?.id === transaction.id) {
      setSelectedTransaction(null);
    }
  };

  const isLoading = transactionsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions non matchées */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Transactions à rapprocher
              <Badge variant="secondary">{transactions?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 pr-4">
                {(transactions || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Toutes les transactions sont rapprochées !</p>
                  </div>
                ) : (
                  transactions?.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTransaction?.id === tx.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-lg text-destructive">
                            -{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIgnore(tx);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {tx.description && (
                        <p className="text-sm mt-2 line-clamp-2">{tx.description}</p>
                      )}
                      {tx.counterparty_name && (
                        <Badge variant="outline" className="mt-2">
                          {tx.counterparty_name}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Factures et suggestions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {selectedTransaction ? 'Suggestions de rapprochement' : 'Factures en attente'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une facture..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[540px]">
              <div className="space-y-2 pr-4">
                {/* Show suggestions if transaction selected */}
                {selectedTransaction && suggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Suggestions automatiques
                    </p>
                    {suggestions.map((sugg) => (
                      <div
                        key={sugg.invoice.id}
                        className="p-4 border rounded-lg mb-2 bg-green-50 dark:bg-green-950/20 border-green-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {sugg.invoice.invoice_number || 'Sans numéro'}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={
                                  sugg.confidence >= 70 
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : sugg.confidence >= 40
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                    : 'bg-orange-100 text-orange-700 border-orange-300'
                                }
                              >
                                {sugg.confidence}% confiance
                              </Badge>
                            </div>
                            <p className="text-lg font-semibold">
                              {formatCurrency(sugg.invoice.amount_ttc || 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sugg.invoice.supplier?.name || sugg.invoice.supplier_name_extracted}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sugg.reasons.map((reason, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleMatch(sugg.invoice, sugg.confidence)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Rapprocher
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All invoices */}
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Toutes les factures ({filteredInvoices.length})
                </p>
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {invoice.invoice_number || 'Sans numéro'}
                        </p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(invoice.amount_ttc || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.supplier?.name || invoice.supplier_name_extracted}
                        </p>
                        {invoice.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Échéance: {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                      {selectedTransaction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMatch(invoice, 0)}
                        >
                          Rapprocher
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredInvoices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune facture trouvée</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmMatch} onOpenChange={() => setConfirmMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le rapprochement</DialogTitle>
            <DialogDescription>
              Voulez-vous rapprocher cette transaction avec la facture sélectionnée ?
            </DialogDescription>
          </DialogHeader>

          {confirmMatch && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Transaction</p>
                  <p className="font-medium text-destructive">
                    -{formatCurrency(confirmMatch.transaction.amount)}
                  </p>
                  <p className="text-sm">
                    {format(new Date(confirmMatch.transaction.transaction_date), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Facture</p>
                  <p className="font-medium">
                    {confirmMatch.invoice.invoice_number || 'Sans numéro'}
                  </p>
                  <p className="font-medium">
                    {formatCurrency(confirmMatch.invoice.amount_ttc || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMatch(null)}>
              Annuler
            </Button>
            <Button 
              onClick={confirmMatchAction}
              disabled={matchTransaction.isPending}
            >
              {matchTransaction.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
