export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approval_history: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          comment: string | null
          created_at: string
          id: string
          invoice_id: string
          level: number
          required_role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          level: number
          required_role: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          level?: number
          required_role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_rules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_critical_supplier: boolean | null
          level_1_role: Database["public"]["Enums"]["app_role"]
          level_2_role: Database["public"]["Enums"]["app_role"] | null
          level_3_role: Database["public"]["Enums"]["app_role"] | null
          max_amount: number | null
          min_amount: number | null
          name: string
          priority: number
          required_levels: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical_supplier?: boolean | null
          level_1_role?: Database["public"]["Enums"]["app_role"]
          level_2_role?: Database["public"]["Enums"]["app_role"] | null
          level_3_role?: Database["public"]["Enums"]["app_role"] | null
          max_amount?: number | null
          min_amount?: number | null
          name: string
          priority?: number
          required_levels?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_critical_supplier?: boolean | null
          level_1_role?: Database["public"]["Enums"]["app_role"]
          level_2_role?: Database["public"]["Enums"]["app_role"] | null
          level_3_role?: Database["public"]["Enums"]["app_role"] | null
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          priority?: number
          required_levels?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      delivery_notes: {
        Row: {
          bl_number: string
          created_at: string
          delivery_date: string
          description: string | null
          id: string
          purchase_order_id: string | null
          received_by: string | null
          supplier_id: string | null
        }
        Insert: {
          bl_number: string
          created_at?: string
          delivery_date: string
          description?: string | null
          id?: string
          purchase_order_id?: string | null
          received_by?: string | null
          supplier_id?: string | null
        }
        Update: {
          bl_number?: string
          created_at?: string
          delivery_date?: string
          description?: string | null
          id?: string
          purchase_order_id?: string | null
          received_by?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notes_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          error_message: string | null
          file_hash: string | null
          file_name: string
          id: string
          invoice_id: string | null
          processed_at: string | null
          processed_by: string | null
          source: string
          source_details: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_hash?: string | null
          file_name: string
          id?: string
          invoice_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          source: string
          source_details?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_hash?: string | null
          file_name?: string
          id?: string
          invoice_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          source?: string
          source_details?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          accounting_entry_ref: string | null
          amount_ht: number | null
          amount_ttc: number | null
          amount_tva: number | null
          anomaly_details: Json | null
          anomaly_types: string[] | null
          approval_rule_id: string | null
          approved_at: string | null
          approved_by: string | null
          bl_number_extracted: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          current_approval_level: number | null
          current_approver_id: string | null
          delivery_note_id: string | null
          due_date: string | null
          exported_at: string | null
          file_hash: string | null
          file_path: string
          file_size: number | null
          has_anomalies: boolean | null
          iban_extracted: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          match_details: Json | null
          match_score: number | null
          match_status: Database["public"]["Enums"]["match_status"] | null
          ocr_confidence_score: number | null
          ocr_fields: Json | null
          ocr_raw_text: string | null
          original_filename: string | null
          po_number_extracted: string | null
          purchase_order_id: string | null
          received_date: string | null
          rejection_reason: string | null
          required_approval_levels: number | null
          source: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          supplier_id: string | null
          supplier_name_extracted: string | null
          updated_at: string
        }
        Insert: {
          accounting_entry_ref?: string | null
          amount_ht?: number | null
          amount_ttc?: number | null
          amount_tva?: number | null
          anomaly_details?: Json | null
          anomaly_types?: string[] | null
          approval_rule_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bl_number_extracted?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_approval_level?: number | null
          current_approver_id?: string | null
          delivery_note_id?: string | null
          due_date?: string | null
          exported_at?: string | null
          file_hash?: string | null
          file_path: string
          file_size?: number | null
          has_anomalies?: boolean | null
          iban_extracted?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          match_details?: Json | null
          match_score?: number | null
          match_status?: Database["public"]["Enums"]["match_status"] | null
          ocr_confidence_score?: number | null
          ocr_fields?: Json | null
          ocr_raw_text?: string | null
          original_filename?: string | null
          po_number_extracted?: string | null
          purchase_order_id?: string | null
          received_date?: string | null
          rejection_reason?: string | null
          required_approval_levels?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          supplier_id?: string | null
          supplier_name_extracted?: string | null
          updated_at?: string
        }
        Update: {
          accounting_entry_ref?: string | null
          amount_ht?: number | null
          amount_ttc?: number | null
          amount_tva?: number | null
          anomaly_details?: Json | null
          anomaly_types?: string[] | null
          approval_rule_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bl_number_extracted?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_approval_level?: number | null
          current_approver_id?: string | null
          delivery_note_id?: string | null
          due_date?: string | null
          exported_at?: string | null
          file_hash?: string | null
          file_path?: string
          file_size?: number | null
          has_anomalies?: boolean | null
          iban_extracted?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          match_details?: Json | null
          match_score?: number | null
          match_status?: Database["public"]["Enums"]["match_status"] | null
          ocr_confidence_score?: number | null
          ocr_fields?: Json | null
          ocr_raw_text?: string | null
          original_filename?: string | null
          po_number_extracted?: string | null
          purchase_order_id?: string | null
          received_date?: string | null
          rejection_reason?: string | null
          required_approval_levels?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          supplier_id?: string | null
          supplier_name_extracted?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_approval_rule_id_fkey"
            columns: ["approval_rule_id"]
            isOneToOne: false
            referencedRelation: "approval_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_delivery_note_id_fkey"
            columns: ["delivery_note_id"]
            isOneToOne: false
            referencedRelation: "delivery_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          id: string
          invoice_id: string | null
          payment_date: string
          payment_method: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_date: string
          payment_method?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          amount_ht: number
          amount_ttc: number
          amount_tva: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          expected_delivery_date: string | null
          id: string
          order_date: string
          po_number: string
          status: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount_ht: number
          amount_ttc: number
          amount_tva?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expected_delivery_date?: string | null
          id?: string
          order_date: string
          po_number: string
          status?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          amount_tva?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expected_delivery_date?: string | null
          id?: string
          order_date?: string
          po_number?: string
          status?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_templates: {
        Row: {
          corrections_count: number | null
          created_at: string
          extraction_rules: Json | null
          field_name: string
          id: string
          last_correction_at: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          corrections_count?: number | null
          created_at?: string
          extraction_rules?: Json | null
          field_name: string
          id?: string
          last_correction_at?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          corrections_count?: number | null
          created_at?: string
          extraction_rules?: Json | null
          field_name?: string
          id?: string
          last_correction_at?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_templates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bic: string | null
          created_at: string
          email: string | null
          iban: string | null
          id: string
          identifier: string | null
          is_critical: boolean | null
          name: string
          notes: string | null
          payment_terms_days: number | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bic?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          identifier?: string | null
          is_critical?: boolean | null
          name: string
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bic?: string | null
          created_at?: string
          email?: string | null
          iban?: string | null
          id?: string
          identifier?: string | null
          is_critical?: boolean | null
          name?: string
          notes?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "daf" | "dg" | "comptable" | "auditeur"
      invoice_status:
        | "nouvelle"
        | "a_valider_extraction"
        | "a_rapprocher"
        | "a_approuver"
        | "exception"
        | "litige"
        | "prete_comptabilisation"
        | "comptabilisee"
      match_status:
        | "match_automatique"
        | "match_probable"
        | "match_incertain"
        | "aucun_match"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "daf", "dg", "comptable", "auditeur"],
      invoice_status: [
        "nouvelle",
        "a_valider_extraction",
        "a_rapprocher",
        "a_approuver",
        "exception",
        "litige",
        "prete_comptabilisation",
        "comptabilisee",
      ],
      match_status: [
        "match_automatique",
        "match_probable",
        "match_incertain",
        "aucun_match",
      ],
    },
  },
} as const
