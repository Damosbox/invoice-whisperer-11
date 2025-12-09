// ============================================
// SUTA Finance - Types principaux
// ============================================

export type AppRole = 'admin' | 'daf' | 'dg' | 'comptable' | 'auditeur';

export type InvoiceStatus = 
  | 'nouvelle'
  | 'a_valider_extraction'
  | 'a_rapprocher'
  | 'a_approuver'
  | 'exception'
  | 'litige'
  | 'prete_comptabilisation'
  | 'comptabilisee';

export type MatchStatus = 
  | 'match_automatique'
  | 'match_probable'
  | 'match_incertain'
  | 'aucun_match';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  identifier: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  iban: string | null;
  bic: string | null;
  payment_terms_days: number;
  is_critical: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  amount_ht: number;
  amount_tva: number;
  amount_ttc: number;
  currency: string;
  description: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: Supplier;
}

export interface DeliveryNote {
  id: string;
  bl_number: string;
  purchase_order_id: string | null;
  supplier_id: string | null;
  delivery_date: string;
  description: string | null;
  received_by: string | null;
  created_at: string;
  // Relations
  purchase_order?: PurchaseOrder;
  supplier?: Supplier;
}

export interface OcrField {
  value: string | number | null;
  confidence: number;
  bounding_box?: { x: number; y: number; width: number; height: number };
}

export interface OcrFields {
  invoice_number?: OcrField;
  supplier_name?: OcrField;
  issue_date?: OcrField;
  due_date?: OcrField;
  amount_ht?: OcrField;
  amount_tva?: OcrField;
  amount_ttc?: OcrField;
  currency?: OcrField;
  po_number?: OcrField;
  bl_number?: OcrField;
  iban?: OcrField;
  [key: string]: OcrField | undefined;
}

export interface MatchDetails {
  po_match_score?: number;
  bl_match_score?: number;
  matched_fields?: string[];
  discrepancies?: string[];
}

export interface AnomalyDetails {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggested_action?: string;
}

export interface Invoice {
  id: string;
  file_path: string;
  file_hash: string | null;
  original_filename: string | null;
  file_size: number | null;
  
  invoice_number: string | null;
  supplier_id: string | null;
  supplier_name_extracted: string | null;
  
  issue_date: string | null;
  due_date: string | null;
  received_date: string;
  
  amount_ht: number | null;
  amount_tva: number | null;
  amount_ttc: number | null;
  currency: string;
  
  po_number_extracted: string | null;
  bl_number_extracted: string | null;
  iban_extracted: string | null;
  
  ocr_raw_text: string | null;
  ocr_fields: OcrFields | null;
  ocr_confidence_score: number | null;
  
  purchase_order_id: string | null;
  delivery_note_id: string | null;
  match_status: MatchStatus;
  match_score: number | null;
  match_details: MatchDetails | null;
  
  status: InvoiceStatus;
  current_approver_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  
  has_anomalies: boolean;
  anomaly_types: string[] | null;
  anomaly_details: AnomalyDetails[] | null;
  
  accounting_entry_ref: string | null;
  exported_at: string | null;
  
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  supplier?: Supplier;
  purchase_order?: PurchaseOrder;
  delivery_note?: DeliveryNote;
}

export interface ImportLog {
  id: string;
  source: string;
  source_details: Record<string, unknown> | null;
  file_name: string;
  file_hash: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'duplicate';
  error_message: string | null;
  invoice_id: string | null;
  processed_by: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, unknown> | null;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  bank_reference: string | null;
  status: 'pending' | 'matched' | 'orphan';
  source: string | null;
  created_at: string;
}

// Kanban types
export interface KanbanColumn {
  id: InvoiceStatus;
  title: string;
  color: string;
  invoices: Invoice[];
}

// Dashboard types
export interface DashboardStats {
  total_invoices: number;
  total_amount: number;
  pending_approval: number;
  exceptions_count: number;
  auto_match_rate: number;
  avg_processing_days: number;
}

export interface InvoicesByStatus {
  status: InvoiceStatus;
  count: number;
  total_amount: number;
}

export interface TopSupplier {
  supplier: Supplier;
  invoice_count: number;
  total_amount: number;
}