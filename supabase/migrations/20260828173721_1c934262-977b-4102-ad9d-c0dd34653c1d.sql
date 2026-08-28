INSERT INTO public.categories (slug, name, description, icon, sort_order)
VALUES ('sistemas', 'Sistemas', 'Procesos de tecnología, soporte y sistemas internos', 'Monitor', (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public.categories))
ON CONFLICT (slug) DO NOTHING;