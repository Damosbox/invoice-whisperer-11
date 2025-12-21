import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchResult {
  purchaseOrderId: string | null;
  deliveryNoteId: string | null;
  supplierId: string | null;
  matchScore: number;
  matchStatus: 'match_automatique' | 'match_probable' | 'match_incertain' | 'aucun_match';
  matchDetails: {
    po_match: { found: boolean; score: number; method: string; po_number?: string };
    bl_match: { found: boolean; score: number; method: string; bl_number?: string };
    supplier_match: { found: boolean; score: number; method: string; supplier_name?: string };
    amount_match: { found: boolean; score: number; difference_percent?: number };
    anomalies: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting matching for invoice ${invoiceId}`);

    // 1. Récupérer la facture avec ses champs OCR
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Invoice not found: ${invoiceError?.message}`);
    }

    const matchResult: MatchResult = {
      purchaseOrderId: null,
      deliveryNoteId: null,
      supplierId: null,
      matchScore: 0,
      matchStatus: 'aucun_match',
      matchDetails: {
        po_match: { found: false, score: 0, method: 'none' },
        bl_match: { found: false, score: 0, method: 'none' },
        supplier_match: { found: false, score: 0, method: 'none' },
        amount_match: { found: false, score: 0 },
        anomalies: [],
      },
    };

    // 2. Recherche du fournisseur (ou création automatique s'il n'existe pas)
    if (invoice.supplier_name_extracted) {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name, identifier')
        .or(`name.ilike.%${invoice.supplier_name_extracted}%,identifier.eq.${invoice.supplier_name_extracted}`);

      if (suppliers && suppliers.length > 0) {
        // Prendre le meilleur match (le premier pour l'instant)
        const supplier = suppliers[0];
        matchResult.supplierId = supplier.id;
        matchResult.matchDetails.supplier_match = {
          found: true,
          score: supplier.name.toLowerCase().includes(invoice.supplier_name_extracted.toLowerCase()) ? 0.9 : 0.7,
          method: 'name_search',
          supplier_name: supplier.name,
        };
      } else {
        // Création automatique du fournisseur à partir des données OCR
        console.log(`No supplier found for "${invoice.supplier_name_extracted}", creating new supplier...`);
        
        const ocrFields = invoice.ocr_fields || {};
        const newSupplierData = {
          name: invoice.supplier_name_extracted,
          iban: invoice.iban_extracted || ocrFields.iban?.value || null,
          fiscal_identifier: ocrFields.fiscal_identifier?.value || null,
          company_identifier: ocrFields.company_identifier?.value || null,
          address: ocrFields.supplier_address?.value || null,
          email: ocrFields.supplier_email?.value || null,
          phone: ocrFields.supplier_phone?.value || null,
          country: 'CI', // Défaut Côte d'Ivoire
          notes: `Créé automatiquement depuis facture OCR le ${new Date().toLocaleDateString('fr-FR')}`,
        };

        const { data: newSupplier, error: createError } = await supabase
          .from('suppliers')
          .insert(newSupplierData)
          .select('id, name')
          .single();

        if (createError) {
          console.error('Failed to create supplier:', createError.message);
          matchResult.matchDetails.supplier_match = {
            found: false,
            score: 0,
            method: 'auto_create_failed',
          };
        } else {
          console.log(`Created new supplier: ${newSupplier.name} (${newSupplier.id})`);
          matchResult.supplierId = newSupplier.id;
          matchResult.matchDetails.supplier_match = {
            found: true,
            score: 0.6, // Score légèrement plus bas car créé automatiquement
            method: 'auto_created',
            supplier_name: newSupplier.name,
          };

          // Log d'audit pour la création du fournisseur
          await supabase.from('audit_logs').insert({
            entity_type: 'supplier',
            entity_id: newSupplier.id,
            action: 'auto_created_from_ocr',
            changes: {
              invoice_id: invoiceId,
              source_name: invoice.supplier_name_extracted,
              created_fields: Object.keys(newSupplierData).filter(k => newSupplierData[k as keyof typeof newSupplierData]),
            },
          });
        }
      }
    }

    // 3. Recherche du bon de commande (PO)
    if (invoice.po_number_extracted) {
      const { data: purchaseOrders } = await supabase
        .from('purchase_orders')
        .select('id, po_number, amount_ht, amount_ttc, supplier_id, status')
        .eq('po_number', invoice.po_number_extracted);

      if (purchaseOrders && purchaseOrders.length > 0) {
        const po = purchaseOrders[0];
        matchResult.purchaseOrderId = po.id;
        matchResult.matchDetails.po_match = {
          found: true,
          score: 1.0,
          method: 'exact_match',
          po_number: po.po_number,
        };

        // Vérifier cohérence fournisseur
        if (po.supplier_id && matchResult.supplierId && po.supplier_id !== matchResult.supplierId) {
          matchResult.matchDetails.anomalies.push('supplier_mismatch_with_po');
        } else if (po.supplier_id && !matchResult.supplierId) {
          matchResult.supplierId = po.supplier_id;
        }

        // Vérifier cohérence montant
        if (invoice.amount_ttc && po.amount_ttc) {
          const diffPercent = Math.abs((invoice.amount_ttc - po.amount_ttc) / po.amount_ttc * 100);
          matchResult.matchDetails.amount_match = {
            found: true,
            score: diffPercent <= 1 ? 1.0 : diffPercent <= 5 ? 0.8 : diffPercent <= 10 ? 0.5 : 0.2,
            difference_percent: diffPercent,
          };

          if (diffPercent > 5) {
            matchResult.matchDetails.anomalies.push(`amount_difference_${Math.round(diffPercent)}%`);
          }
        }
      } else {
        // Recherche floue sur le numéro PO
        const { data: fuzzyPOs } = await supabase
          .from('purchase_orders')
          .select('id, po_number, amount_ht, amount_ttc, supplier_id')
          .ilike('po_number', `%${invoice.po_number_extracted}%`);

        if (fuzzyPOs && fuzzyPOs.length > 0) {
          const po = fuzzyPOs[0];
          matchResult.purchaseOrderId = po.id;
          matchResult.matchDetails.po_match = {
            found: true,
            score: 0.7,
            method: 'fuzzy_match',
            po_number: po.po_number,
          };
        }
      }
    }

    // 4. Recherche du bon de livraison (BL)
    if (invoice.bl_number_extracted) {
      const { data: deliveryNotes } = await supabase
        .from('delivery_notes')
        .select('id, bl_number, supplier_id, purchase_order_id')
        .eq('bl_number', invoice.bl_number_extracted);

      if (deliveryNotes && deliveryNotes.length > 0) {
        const bl = deliveryNotes[0];
        matchResult.deliveryNoteId = bl.id;
        matchResult.matchDetails.bl_match = {
          found: true,
          score: 1.0,
          method: 'exact_match',
          bl_number: bl.bl_number,
        };

        // Cohérence avec PO du BL
        if (bl.purchase_order_id && matchResult.purchaseOrderId && bl.purchase_order_id !== matchResult.purchaseOrderId) {
          matchResult.matchDetails.anomalies.push('po_mismatch_between_invoice_and_bl');
        } else if (bl.purchase_order_id && !matchResult.purchaseOrderId) {
          matchResult.purchaseOrderId = bl.purchase_order_id;
          matchResult.matchDetails.po_match = {
            found: true,
            score: 0.8,
            method: 'via_delivery_note',
          };
        }
      } else {
        // Recherche floue
        const { data: fuzzyBLs } = await supabase
          .from('delivery_notes')
          .select('id, bl_number, supplier_id, purchase_order_id')
          .ilike('bl_number', `%${invoice.bl_number_extracted}%`);

        if (fuzzyBLs && fuzzyBLs.length > 0) {
          const bl = fuzzyBLs[0];
          matchResult.deliveryNoteId = bl.id;
          matchResult.matchDetails.bl_match = {
            found: true,
            score: 0.7,
            method: 'fuzzy_match',
            bl_number: bl.bl_number,
          };
        }
      }
    }

    // 5. Calculer le score global et le statut
    const scores = [
      matchResult.matchDetails.po_match.score * 0.4,
      matchResult.matchDetails.bl_match.score * 0.25,
      matchResult.matchDetails.supplier_match.score * 0.2,
      matchResult.matchDetails.amount_match.score * 0.15,
    ];
    matchResult.matchScore = scores.reduce((a, b) => a + b, 0);

    // Déterminer le statut
    if (matchResult.matchScore >= 0.85 && matchResult.matchDetails.anomalies.length === 0) {
      matchResult.matchStatus = 'match_automatique';
    } else if (matchResult.matchScore >= 0.6) {
      matchResult.matchStatus = 'match_probable';
    } else if (matchResult.matchScore >= 0.3) {
      matchResult.matchStatus = 'match_incertain';
    } else {
      matchResult.matchStatus = 'aucun_match';
    }

    // 6. Détecter les anomalies supplémentaires
    if (!matchResult.matchDetails.po_match.found && !matchResult.matchDetails.bl_match.found) {
      matchResult.matchDetails.anomalies.push('no_reference_documents');
    }

    // 7. Mettre à jour la facture
    const newStatus = matchResult.matchStatus === 'match_automatique' 
      ? 'a_approuver' 
      : matchResult.matchStatus === 'aucun_match' 
        ? 'exception' 
        : 'a_rapprocher';

    const hasAnomalies = matchResult.matchDetails.anomalies.length > 0;

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        purchase_order_id: matchResult.purchaseOrderId,
        delivery_note_id: matchResult.deliveryNoteId,
        supplier_id: matchResult.supplierId,
        match_score: Math.round(matchResult.matchScore * 100),
        match_status: matchResult.matchStatus,
        match_details: matchResult.matchDetails,
        status: newStatus,
        has_anomalies: hasAnomalies,
        anomaly_types: hasAnomalies ? matchResult.matchDetails.anomalies : null,
        anomaly_details: hasAnomalies ? { detected_at: new Date().toISOString(), anomalies: matchResult.matchDetails.anomalies } : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }

    // 8. Log d'audit
    await supabase.from('audit_logs').insert({
      entity_type: 'invoice',
      entity_id: invoiceId,
      action: 'matching_completed',
      changes: {
        match_status: matchResult.matchStatus,
        match_score: matchResult.matchScore,
        po_id: matchResult.purchaseOrderId,
        bl_id: matchResult.deliveryNoteId,
        anomalies_count: matchResult.matchDetails.anomalies.length,
      },
    });

    console.log(`Matching completed for invoice ${invoiceId}: ${matchResult.matchStatus} (score: ${matchResult.matchScore})`);

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId,
        ...matchResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Matching error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
