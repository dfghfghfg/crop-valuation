-- Create lookup tables for standardized values

-- Regions lookup
CREATE TABLE IF NOT EXISTS public.regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true
);

-- Insert standard regions
INSERT INTO public.regions (id, name, description) VALUES
  ('uraba', 'Urabá', 'Urabá region'),
  ('magdalena_medio', 'Magdalena Medio', 'Magdalena Medio region'),
  ('llanos_orientales', 'Llanos Orientales', 'Eastern Plains region'),
  ('pacifico', 'Pacífico', 'Pacific region')
ON CONFLICT (id) DO NOTHING;

-- Crops lookup
CREATE TABLE IF NOT EXISTS public.crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scientific_name TEXT,
  active BOOLEAN DEFAULT true
);

-- Insert standard crops
INSERT INTO public.crops (id, name, scientific_name) VALUES
  ('oil_palm', 'Oil Palm', 'Elaeis guineensis'),
  ('cocoa', 'Cocoa', 'Theobroma cacao'),
  ('coffee', 'Coffee', 'Coffea arabica')
ON CONFLICT (id) DO NOTHING;

-- Varieties lookup
CREATE TABLE IF NOT EXISTS public.varieties (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES public.crops(id),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true
);

-- Insert oil palm varieties
INSERT INTO public.varieties (id, crop_id, name, description) VALUES
  ('e_guineensis', 'oil_palm', 'E. guineensis', 'African oil palm'),
  ('oxg', 'oil_palm', 'OxG', 'Interspecific hybrid'),
  ('e_oleifera', 'oil_palm', 'E. oleifera', 'American oil palm')
ON CONFLICT (id) DO NOTHING;

-- Age-yield curves lookup
CREATE TABLE IF NOT EXISTS public.age_yield_curves (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES public.crops(id),
  variety_id TEXT REFERENCES public.varieties(id),
  region_id TEXT REFERENCES public.regions(id),
  name TEXT NOT NULL,
  description TEXT,
  curve_data JSONB NOT NULL, -- Store age->yield mapping
  active BOOLEAN DEFAULT true
);

-- Cost templates lookup
CREATE TABLE IF NOT EXISTS public.cost_templates (
  id TEXT PRIMARY KEY,
  crop_id TEXT NOT NULL REFERENCES public.crops(id),
  region_id TEXT REFERENCES public.regions(id),
  name TEXT NOT NULL,
  description TEXT,

  -- Cost per hectare values
  land_rent_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  fertilizers_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  crop_protection_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  propagation_material_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  labor_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  irrigation_energy_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  maintenance_upkeep_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  harvest_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  transport_logistics_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  services_contracts_cop_per_ha DECIMAL(12,2) DEFAULT 0,
  admin_overheads_cop_per_ha DECIMAL(12,2) DEFAULT 0,

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make lookup tables publicly readable (no RLS needed for reference data)
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_yield_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read lookup tables
CREATE POLICY "regions_select_all" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "crops_select_all" ON public.crops FOR SELECT TO authenticated USING (true);
CREATE POLICY "varieties_select_all" ON public.varieties FOR SELECT TO authenticated USING (true);
CREATE POLICY "age_yield_curves_select_all" ON public.age_yield_curves FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_templates_select_all" ON public.cost_templates FOR SELECT TO authenticated USING (true);
