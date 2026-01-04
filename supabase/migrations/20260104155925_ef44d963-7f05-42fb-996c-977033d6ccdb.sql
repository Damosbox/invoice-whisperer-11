-- =============================================
-- 1. DELEGATION/ESCALADE: Table des délégations
-- =============================================
CREATE TABLE public.approver_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.approver_delegations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view delegations involving them"
ON public.approver_delegations FOR SELECT
USING (delegator_id = auth.uid() OR delegate_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]));

CREATE POLICY "Users can manage their own delegations"
ON public.approver_delegations FOR ALL
USING (delegator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (delegator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2. LITIGES: Table des litiges détaillés
-- =============================================
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL CHECK (category IN ('amount_mismatch', 'quality_issue', 'delivery_issue', 'duplicate', 'missing_po', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  resolution_notes TEXT,
  assigned_to UUID,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dispute communications
CREATE TABLE public.dispute_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('internal_note', 'email_sent', 'email_received', 'call', 'meeting')),
  content TEXT NOT NULL,
  email_template TEXT,
  recipients TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_communications ENABLE ROW LEVEL SECURITY;

-- Policies for disputes
CREATE POLICY "Authenticated users can view disputes"
ON public.disputes FOR SELECT USING (true);

CREATE POLICY "Comptables and above can manage disputes"
ON public.disputes FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]));

-- Policies for communications
CREATE POLICY "Authenticated users can view dispute communications"
ON public.dispute_communications FOR SELECT USING (true);

CREATE POLICY "Comptables and above can manage dispute communications"
ON public.dispute_communications FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]));

-- =============================================
-- 3. FOURNISSEURS: Colonnes pour scoring
-- =============================================
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
ADD COLUMN IF NOT EXISTS avg_payment_delay_days NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_invoices_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS disputed_invoices_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_payments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_invoice_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quality_rating NUMERIC DEFAULT 3 CHECK (quality_rating >= 0 AND quality_rating <= 5);

-- =============================================
-- 4. OCR QUALITY: Vue pour stats OCR
-- =============================================
CREATE OR REPLACE VIEW public.ocr_quality_stats AS
SELECT 
  s.id as supplier_id,
  s.name as supplier_name,
  COUNT(i.id) as total_invoices,
  AVG(i.ocr_confidence_score) as avg_confidence,
  COUNT(CASE WHEN i.ocr_confidence_score < 0.7 THEN 1 END) as low_confidence_count,
  COUNT(CASE WHEN i.status = 'a_valider_extraction' THEN 1 END) as pending_validation_count,
  COUNT(st.id) as template_corrections_count,
  MAX(i.created_at) as last_invoice_date
FROM public.suppliers s
LEFT JOIN public.invoices i ON i.supplier_id = s.id
LEFT JOIN public.supplier_templates st ON st.supplier_id = s.id
GROUP BY s.id, s.name;

-- Triggers for updated_at
CREATE TRIGGER update_approver_delegations_updated_at
BEFORE UPDATE ON public.approver_delegations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_delegations_delegator ON public.approver_delegations(delegator_id);
CREATE INDEX idx_delegations_delegate ON public.approver_delegations(delegate_id);
CREATE INDEX idx_delegations_active_dates ON public.approver_delegations(start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_disputes_invoice ON public.disputes(invoice_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_dispute_comms_dispute ON public.dispute_communications(dispute_id);