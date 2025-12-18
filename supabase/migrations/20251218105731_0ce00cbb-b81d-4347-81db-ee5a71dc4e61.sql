-- Table des règles d'approbation
CREATE TABLE public.approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount NUMERIC DEFAULT 0,
  max_amount NUMERIC,
  is_critical_supplier BOOLEAN DEFAULT false,
  required_levels INTEGER NOT NULL DEFAULT 1,
  level_1_role app_role NOT NULL DEFAULT 'comptable',
  level_2_role app_role,
  level_3_role app_role,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table d'historique des approbations
CREATE TABLE public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  required_role app_role NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter colonnes à invoices pour le workflow
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS approval_rule_id UUID REFERENCES public.approval_rules(id),
ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_approval_levels INTEGER DEFAULT 1;

-- Index pour performances
CREATE INDEX idx_approval_history_invoice ON public.approval_history(invoice_id);
CREATE INDEX idx_approval_rules_priority ON public.approval_rules(priority DESC, is_active);

-- RLS pour approval_rules
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approval rules"
ON public.approval_rules FOR SELECT
USING (true);

CREATE POLICY "Admin and DAF can manage approval rules"
ON public.approval_rules FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role]));

-- RLS pour approval_history
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approval history"
ON public.approval_history FOR SELECT
USING (true);

CREATE POLICY "Users with approval roles can insert history"
ON public.approval_history FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]));

CREATE POLICY "Users with approval roles can update history"
ON public.approval_history FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'daf'::app_role, 'dg'::app_role, 'comptable'::app_role]));

-- Trigger pour updated_at
CREATE TRIGGER update_approval_rules_updated_at
BEFORE UPDATE ON public.approval_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer des règles par défaut
INSERT INTO public.approval_rules (name, description, min_amount, max_amount, is_critical_supplier, required_levels, level_1_role, level_2_role, level_3_role, priority) VALUES
('Petits montants', 'Factures < 1000€ - 1 niveau', 0, 1000, false, 1, 'comptable', NULL, NULL, 10),
('Montants moyens', 'Factures 1000-10000€ - 2 niveaux', 1000, 10000, false, 2, 'comptable', 'daf', NULL, 20),
('Gros montants', 'Factures > 10000€ - 3 niveaux', 10000, NULL, false, 3, 'comptable', 'daf', 'dg', 30),
('Fournisseur critique', 'Tous montants fournisseur critique - 2 niveaux minimum', 0, NULL, true, 2, 'comptable', 'daf', NULL, 50);
