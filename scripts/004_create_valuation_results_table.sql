-- Create table to store calculated valuation results
CREATE TABLE IF NOT EXISTS public.valuation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  
  -- Calculated values (stored for performance and audit trail)
  age_years INTEGER NOT NULL,
  yield_kg_per_ha DECIMAL(10,2) NOT NULL,
  gross_income_cop DECIMAL(15,2) NOT NULL,
  direct_costs_cop_per_ha DECIMAL(12,2) NOT NULL,
  fin_cost_cop DECIMAL(15,2) NOT NULL,
  total_invest_cop DECIMAL(15,2) NOT NULL,
  net_income_cop DECIMAL(15,2) NOT NULL,
  
  -- Break-even analysis
  cum_inflows_to_date DECIMAL(15,2),
  cum_outflows_to_date DECIMAL(15,2),
  breakeven_reached BOOLEAN NOT NULL,
  
  -- Phase classification
  phase TEXT NOT NULL CHECK (phase IN ('improductive', 'productive')),
  pe_flag TEXT NOT NULL CHECK (pe_flag IN ('PE+', 'PE-')),
  
  -- Valuation results
  value_block_cop DECIMAL(15,2) NOT NULL,
  value_block_cop_per_ha DECIMAL(12,2) NOT NULL,
  
  -- Business indicators
  npv DECIMAL(15,2),
  irr DECIMAL(6,4),
  break_even_year INTEGER,
  
  -- Confidence tier
  confidence_tier TEXT NOT NULL CHECK (confidence_tier IN ('A', 'B', 'C')),
  tier_explanation TEXT,
  
  -- Calculation metadata
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_version TEXT DEFAULT '1.0',
  
  -- Full calculation payload
  calculation_details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.valuation_results ENABLE ROW LEVEL SECURITY;

-- RLS policies (inherit from block ownership)
CREATE POLICY "valuation_results_select_own" ON public.valuation_results FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.parcels p ON p.id = b.parcel_id
    WHERE b.id = valuation_results.block_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "valuation_results_insert_own" ON public.valuation_results FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.parcels p ON p.id = b.parcel_id
    WHERE b.id = valuation_results.block_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "valuation_results_update_own" ON public.valuation_results FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.parcels p ON p.id = b.parcel_id
    WHERE b.id = valuation_results.block_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "valuation_results_delete_own" ON public.valuation_results FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.blocks b
    JOIN public.parcels p ON p.id = b.parcel_id
    WHERE b.id = valuation_results.block_id AND p.user_id = auth.uid()
  ));

-- Create indexes
CREATE INDEX idx_valuation_results_block_id ON public.valuation_results(block_id);
CREATE INDEX idx_valuation_results_calculation_date ON public.valuation_results(calculation_date);
CREATE INDEX idx_valuation_results_confidence_tier ON public.valuation_results(confidence_tier);
CREATE INDEX idx_valuation_results_calculation_details ON public.valuation_results USING GIN (calculation_details);
