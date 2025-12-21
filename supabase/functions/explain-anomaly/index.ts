import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const anomalyLabels: Record<string, string> = {
      supplier_mismatch: "Fournisseur non reconnu dans le référentiel",
      amount_discrepancy: "Écart entre le montant facturé et le bon de commande",
      unknown_iban: "IBAN du fournisseur non enregistré",
      potential_duplicate: "Doublon potentiel avec une autre facture",
      missing_po: "Bon de commande manquant ou non trouvé",
      date_anomaly: "Incohérence dans les dates (émission, échéance)",
      low_confidence: "Score de confiance OCR insuffisant",
    };

    const anomalies = invoice.anomaly_types || [];
    const anomalyDetails = invoice.anomaly_details || {};
    
    const anomalyDescription = anomalies
      .map((a: string) => {
        const label = anomalyLabels[a] || a;
        const detail = anomalyDetails[a]?.message || "";
        return `- ${label}${detail ? `: ${detail}` : ""}`;
      })
      .join("\n");

    const prompt = `Tu es un expert en comptabilité fournisseur et gestion des factures. Analyse cette exception et fournis une explication claire et des recommandations.

FACTURE:
- Numéro: ${invoice.invoice_number || "Non extrait"}
- Fournisseur: ${invoice.supplier_name || invoice.supplier_name_extracted || "Inconnu"}
- Montant TTC: ${invoice.amount_ttc ? `${invoice.amount_ttc} ${invoice.currency || "EUR"}` : "Non extrait"}
- Montant HT: ${invoice.amount_ht ? `${invoice.amount_ht} ${invoice.currency || "EUR"}` : "Non extrait"}
- Date d'émission: ${invoice.issue_date || "Non extraite"}
- Date d'échéance: ${invoice.due_date || "Non extraite"}
- N° BC extrait: ${invoice.po_number_extracted || "Aucun"}
- IBAN extrait: ${invoice.iban_extracted || "Aucun"}
- Score OCR: ${invoice.ocr_confidence_score ? `${Math.round(invoice.ocr_confidence_score * 100)}%` : "N/A"}

ANOMALIES DÉTECTÉES:
${anomalyDescription || "Aucune anomalie spécifique identifiée"}

Fournis:
1. Une explication claire et concise de chaque anomalie (2-3 phrases max par anomalie)
2. L'impact potentiel sur le traitement de la facture
3. Les actions recommandées pour résoudre chaque anomalie

Réponds en français, de manière professionnelle et actionnable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Impossible de générer une explication.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in explain-anomaly function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
