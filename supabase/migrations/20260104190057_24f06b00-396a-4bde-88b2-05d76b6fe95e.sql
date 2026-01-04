-- Table pour les relevés bancaires importés
CREATE TABLE public.bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'csv', -- csv, ofx, mt940
  bank_account TEXT,
  period_start DATE,
  period_end DATE,
  total_debits NUMERIC DEFAULT 0,
  total_credits NUMERIC DEFAULT 0,
  transactions_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, error
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les transactions bancaires
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount NUMERIC NOT NULL,
  direction TEXT NOT NULL DEFAULT 'debit', -- debit, credit
  description TEXT,
  bank_reference TEXT,
  counterparty_name TEXT,
  counterparty_iban TEXT,
  matched_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  matched_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  match_confidence NUMERIC,
  match_method TEXT, -- auto, manual
  matched_by UUID REFERENCES auth.users(id),
  matched_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, matched, orphan, ignored
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_bank_transactions_statement ON public.bank_transactions(statement_id);
CREATE INDEX idx_bank_transactions_status ON public.bank_transactions(status);
CREATE INDEX idx_bank_transactions_date ON public.bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_matched_invoice ON public.bank_transactions(matched_invoice_id);

-- Trigger pour updated_at sur bank_statements
CREATE TRIGGER update_bank_statements_updated_at
  BEFORE UPDATE ON public.bank_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur bank_transactions
CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS pour bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bank statements"
  ON public.bank_statements
  FOR SELECT
  USING (true);

CREATE POLICY "DAF and Admin can manage bank statements"
  ON public.bank_statements
  FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]));

-- RLS pour bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bank transactions"
  ON public.bank_transactions
  FOR SELECT
  USING (true);

CREATE POLICY "DAF and Admin can manage bank transactions"
  ON public.bank_transactions
  FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]));