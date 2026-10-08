CREATE TYPE public.policy_rule_status AS ENUM ('CONFIRMADA','PENDIENTE_VALIDACION','INCOMPLETA_EN_MANUAL','CONTRADICCION_A_RESOLVER','NO_AUTOMATIZABLE_HOY');

CREATE TABLE public.policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  code text NOT NULL DEFAULT '',
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  scope text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendiente_carga',
  working_version text NOT NULL DEFAULT '',
  source_url text,
  parent_policy_id uuid REFERENCES public.policies(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT '',
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'no_definido',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'otro',
  external_url text,
  storage_path text,
  version_label text NOT NULL DEFAULT '',
  doc_date date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  block text NOT NULL DEFAULT '',
  original_text text NOT NULL DEFAULT '',
  variable text NOT NULL DEFAULT '',
  data_source text NOT NULL DEFAULT '',
  integration_id uuid REFERENCES public.policy_integrations(id) ON DELETE SET NULL,
  operator text NOT NULL DEFAULT '',
  threshold text NOT NULL DEFAULT '',
  action_result text NOT NULL DEFAULT '',
  modifies_limit boolean NOT NULL DEFAULT false,
  modifies_term boolean NOT NULL DEFAULT false,
  allows_exception boolean NOT NULL DEFAULT false,
  manual_intervention boolean NOT NULL DEFAULT false,
  definition_status public.policy_rule_status NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  question text NOT NULL,
  status text NOT NULL DEFAULT 'abierta',
  answer text NOT NULL DEFAULT '',
  validated_by text NOT NULL DEFAULT '',
  validated_at date,
  agreed_definition text NOT NULL DEFAULT '',
  validity_scope text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_question_rules (
  question_id uuid NOT NULL REFERENCES public.policy_questions(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES public.policy_rules(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, rule_id)
);

CREATE TABLE public.policy_siisa_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.policy_rules(id) ON DELETE SET NULL,
  label text NOT NULL DEFAULT '',
  node_type text NOT NULL DEFAULT 'otro',
  inputs text NOT NULL DEFAULT '',
  outputs text NOT NULL DEFAULT '',
  called_policy_id uuid REFERENCES public.policies(id) ON DELETE SET NULL,
  integration_id uuid REFERENCES public.policy_integrations(id) ON DELETE SET NULL,
  data_origin text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  impl_status text NOT NULL DEFAULT 'no_definido',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_siisa_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  from_node_id uuid NOT NULL REFERENCES public.policy_siisa_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES public.policy_siisa_nodes(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.policy_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  version_label text NOT NULL DEFAULT '',
  change_type text NOT NULL DEFAULT 'edicion',
  description text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['policies','policy_integrations','policy_documents','policy_rules','policy_questions','policy_question_rules','policy_siisa_nodes','policy_siisa_edges','policy_change_log'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Lectura autenticada" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins gestionan" ON public.%I FOR ALL TO authenticated USING (private.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (private.has_role(auth.uid(), ''admin''::app_role))', t);
  END LOOP;
END $$;

CREATE TRIGGER policies_set_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER policy_rules_set_updated_at BEFORE UPDATE ON public.policy_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER policy_questions_set_updated_at BEFORE UPDATE ON public.policy_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.policies (slug, name, sort_order) VALUES
('santa-fe','Santa Fe',1),('cde','CDE',2),('la-medica','La Médica',3),('amperpag','AMPERPAG',4),
('amejuca','AMEJUCA',5),('mudon','MUDON',6),('daspu','DASPU',7),('caja-de-jubilados','Caja de Jubilados',8),
('mupol','MUPOL',9),('muni-c-paz','Muni C. Paz',10),('cbu','CBU',11),('amelar','AMELAR',12);