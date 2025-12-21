-- Add new supplier fields for Ivory Coast context
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CI',
ADD COLUMN IF NOT EXISTS fiscal_identifier TEXT,
ADD COLUMN IF NOT EXISTS company_identifier TEXT;

-- Add index for new identifiers
CREATE INDEX IF NOT EXISTS idx_suppliers_fiscal_identifier ON public.suppliers(fiscal_identifier);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_identifier ON public.suppliers(company_identifier);