-- Add calculation_details column to store complete ParcelValuationResult object
ALTER TABLE public.valuation_results 
ADD COLUMN IF NOT EXISTS calculation_details JSONB;

-- Create index for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_valuation_results_calculation_details 
ON public.valuation_results USING GIN (calculation_details);
