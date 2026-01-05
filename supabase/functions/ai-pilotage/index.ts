import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch aggregated data for context
    console.log("Fetching aggregated data for AI context...");

    const [
      { data: invoices },
      { data: suppliers },
      { data: exceptions },
      { data: disputes }
    ] = await Promise.all([
      supabase.from("invoices").select("*"),
      supabase.from("suppliers").select("*"),
      supabase.from("invoices").select("*").eq("status", "exception"),
      supabase.from("disputes").select("*").neq("status", "resolved")
    ]);

    // Calculate statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const invoiceStats = {
      total: invoices?.length || 0,
      thisMonth: invoices?.filter(inv => new Date(inv.created_at) >= thisMonth).length || 0,
      byStatus: {} as Record<string, number>,
      totalAmountToPay: 0,
      totalAmountPaid: 0,
      overdue: [] as any[],
      withAnomalies: invoices?.filter(inv => inv.has_anomalies).length || 0
    };

    invoices?.forEach(inv => {
      invoiceStats.byStatus[inv.status] = (invoiceStats.byStatus[inv.status] || 0) + 1;
      
      if (inv.status === "prete_comptabilisation" || inv.status === "a_approuver") {
        invoiceStats.totalAmountToPay += inv.amount_ttc || 0;
      }
      if (inv.status === "comptabilisee") {
        invoiceStats.totalAmountPaid += inv.amount_ttc || 0;
      }
      
      if (inv.due_date && new Date(inv.due_date) < now && inv.status !== "comptabilisee") {
        const daysOverdue = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
        invoiceStats.overdue.push({
          invoice_number: inv.invoice_number,
          supplier_name: inv.supplier_name_extracted,
          amount: inv.amount_ttc,
          days_overdue: daysOverdue
        });
      }
    });

    // Sort overdue by days
    invoiceStats.overdue.sort((a, b) => b.days_overdue - a.days_overdue);
    const topOverdue = invoiceStats.overdue.slice(0, 5);

    // Top suppliers by invoice count
    const supplierCounts: Record<string, { name: string; count: number; amount: number }> = {};
    invoices?.forEach(inv => {
      if (inv.supplier_id) {
        if (!supplierCounts[inv.supplier_id]) {
          supplierCounts[inv.supplier_id] = { 
            name: inv.supplier_name_extracted || "Inconnu", 
            count: 0, 
            amount: 0 
          };
        }
        supplierCounts[inv.supplier_id].count++;
        supplierCounts[inv.supplier_id].amount += inv.amount_ttc || 0;
      }
    });
    const topSuppliers = Object.values(supplierCounts)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate average processing time (received to approved)
    const processedInvoices = invoices?.filter(inv => 
      inv.received_date && inv.approved_at
    ) || [];
    
    let avgProcessingDays = 0;
    if (processedInvoices.length > 0) {
      const totalDays = processedInvoices.reduce((sum, inv) => {
        const received = new Date(inv.received_date);
        const approved = new Date(inv.approved_at);
        return sum + Math.floor((approved.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      avgProcessingDays = Math.round(totalDays / processedInvoices.length);
    }

    // Build context for AI
    const businessContext = `
Tu es l'assistant IA de SUTA Finance, un expert en comptabilité fournisseurs et gestion des factures.

## État actuel du système (données temps réel):

### Factures
- Total: ${invoiceStats.total} factures
- Ce mois-ci: ${invoiceStats.thisMonth} nouvelles factures
- Par statut:
${Object.entries(invoiceStats.byStatus).map(([status, count]) => `  - ${status}: ${count}`).join('\n')}

### Montants
- Total à payer: ${invoiceStats.totalAmountToPay.toLocaleString('fr-FR')}€
- Total payé: ${invoiceStats.totalAmountPaid.toLocaleString('fr-FR')}€

### Retards de paiement
- Factures en retard: ${invoiceStats.overdue.length}
- Montant total en retard: ${invoiceStats.overdue.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString('fr-FR')}€
${topOverdue.length > 0 ? `- Top 5 en retard:\n${topOverdue.map(inv => `  - ${inv.invoice_number || 'N/A'} (${inv.supplier_name || 'Inconnu'}): ${inv.amount?.toLocaleString('fr-FR') || 0}€, ${inv.days_overdue}j de retard`).join('\n')}` : '- Aucune facture en retard'}

### Anomalies et exceptions
- Factures avec anomalies: ${invoiceStats.withAnomalies}
- Factures en exception: ${exceptions?.length || 0}
- Litiges ouverts: ${disputes?.length || 0}

### Performance
- Délai moyen de traitement: ${avgProcessingDays} jours
- Fournisseurs: ${suppliers?.length || 0} actifs

### Top 5 fournisseurs (par montant)
${topSuppliers.map((s, i) => `${i + 1}. ${s.name}: ${s.amount.toLocaleString('fr-FR')}€ (${s.count} factures)`).join('\n')}

## Instructions:
- Réponds en français, de manière concise et professionnelle
- Donne des chiffres précis basés sur les données ci-dessus
- Propose des actions concrètes et recommandations quand pertinent
- Si on te demande des détails que tu n'as pas, dis-le clairement
- Utilise des emojis avec modération pour rendre les réponses plus lisibles
`;

    console.log("Calling Lovable AI with business context...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: businessContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants. Veuillez recharger votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA. Veuillez réessayer." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI...");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ai-pilotage error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
