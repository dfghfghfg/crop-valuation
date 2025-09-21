-- Seed data for departamentos and municipios lookup tables

-- Insert Colombian departamentos
INSERT INTO public.departamentos (id, name, code) VALUES
  ('antioquia', 'Antioquia', '05'),
  ('atlantico', 'Atlántico', '08'),
  ('bogota', 'Bogotá D.C.', '11'),
  ('bolivar', 'Bolívar', '13'),
  ('boyaca', 'Boyacá', '15'),
  ('caldas', 'Caldas', '17'),
  ('caqueta', 'Caquetá', '18'),
  ('cauca', 'Cauca', '19'),
  ('cesar', 'Cesar', '20'),
  ('cordoba', 'Córdoba', '23'),
  ('cundinamarca', 'Cundinamarca', '25'),
  ('choco', 'Chocó', '27'),
  ('huila', 'Huila', '41'),
  ('la_guajira', 'La Guajira', '44'),
  ('magdalena', 'Magdalena', '47'),
  ('meta', 'Meta', '50'),
  ('nariño', 'Nariño', '52'),
  ('norte_santander', 'Norte de Santander', '54'),
  ('quindio', 'Quindío', '63'),
  ('risaralda', 'Risaralda', '66'),
  ('santander', 'Santander', '68'),
  ('sucre', 'Sucre', '70'),
  ('tolima', 'Tolima', '73'),
  ('valle_cauca', 'Valle del Cauca', '76'),
  ('arauca', 'Arauca', '81'),
  ('casanare', 'Casanare', '85'),
  ('putumayo', 'Putumayo', '86'),
  ('amazonas', 'Amazonas', '91'),
  ('guainia', 'Guainía', '94'),
  ('guaviare', 'Guaviare', '95'),
  ('vaupes', 'Vaupés', '97'),
  ('vichada', 'Vichada', '99')
ON CONFLICT (id) DO NOTHING;

-- Insert key municipios for agricultural regions
INSERT INTO public.municipios (id, departamento_id, name, code) VALUES
  -- Antioquia
  ('medellin', 'antioquia', 'Medellín', '05001'),
  ('bello', 'antioquia', 'Bello', '05088'),
  ('apartado', 'antioquia', 'Apartadó', '05045'),
  ('turbo', 'antioquia', 'Turbo', '05854'),
  ('rionegro', 'antioquia', 'Rionegro', '05615'),
  ('envigado', 'antioquia', 'Envigado', '05222'),
  ('itagui', 'antioquia', 'Itagüí', '05360'),

  -- Bogotá
  ('bogota', 'bogota', 'Bogotá D.C.', '11001'),

  -- Valle del Cauca
  ('cali', 'valle_cauca', 'Cali', '76001'),
  ('buenaventura', 'valle_cauca', 'Buenaventura', '76109'),
  ('palmira', 'valle_cauca', 'Palmira', '76520'),
  ('yumbo', 'valle_cauca', 'Yumbo', '76892'),
  ('tulua', 'valle_cauca', 'Tuluá', '76834'),
  ('buga', 'valle_cauca', 'Guadalajara de Buga', '76111'),

  -- Meta
  ('villavicencio', 'meta', 'Villavicencio', '50001'),
  ('acacias', 'meta', 'Acacías', '50006'),
  ('granada', 'meta', 'Granada', '50313'),
  ('puerto_lopez', 'meta', 'Puerto López', '50573'),
  ('san_martin', 'meta', 'San Martín', '50680'),

  -- Casanare
  ('yopal', 'casanare', 'Yopal', '85001'),
  ('aguazul', 'casanare', 'Aguazul', '85010'),
  ('maní', 'casanare', 'Maní', '85139'),
  ('tauramena', 'casanare', 'Tauramena', '85410'),

  -- Cesar
  ('valledupar', 'cesar', 'Valledupar', '20001'),
  ('aguachica', 'cesar', 'Aguachica', '20011'),
  ('bosconia', 'cesar', 'Bosconia', '20060'),
  ('curumani', 'cesar', 'Curumaní', '20238'),
  ('la_paz', 'cesar', 'La Paz', '20383'),

  -- Magdalena
  ('santa_marta', 'magdalena', 'Santa Marta', '47001'),
  ('cienaga', 'magdalena', 'Ciénaga', '47189'),
  ('fundacion', 'magdalena', 'Fundación', '47288'),
  ('aracataca', 'magdalena', 'Aracataca', '47058'),

  -- Bolívar
  ('cartagena', 'bolivar', 'Cartagena', '13001'),
  ('magangue', 'bolivar', 'Magangué', '13433'),
  ('turbaco', 'bolivar', 'Turbaco', '13838'),

  -- Santander
  ('bucaramanga', 'santander', 'Bucaramanga', '68001'),
  ('floridablanca', 'santander', 'Floridablanca', '68276'),
  ('girardot', 'santander', 'Girardot', '68307'),
  ('barrancabermeja', 'santander', 'Barrancabermeja', '68081'),

  -- Norte de Santander
  ('cucuta', 'norte_santander', 'Cúcuta', '54001'),
  ('ocana', 'norte_santander', 'Ocaña', '54498'),
  ('pamplona', 'norte_santander', 'Pamplona', '54518'),

  -- Tolima
  ('ibague', 'tolima', 'Ibagué', '73001'),
  ('espinal', 'tolima', 'Espinal', '73268'),
  ('melgar', 'tolima', 'Melgar', '73449'),

  -- Cundinamarca
  ('bogota', 'cundinamarca', 'Bogotá', '25001'), -- Bogotá is also in Cundinamarca for administrative purposes
  ('soacha', 'cundinamarca', 'Soacha', '25754'),
  ('zipaquira', 'cundinamarca', 'Zipaquirá', '25899'),
  ('facatativa', 'cundinamarca', 'Facatativá', '25269'),
  ('fusagasuga', 'cundinamarca', 'Fusagasugá', '25290'),

  -- Huila
  ('neiva', 'huila', 'Neiva', '41001'),
  ('pitalito', 'huila', 'Pitalito', '41551'),
  ('garzon', 'huila', 'Garzón', '41298'),

  -- Cauca
  ('popayan', 'cauca', 'Popayán', '19001'),
  ('santander_de_quilichao', 'cauca', 'Santander de Quilichao', '19698'),

  -- Nariño
  ('pasto', 'nariño', 'Pasto', '52001'),
  ('tumaco', 'nariño', 'Tumaco', '52835'),
  ('ipiales', 'nariño', 'Ipiales', '52356'),

  -- Córdoba
  ('monteria', 'cordoba', 'Montería', '23001'),
  ('cerete', 'cordoba', 'Cereté', '23162'),
  ('lorica', 'cordoba', 'Lorica', '23417'),

  -- Sucre
  ('sincelejo', 'sucre', 'Sincelejo', '70001'),
  ('corozal', 'sucre', 'Corozal', '70215'),

  -- Atlántico
  ('barranquilla', 'atlantico', 'Barranquilla', '08001'),
  ('soledad', 'atlantico', 'Soledad', '08758'),
  ('malambo', 'atlantico', 'Malambo', '08433'),

  -- La Guajira
  ('rioacha', 'la_guajira', 'Riohacha', '44001'),
  ('maicao', 'la_guajira', 'Maicao', '44430'),

  -- Caldas
  ('manizales', 'caldas', 'Manizales', '17001'),
  ('villamaria', 'caldas', 'Villamaría', '17877'),

  -- Risaralda
  ('pereira', 'risaralda', 'Pereira', '66001'),
  ('dosquebradas', 'risaralda', 'Dosquebradas', '66170'),

  -- Quindío
  ('armenia', 'quindio', 'Armenia', '63001'),
  ('calarca', 'quindio', 'Calarcá', '63130'),

  -- Boyacá
  ('tunja', 'boyaca', 'Tunja', '15001'),
  ('duitama', 'boyaca', 'Duitama', '15238'),
  ('sogamoso', 'boyaca', 'Sogamoso', '15759'),

  -- Arauca
  ('arauca', 'arauca', 'Arauca', '81001'),
  ('tame', 'arauca', 'Tame', '81736'),

  -- Putumayo
  ('mocoa', 'putumayo', 'Mocoa', '86001'),
  ('puerto_asis', 'putumayo', 'Puerto Asís', '86568'),

  -- Caquetá
  ('florencia', 'caqueta', 'Florencia', '18001'),
  ('san_vicente_del_caguan', 'caqueta', 'San Vicente del Caguán', '18753'),

  -- Chocó
  ('quibdo', 'choco', 'Quibdó', '27001'),
  ('istmina', 'choco', 'Istmina', '27372')
ON CONFLICT (id) DO NOTHING;
