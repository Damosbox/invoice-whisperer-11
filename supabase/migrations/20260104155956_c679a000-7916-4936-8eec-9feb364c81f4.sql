-- Fix the view to use SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.ocr_quality_stats;

CREATE VIEW public.ocr_quality_stats 
WITH (security_invoker = true) AS
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