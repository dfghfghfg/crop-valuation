-- Create blocks table for individual planted blocks within parcels
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  block_area_ha DECIMAL(10,4) NOT NULL CHECK (block_area_ha > 0),
  crop TEXT NOT NULL,
  variety TEXT,
  planting_date DATE NOT NULL,
  density_spacing TEXT,
  
  -- Yield source configuration
  yield_source TEXT NOT NULL CHECK (yield_source IN ('measured', 'modeled')),
  
  -- Measured yield fields
  production_tons_period DECIMAL(12,4) CHECK (production_tons_period >= 0),
  period_days INTEGER CHECK (period_days >= 1),
  evidence_uploads JSONB, -- Store file references/URLs
  
  -- Modeled yield fields
  age_yield_curve_id TEXT,
  realization_factor DECIMAL(6,4) DEFAULT 1.00,
  
  -- Price information
  price_farmgate_cop_per_kg DECIMAL(12,2) NOT NULL CHECK (price_farmgate_cop_per_kg > 0),
  price_source_note TEXT,
  
  -- Cost configuration
  cost_source TEXT NOT NULL CHECK (cost_source IN ('standard_template', 'custom_entered')),
  cost_template_id TEXT,
  
  -- Custom cost fields (COP per hectare)
  land_rent_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (land_rent_cop_per_ha >= 0),
  fertilizers_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (fertilizers_cop_per_ha >= 0),
  crop_protection_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (crop_protection_cop_per_ha >= 0),
  propagation_material_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (propagation_material_cop_per_ha >= 0),
  labor_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (labor_cop_per_ha >= 0),
  irrigation_energy_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (irrigation_energy_cop_per_ha >= 0),
  maintenance_upkeep_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (maintenance_upkeep_cop_per_ha >= 0),
  harvest_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (harvest_cop_per_ha >= 0),
  transport_logistics_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (transport_logistics_cop_per_ha >= 0),
  services_contracts_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (services_contracts_cop_per_ha >= 0),
  admin_overheads_cop_per_ha DECIMAL(12,2) DEFAULT 0 CHECK (admin_overheads_cop_per_ha >= 0),
  
  -- Financial information
  financed_amount_cop DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (financed_amount_cop >= 0),
  ea_rate DECIMAL(6,4) NOT NULL CHECK (ea_rate >= 0 AND ea_rate <= 1),
  
  -- Improductive phase fields (for blocks age <= 3 years)
  cumulative_outlays_to_date_cop DECIMAL(15,2) CHECK (cumulative_outlays_to_date_cop >= 0),
  inp_factor DECIMAL(4,3) DEFAULT 0.40 CHECK (inp_factor >= 0.30 AND inp_factor <= 0.50),
  
  -- Discount rate and metadata
  dnp_discount_rate DECIMAL(6,4) NOT NULL CHECK (dnp_discount_rate >= 0 AND dnp_discount_rate <= 1),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique block_id within each parcel
  UNIQUE(parcel_id, block_id)
);

-- Enable RLS
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocks (inherit from parcel ownership)
CREATE POLICY "blocks_select_own" ON public.blocks FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.parcels p 
    WHERE p.id = blocks.parcel_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "blocks_insert_own" ON public.blocks FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.parcels p 
    WHERE p.id = blocks.parcel_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "blocks_update_own" ON public.blocks FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.parcels p 
    WHERE p.id = blocks.parcel_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "blocks_delete_own" ON public.blocks FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.parcels p 
    WHERE p.id = blocks.parcel_id AND p.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_blocks_parcel_id ON public.blocks(parcel_id);
CREATE INDEX idx_blocks_yield_source ON public.blocks(yield_source);
CREATE INDEX idx_blocks_cost_source ON public.blocks(cost_source);
