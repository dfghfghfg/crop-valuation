-- Create parcels table for parcel header information
CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT NOT NULL UNIQUE, -- IGAC cédula catastral or internal key
  valuation_asof_date DATE NOT NULL,
  operator_name TEXT,
  region TEXT, -- Combined region field (deprecated, kept for backward compatibility)
  departamento TEXT, -- Department where the parcel is located
  municipio TEXT, -- Municipality where the parcel is located
  total_parcel_area_ha DECIMAL(10,4) NOT NULL CHECK (total_parcel_area_ha >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- RLS policies for parcels
CREATE POLICY "parcels_select_own" ON public.parcels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "parcels_insert_own" ON public.parcels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "parcels_update_own" ON public.parcels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "parcels_delete_own" ON public.parcels FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_parcels_parcel_id ON public.parcels(parcel_id);
CREATE INDEX idx_parcels_user_id ON public.parcels(user_id);
CREATE INDEX idx_parcels_departamento ON public.parcels(departamento);
CREATE INDEX idx_parcels_municipio ON public.parcels(municipio);
