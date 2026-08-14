INSERT INTO public.tags (slug, name) VALUES
  ('cuenta-de-ahorro', 'Cuenta de ahorro'),
  ('plazo-fijo', 'Plazo fijo'),
  ('amt', 'AMT'),
  ('acreditaciones', 'Acreditaciones'),
  ('debitos', 'Débitos'),
  ('cierre-de-cuenta', 'Cierre de cuenta')
ON CONFLICT (slug) DO NOTHING;