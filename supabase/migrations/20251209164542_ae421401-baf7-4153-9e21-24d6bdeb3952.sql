-- ============================================
-- PHASE 1: STRUCTURE DE DONNÉES SUTA FINANCE
-- ============================================

-- 1. ENUM pour les rôles utilisateurs
CREATE TYPE public.app_role AS ENUM ('admin', 'daf', 'dg', 'comptable', 'auditeur');

-- 2. ENUM pour les statuts de facture
CREATE TYPE public.invoice_status AS ENUM (
  'nouvelle',
  'a_valider_extraction',
  'a_rapprocher',
  'a_approuver',
  'exception',
  'litige',
  'prete_comptabilisation',
  'comptabilisee'
);

-- 3. ENUM pour les statuts de matching
CREATE TYPE public.match_status AS ENUM (
  'match_automatique',
  'match_probable',
  'match_incertain',
  'aucun_match'
);

-- ============================================
-- TABLES PRINCIPALES
-- ============================================

-- Table des rôles utilisateurs (sécurité)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table des fournisseurs
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  identifier TEXT, -- SIRET, numéro fournisseur interne
  email TEXT,
  phone TEXT,
  address TEXT,
  iban TEXT,
  bic TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  is_critical BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table des bons de commande (PO)
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  amount_ht DECIMAL(15, 2) NOT NULL,
  amount_tva DECIMAL(15, 2) DEFAULT 0,
  amount_ttc DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'actif',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table des bons de livraison (BL)
CREATE TABLE public.delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bl_number TEXT NOT NULL UNIQUE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  delivery_date DATE NOT NULL,
  description TEXT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table principale des factures
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations du document
  file_path TEXT NOT NULL,
  file_hash TEXT, -- Pour détection doublons
  original_filename TEXT,
  file_size INTEGER,
  
  -- Champs extraits par OCR
  invoice_number TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name_extracted TEXT, -- Nom extrait avant matching
  
  -- Dates
  issue_date DATE,
  due_date DATE,
  received_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Montants
  amount_ht DECIMAL(15, 2),
  amount_tva DECIMAL(15, 2),
  amount_ttc DECIMAL(15, 2),
  currency TEXT DEFAULT 'EUR',
  
  -- Références extraites
  po_number_extracted TEXT,
  bl_number_extracted TEXT,
  iban_extracted TEXT,
  
  -- Données OCR brutes
  ocr_raw_text TEXT,
  ocr_fields JSONB, -- Champs extraits avec scores de confiance
  ocr_confidence_score DECIMAL(5, 2), -- Score global
  
  -- Matching
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  delivery_note_id UUID REFERENCES public.delivery_notes(id) ON DELETE SET NULL,
  match_status match_status DEFAULT 'aucun_match',
  match_score DECIMAL(5, 2),
  match_details JSONB,
  
  -- Workflow
  status invoice_status DEFAULT 'nouvelle',
  current_approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Anomalies
  has_anomalies BOOLEAN DEFAULT false,
  anomaly_types TEXT[], -- Types d'anomalies détectées
  anomaly_details JSONB,
  
  -- Comptabilisation
  accounting_entry_ref TEXT,
  exported_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  source TEXT DEFAULT 'upload', -- upload, email, sftp
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table des smart templates fournisseurs (apprentissage OCR)
CREATE TABLE public.supplier_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL, -- ex: 'invoice_number', 'amount_ttc'
  extraction_rules JSONB, -- Règles/patterns pour ce champ
  corrections_count INTEGER DEFAULT 0,
  last_correction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(supplier_id, field_name)
);

-- Table des logs d'audit
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'invoice', 'supplier', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'rejected', etc.
  changes JSONB,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table des imports (journalisation)
CREATE TABLE public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'upload', 'email', 'sftp'
  source_details JSONB, -- ex: email sender, sftp path
  file_name TEXT NOT NULL,
  file_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, success, failed, duplicate
  error_message TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Table des paiements (pour réconciliation bancaire)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  bank_reference TEXT,
  status TEXT DEFAULT 'pending', -- pending, matched, orphan
  source TEXT, -- 'bank_import', 'manual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================
-- FONCTIONS DE SÉCURITÉ
-- ============================================

-- Fonction pour vérifier le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour vérifier si l'utilisateur a un des rôles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Fonction pour créer le profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger pour créer le profil à l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_templates_updated_at BEFORE UPDATE ON public.supplier_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies pour user_roles (admin seulement)
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies pour profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies pour suppliers (tous les rôles peuvent lire)
CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "DAF and Admin can manage suppliers"
  ON public.suppliers FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf']::app_role[]));

-- Policies pour purchase_orders
CREATE POLICY "Authenticated users can view purchase orders"
  ON public.purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "DAF, DG and Admin can manage purchase orders"
  ON public.purchase_orders FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg']::app_role[]));

-- Policies pour delivery_notes
CREATE POLICY "Authenticated users can view delivery notes"
  ON public.delivery_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Comptables and above can manage delivery notes"
  ON public.delivery_notes FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]));

-- Policies pour invoices
CREATE POLICY "Authenticated users can view invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Comptables and above can create invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]));

CREATE POLICY "Comptables and above can update invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]));

CREATE POLICY "Only Admin can delete invoices"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies pour supplier_templates
CREATE POLICY "Authenticated users can view templates"
  ON public.supplier_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Comptables and above can manage templates"
  ON public.supplier_templates FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'comptable']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'comptable']::app_role[]));

-- Policies pour audit_logs
CREATE POLICY "DAF, DG, Auditeur and Admin can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'auditeur']::app_role[]));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies pour import_logs
CREATE POLICY "Comptables and above can view import logs"
  ON public.import_logs FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]));

CREATE POLICY "Comptables and above can manage import logs"
  ON public.import_logs FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[]));

-- Policies pour payments
CREATE POLICY "Authenticated users can view payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "DAF and Admin can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'daf']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'daf']::app_role[]));

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_supplier ON public.invoices(supplier_id);
CREATE INDEX idx_invoices_received_date ON public.invoices(received_date);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_file_hash ON public.invoices(file_hash);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_import_logs_status ON public.import_logs(status);