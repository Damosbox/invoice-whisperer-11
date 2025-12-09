-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false);

-- Storage policies for invoices bucket
CREATE POLICY "Authenticated users can view invoice files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Comptables and above can upload invoice files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' 
    AND public.has_any_role(auth.uid(), ARRAY['admin', 'daf', 'dg', 'comptable']::app_role[])
  );

CREATE POLICY "Only Admin can delete invoice files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'invoices' 
    AND public.has_role(auth.uid(), 'admin')
  );