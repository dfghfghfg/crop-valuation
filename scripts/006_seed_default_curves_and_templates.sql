-- === Age–Yield Curves (kg/ha) ===
INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'oil_palm_palmaeguinensis',
  'oil_palm',
  'Palma de Aceite – PalmaEguinensis (Urabá)',
  'Curva por edad (kg/ha) derivada de "Ventas Por Cosecha" – 2025-09-01',
  '{"1":0,"2":0,"3":8400,"4":15600,"5":20400,"6":22800,"7":23500,"8":24000,"9":24000,"10":24000,"11":24000,"12":24000,"13":24000,"14":24000,"15":24000}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;

-- Café / Coffee age-yield curve (kg/ha) — 8-year series
INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'coffee_cafe',
  'coffee',
  'Café – Curva por edad (kg/ha)',
  'Curva por edad (kg/ha) para café, 8 años',
  '{"1":0,"2":625,"3":3000,"4":3875,"5":3900,"6":3900,"7":3000,"8":2500}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'oil_palm_oxg',
  'oil_palm',
  'Palma de Aceite – OxG (Urabá)',
  'Curva por edad (kg/ha) derivada de "Ventas Por Cosecha" – 2025-09-01',
  '{"1":0,"2":0,"3":14000,"4":26000,"5":34000,"6":38000,"7":39200,"8":40000,"9":40000,"10":40000,"11":40000,"12":40000,"13":39600,"14":39200,"15":39200,"16":38400,"17":38000,"18":38000,"19":37200,"20":36500,"21":35800,"22":35000,"23":34300,"24":33700,"25":33000}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;
  
-- Avocado / Aguacate age-yield curve (kg/ha) — 15-year series
INSERT INTO public.age_yield_curves (id, crop_id, name, description, curve_data)
VALUES (
  'avocado_aguacate',
  'avocado',
  'Aguacate – Curva por edad (kg/ha)',
  'Curva por edad (kg/ha) para aguacate, 15 años',
  '{"1":0,"2":1500,"3":4000,"4":8000,"5":12000,"6":16000,"7":18000,"8":18000,"9":18000,"10":18000,"11":18000,"12":18000,"13":16000,"14":12000,"15":10000}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;

-- NOTE: The sheet has no separate age–yield for "PalmaEguinensis ANTIOQUIA".
-- Use the PalmaEguinensis curve above for Antioquia unless you have a distinct source.

-- === Cost Curves (COP/ha por edad) ===

-- PalmaEguinensis cost curve — 15-year series
INSERT INTO public.cost_curves (id, crop_id, name, description, curve_data)
VALUES (
  'oil_palm_cost_palmaeguinensis',
  'oil_palm',
  'Costos consolidados – PalmaEguinensis (COP/ha por edad)',
  'Derivado de "Costo Consolidado Año" – 2025-09-01',
  '{"1":11705939.1316,"2":5447443.3625,"3":7335845.5704,"4":7324498.3060,"5":7324498.3060,"6":7324498.3060,"7":7324498.3060,"8":7324498.3060,"9":7324498.3060,"10":7324498.3060,"11":7324498.3060,"12":7324498.3060,"13":7324498.3060,"14":7324498.3060,"15":7324498.3060}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;

-- Café cost curve — 8-year series
INSERT INTO public.cost_curves (id, crop_id, name, description, curve_data)
VALUES (
  'coffee_cost_standard',
  'coffee',
  'Costos consolidados – Café (COP/ha por edad)',
  'Curva de costos por edad para café, valores provistos',
  '{"1":12650474.50,"2":10144508.18,"3":10144508.18,"4":10144508.18,"5":10144508.18,"6":10144508.18,"7":10144508.18,"8":10144508.18}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;

-- OxG cost curve — 25-year series
INSERT INTO public.cost_curves (id, crop_id, name, description, curve_data)
VALUES (
  'oil_palm_cost_oxg',
  'oil_palm',
  'Costos consolidados – OxG (COP/ha por edad)',
  'Derivado de "Costo Consolidado Año" – 2025-09-01',
  '{"1":12865139.1316,"2":7718997.5095,"3":10982967.5829,"4":10982967.5829,"5":10982967.5829,"6":10982967.5829,"7":10982967.5829,"8":10982967.5829,"9":10982967.5829,"10":10982967.5829,"11":10982967.5829,"12":10982967.5829,"13":10982967.5829,"14":10982967.5829,"15":10982967.5829,"16":10982967.5829,"17":10982967.5829,"18":10982967.5829,"19":10982967.5829,"20":10982967.5829,"21":10982967.5829,"22":10982967.5829,"23":10982967.5829,"24":10982967.5829,"25":10982967.5829}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;

-- Aguacate cost curve — 15-year series
INSERT INTO public.cost_curves (id, crop_id, name, description, curve_data)
VALUES (
  'avocado_cost_standard',
  'avocado',
  'Costos consolidados – Aguacate (COP/ha por edad)',
  'Curva de costos por edad para aguacate, valores provistos',
  '{"1":18345637.0,"2":13613069.0,"3":18839008.0,"4":18839008.0,"5":18839008.0,"6":18839008.0,"7":18839008.0,"8":18839008.0,"9":18839008.0,"10":18839008.0,"11":18839008.45,"12":18839008.45,"13":18839008.45,"14":18839008.45,"15":18839008.45}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET curve_data = EXCLUDED.curve_data, name = EXCLUDED.name, description = EXCLUDED.description;
