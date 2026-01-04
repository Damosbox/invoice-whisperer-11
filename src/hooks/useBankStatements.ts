import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankStatement {
  id: string;
  file_name: string;
  source: string;
  bank_account: string | null;
  period_start: string | null;
  period_end: string | null;
  total_debits: number;
  total_credits: number;
  transactions_count: number;
  status: string;
  imported_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  statement_id: string;
  transaction_date: string;
  value_date: string | null;
  amount: number;
  direction: 'debit' | 'credit';
  description: string | null;
  bank_reference: string | null;
  counterparty_name: string | null;
  counterparty_iban: string | null;
  matched_invoice_id: string | null;
  matched_payment_id: string | null;
  match_confidence: number | null;
  match_method: string | null;
  matched_by: string | null;
  matched_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined data
  invoice?: {
    id: string;
    invoice_number: string | null;
    amount_ttc: number | null;
    supplier_name_extracted: string | null;
  };
}

export interface CSVMapping {
  date: string;
  valueDate?: string;
  amount: string;
  description: string;
  reference?: string;
  counterparty?: string;
  iban?: string;
}

export function useBankStatements() {
  return useQuery({
    queryKey: ['bank-statements'],
    queryFn: async (): Promise<BankStatement[]> => {
      const { data, error } = await supabase
        .from('bank_statements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useBankTransactions(statementId?: string) {
  return useQuery({
    queryKey: ['bank-transactions', statementId],
    queryFn: async (): Promise<BankTransaction[]> => {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          invoice:invoices(id, invoice_number, amount_ttc, supplier_name_extracted)
        `)
        .order('transaction_date', { ascending: false });

      if (statementId) {
        query = query.eq('statement_id', statementId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        direction: t.direction as 'debit' | 'credit',
        invoice: t.invoice as BankTransaction['invoice'],
      }));
    },
    enabled: statementId !== undefined || statementId === undefined,
  });
}

export function useUnmatchedTransactions() {
  return useQuery({
    queryKey: ['bank-transactions', 'unmatched'],
    queryFn: async (): Promise<BankTransaction[]> => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('status', 'pending')
        .eq('direction', 'debit')
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        direction: t.direction as 'debit' | 'credit',
      }));
    },
  });
}

export function useCreateBankStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileName,
      source,
      bankAccount,
      periodStart,
      periodEnd,
      transactions,
    }: {
      fileName: string;
      source: string;
      bankAccount?: string;
      periodStart?: string;
      periodEnd?: string;
      transactions: Array<{
        transaction_date: string;
        value_date?: string;
        amount: number;
        direction: 'debit' | 'credit';
        description?: string;
        bank_reference?: string;
        counterparty_name?: string;
        counterparty_iban?: string;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate totals
      const totalDebits = transactions
        .filter(t => t.direction === 'debit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const totalCredits = transactions
        .filter(t => t.direction === 'credit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Create statement
      const { data: statement, error: stmtError } = await supabase
        .from('bank_statements')
        .insert({
          file_name: fileName,
          source,
          bank_account: bankAccount,
          period_start: periodStart,
          period_end: periodEnd,
          total_debits: totalDebits,
          total_credits: totalCredits,
          transactions_count: transactions.length,
          status: 'processed',
          imported_by: user?.id,
        })
        .select()
        .single();

      if (stmtError) throw stmtError;

      // Create transactions
      const transactionsToInsert = transactions.map(t => ({
        statement_id: statement.id,
        transaction_date: t.transaction_date,
        value_date: t.value_date,
        amount: Math.abs(t.amount),
        direction: t.direction,
        description: t.description,
        bank_reference: t.bank_reference,
        counterparty_name: t.counterparty_name,
        counterparty_iban: t.counterparty_iban,
        status: 'pending',
      }));

      const { error: txError } = await supabase
        .from('bank_transactions')
        .insert(transactionsToInsert);

      if (txError) throw txError;

      return statement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Relevé bancaire importé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur d'import: ${error.message}`);
    },
  });
}

export function useMatchTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      invoiceId,
      confidence,
      method = 'manual',
    }: {
      transactionId: string;
      invoiceId: string;
      confidence?: number;
      method?: 'auto' | 'manual';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('bank_transactions')
        .update({
          matched_invoice_id: invoiceId,
          match_confidence: confidence,
          match_method: method,
          matched_by: user?.id,
          matched_at: new Date().toISOString(),
          status: 'matched',
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Transaction rapprochée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUnmatchTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update({
          matched_invoice_id: null,
          matched_payment_id: null,
          match_confidence: null,
          match_method: null,
          matched_by: null,
          matched_at: null,
          status: 'pending',
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Rapprochement annulé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useIgnoreTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update({ status: 'ignored' })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Transaction ignorée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
