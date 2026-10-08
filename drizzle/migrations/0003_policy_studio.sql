CREATE TABLE public.policy_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  name text NOT NULL,
  segment text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  source_excerpt text NOT NULL DEFAULT '',
  design_status text NOT NULL DEFAULT 'relevada',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  line_id uuid REFERENCES public.policy_lines(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  version_label text NOT NULL DEFAULT 'v0.1',
  design_status text NOT NULL DEFAULT 'relevada',
  based_on_trace_id uuid REFERENCES public.policy_traces(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT '',
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  data_type text NOT NULL DEFAULT '',
  integration_id uuid REFERENCES public.policy_integrations(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_variable_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variable_id uuid NOT NULL REFERENCES public.policy_variables(id) ON DELETE CASCADE,
  node_id uuid REFERENCES public.policy_siisa_nodes(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.policy_rules(id) ON DELETE CASCADE,
  trace_id uuid REFERENCES public.policy_traces(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'entrada',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_rules
  ADD COLUMN line_id uuid REFERENCES public.policy_lines(id) ON DELETE SET NULL,
  ADD COLUMN segment text NOT NULL DEFAULT '',
  ADD COLUMN conditions text NOT NULL DEFAULT '',
  ADD COLUMN effect text NOT NULL DEFAULT '',
  ADD COLUMN precedence integer,
  ADD COLUMN exceptions text NOT NULL DEFAULT '',
  ADD COLUMN source_excerpt text NOT NULL DEFAULT '';

ALTER TABLE public.policy_questions
  ADD COLUMN line_id uuid REFERENCES public.policy_lines(id) ON DELETE SET NULL;

ALTER TABLE public.policy_siisa_nodes
  ADD COLUMN trace_id uuid REFERENCES public.policy_traces(id) ON DELETE CASCADE,
  ADD COLUMN question_id uuid REFERENCES public.policy_questions(id) ON DELETE SET NULL,
  ADD COLUMN pos_x double precision NOT NULL DEFAULT 0,
  ADD COLUMN pos_y double precision NOT NULL DEFAULT 0,
  ADD COLUMN source_excerpt text NOT NULL DEFAULT '',
  ADD COLUMN siisa_transformation text NOT NULL DEFAULT '',
  ADD COLUMN version_label text NOT NULL DEFAULT '';

ALTER TABLE public.policy_siisa_edges
  ADD COLUMN trace_id uuid REFERENCES public.policy_traces(id) ON DELETE CASCADE,
  ADD COLUMN kind text NOT NULL DEFAULT 'secundaria';

CREATE TABLE public.policy_walkthroughs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES public.policy_traces(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  path jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.policy_walkthroughs IS 'Recorridos manuales didácticos de una traza propuesta. No son otorgamientos ni ejecuciones SIISA.';

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['policy_lines','policy_traces','policy_variables','policy_variable_links','policy_walkthroughs'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Lectura autenticada" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins gestionan" ON public.%I FOR ALL TO authenticated USING (private.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (private.has_role(auth.uid(), ''admin''::app_role))', t);
  END LOOP;
END $$;

CREATE TRIGGER policy_lines_set_updated_at BEFORE UPDATE ON public.policy_lines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER policy_traces_set_updated_at BEFORE UPDATE ON public.policy_traces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Historial inmutable: solo alta y lectura
DROP POLICY "Admins gestionan" ON public.policy_change_log;
CREATE POLICY "Admins registran cambios" ON public.policy_change_log FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
REVOKE UPDATE, DELETE ON public.policy_change_log FROM authenticated;