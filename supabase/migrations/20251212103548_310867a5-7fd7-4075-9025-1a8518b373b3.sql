-- Add INSERT policy for import_logs table
CREATE POLICY "Authenticated users can insert import_logs"
ON public.import_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = processed_by OR processed_by IS NULL);

-- Add UPDATE policy for import_logs table (needed for status updates)
CREATE POLICY "Authenticated users can update their import_logs"
ON public.import_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = processed_by)
WITH CHECK (auth.uid() = processed_by);