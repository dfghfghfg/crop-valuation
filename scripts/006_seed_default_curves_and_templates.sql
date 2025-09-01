-- Seed default age-yield curves and cost templates for Oil Palm, Cocoa, Coffee
-- Oil Palm standard curve (kg/ha by age)
INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'oil_palm_standard',
  'oil_palm',
  'Palma de Aceite - Estándar',
  'Curva estándar basada en promedios sectoriales',
  '{"0":0,"1":0,"2":0,"3":2000,"4":8000,"5":12000,"6":15000,"7":18000,"8":20000,"9":20000,"10":19000,"11":18000,"12":17000,"13":16000,"14":15000,"15":14000}'
)
ON CONFLICT (id) DO NOTHING;
-- Cocoa standard curve
INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'cocoa_standard',
  'cocoa',
  'Cacao - Estándar',
  'Curva estándar para cacao',
  '{"0":0,"1":0,"2":0,"3":500,"4":1000,"5":1500,"6":1800,"7":2000,"8":2000,"9":1900,"10":1800}'
)
ON CONFLICT (id) DO NOTHING;
-- Coffee standard curve
INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'coffee_standard',
  'coffee',
  'Café - Estándar',
  'Curva estándar para café',
  '{"0":0,"1":0,"2":800,"3":1500,"4":1800,"5":2000,"6":1900,"7":1800,"8":1600,"9":1500}'
)
ON CONFLICT (id) DO NOTHING;
-- Cost templates (COP/ha) - rough defaults
INSERT INTO public.cost_templates (
  id, crop_id, name, description,
  land_rent_cop_per_ha, fertilizers_cop_per_ha, crop_protection_cop_per_ha,
  propagation_material_cop_per_ha, labor_cop_per_ha, irrigation_energy_cop_per_ha,
  maintenance_upkeep_cop_per_ha, harvest_cop_per_ha, transport_logistics_cop_per_ha,
  services_contracts_cop_per_ha, admin_overheads_cop_per_ha
) VALUES
  ('oil_palm_standard_2024', 'oil_palm', 'Palma de Aceite Estándar 2024', 'Costos típicos 2024',
   500000, 1200000, 300000, 100000, 2000000, 200000, 400000, 800000, 300000, 150000, 250000),
  ('cocoa_standard_2024', 'cocoa', 'Cacao Estándar 2024', 'Costos típicos 2024',
   300000, 600000, 250000, 120000, 1200000, 150000, 250000, 500000, 200000, 120000, 180000),
  ('coffee_standard_2024', 'coffee', 'Café Estándar 2024', 'Costos típicos 2024',
   350000, 800000, 300000, 150000, 1500000, 180000, 300000, 600000, 220000, 130000, 200000)
ON CONFLICT (id) DO NOTHING;

