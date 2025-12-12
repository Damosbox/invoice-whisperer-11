import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OcrField {
  value: string | number | null;
  confidence: number;
  raw_text?: string;
}

interface OcrFields {
  supplier_name: OcrField;
  supplier_id: OcrField;
  invoice_number: OcrField;
  issue_date: OcrField;
  due_date: OcrField;
  amount_ht: OcrField;
  amount_tva: OcrField;
  amount_ttc: OcrField;
  currency: OcrField;
  po_number: OcrField;
  bl_number: OcrField;
  iban: OcrField;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, filePath } = await req.json();

    if (!invoiceId || !filePath) {
      throw new Error('invoiceId and filePath are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing OCR for invoice ${invoiceId}, file: ${filePath}`);

    // Update status to processing
    await supabase
      .from('invoices')
      .update({ status: 'a_valider_extraction' })
      .eq('id', invoiceId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('invoices')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to base64 using chunked approach to avoid stack overflow
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Encode base64 in chunks to prevent stack overflow with large files
    let base64 = '';
    const chunkSize = 32768; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64 += String.fromCharCode(...chunk);
    }
    base64 = btoa(base64);
    
    const mimeType = fileData.type || 'application/pdf';

    // Call Lovable AI Gateway with Gemini Pro (vision capable)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en extraction de données de factures. Extrais les informations suivantes de la facture avec un score de confiance entre 0 et 1 pour chaque champ.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "supplier_name": {"value": "string ou null", "confidence": 0.0-1.0},
  "supplier_id": {"value": "string (SIRET/SIREN) ou null", "confidence": 0.0-1.0},
  "invoice_number": {"value": "string ou null", "confidence": 0.0-1.0},
  "issue_date": {"value": "YYYY-MM-DD ou null", "confidence": 0.0-1.0},
  "due_date": {"value": "YYYY-MM-DD ou null", "confidence": 0.0-1.0},
  "amount_ht": {"value": number ou null, "confidence": 0.0-1.0},
  "amount_tva": {"value": number ou null, "confidence": 0.0-1.0},
  "amount_ttc": {"value": number ou null, "confidence": 0.0-1.0},
  "currency": {"value": "EUR/USD/etc ou null", "confidence": 0.0-1.0},
  "po_number": {"value": "string (numéro BC) ou null", "confidence": 0.0-1.0},
  "bl_number": {"value": "string (numéro BL) ou null", "confidence": 0.0-1.0},
  "iban": {"value": "string ou null", "confidence": 0.0-1.0}
}

Si un champ n'est pas trouvé, mets value à null et confidence à 0.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrais les informations de cette facture:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI raw response:', rawContent);

    // Parse JSON from response
    let ocrFields: OcrFields;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = rawContent;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      ocrFields = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse OCR response:', parseError);
      // Create empty structure with low confidence
      ocrFields = {
        supplier_name: { value: null, confidence: 0 },
        supplier_id: { value: null, confidence: 0 },
        invoice_number: { value: null, confidence: 0 },
        issue_date: { value: null, confidence: 0 },
        due_date: { value: null, confidence: 0 },
        amount_ht: { value: null, confidence: 0 },
        amount_tva: { value: null, confidence: 0 },
        amount_ttc: { value: null, confidence: 0 },
        currency: { value: null, confidence: 0 },
        po_number: { value: null, confidence: 0 },
        bl_number: { value: null, confidence: 0 },
        iban: { value: null, confidence: 0 },
      };
    }

    // Calculate average confidence score
    const confidenceValues = Object.values(ocrFields).map(f => f.confidence);
    const avgConfidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;

    // Update invoice with extracted data
    const updateData = {
      ocr_fields: ocrFields,
      ocr_confidence_score: Math.round(avgConfidence * 100),
      ocr_raw_text: rawContent,
      supplier_name_extracted: ocrFields.supplier_name?.value,
      invoice_number: ocrFields.invoice_number?.value,
      issue_date: ocrFields.issue_date?.value,
      due_date: ocrFields.due_date?.value,
      amount_ht: ocrFields.amount_ht?.value,
      amount_tva: ocrFields.amount_tva?.value,
      amount_ttc: ocrFields.amount_ttc?.value,
      currency: ocrFields.currency?.value || 'EUR',
      po_number_extracted: ocrFields.po_number?.value,
      bl_number_extracted: ocrFields.bl_number?.value,
      iban_extracted: ocrFields.iban?.value,
      status: 'a_valider_extraction',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (updateError) {
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }

    // Log the OCR processing
    await supabase.from('audit_logs').insert({
      entity_type: 'invoice',
      entity_id: invoiceId,
      action: 'ocr_processed',
      changes: {
        confidence_score: avgConfidence,
        fields_extracted: Object.keys(ocrFields).filter(k => ocrFields[k as keyof OcrFields]?.value !== null).length,
      },
    });

    console.log(`OCR completed for invoice ${invoiceId}, confidence: ${avgConfidence}`);

    // Trigger automatic matching if PO or BL number was extracted
    if (ocrFields.po_number?.value || ocrFields.bl_number?.value) {
      console.log(`Triggering automatic matching for invoice ${invoiceId}`);
      
      // Call match-invoice function asynchronously
      const matchResponse = await fetch(`${supabaseUrl}/functions/v1/match-invoice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (!matchResponse.ok) {
        console.error('Matching trigger failed:', await matchResponse.text());
      } else {
        const matchResult = await matchResponse.json();
        console.log(`Matching result: ${matchResult.matchStatus}, score: ${matchResult.matchScore}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId,
        ocrFields,
        confidenceScore: avgConfidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OCR processing error:', error);
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
