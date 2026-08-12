CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Usuarios ven sus propios roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins ven todos los roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Folder',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticada de categorias" ON public.categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan categorias" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticada de etiquetas" ON public.tags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan etiquetas" ON public.tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  author text NOT NULL DEFAULT '',
  duration_label text NOT NULL DEFAULT '',
  video_path text,
  video_source_url text,
  poster_path text,
  document_path text,
  document_markdown text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processes_status_check CHECK (status IN ('draft', 'published'))
);
CREATE INDEX processes_category_idx ON public.processes (category_id);
CREATE INDEX processes_updated_idx ON public.processes (updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processes TO authenticated;
GRANT ALL ON public.processes TO service_role;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticada de procesos" ON public.processes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan procesos" ON public.processes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER processes_set_updated_at BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.process_tags (
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_tags TO authenticated;
GRANT ALL ON public.process_tags TO service_role;
ALTER TABLE public.process_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticada de process_tags" ON public.process_tags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan process_tags" ON public.process_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attachments_process_idx ON public.attachments (process_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticada de adjuntos" ON public.attachments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan adjuntos" ON public.attachments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.categories (slug, name, description, icon, sort_order) VALUES
  ('contabilidad', 'Contabilidad', 'Registración, conciliaciones y cierres contables de la mutual.', 'Calculator', 1),
  ('cobranzas', 'Cobranzas', 'Gestión de cuotas, mora y acuerdos de pago con socios.', 'Banknote', 2),
  ('ahorros-y-amt', 'Ahorros y AMT', 'Cuentas de ahorro mutual y ayuda económica con fondos propios.', 'PiggyBank', 3),
  ('mesa-de-entrada', 'Mesa de Entrada', 'Recepción, caratulado y derivación de documentación.', 'Inbox', 4),
  ('analisis', 'Análisis', 'Evaluación crediticia, scoring y análisis de riesgo.', 'LineChart', 5),
  ('management', 'Management', 'Tableros, indicadores y procesos de conducción.', 'Briefcase', 6);

INSERT INTO public.tags (slug, name) VALUES
  ('alta-de-socio', 'Alta de socio'),
  ('creditos', 'Créditos'),
  ('conciliacion', 'Conciliación'),
  ('auditoria', 'Auditoría'),
  ('normativa-inaes', 'Normativa INAES'),
  ('caja', 'Caja'),
  ('mora', 'Mora'),
  ('sistema', 'Sistema'),
  ('reportes', 'Reportes'),
  ('onboarding', 'Onboarding');