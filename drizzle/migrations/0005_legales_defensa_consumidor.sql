CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  defined_by text NOT NULL DEFAULT '',
  defined_on date,
  source_ref text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura autenticada" ON public.legal_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins gestionan" ON public.legal_documents FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE TRIGGER legal_documents_set_updated_at BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.legal_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_number text NOT NULL DEFAULT '',
  entity text NOT NULL DEFAULT '',
  member_name text NOT NULL DEFAULT '',
  member_id text NOT NULL DEFAULT '',
  sender text NOT NULL DEFAULT '',
  received_on date,
  deadlines text NOT NULL DEFAULT '',
  manager text NOT NULL DEFAULT '',
  bitrix_ref text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_cases TO authenticated;
GRANT ALL ON public.legal_cases TO service_role;
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo admins" ON public.legal_cases FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE TRIGGER legal_cases_set_updated_at BEFORE UPDATE ON public.legal_cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.legal_case_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'otro',
  notes text NOT NULL DEFAULT '',
  original_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX legal_case_files_case_idx ON public.legal_case_files(case_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_case_files TO authenticated;
GRANT ALL ON public.legal_case_files TO service_role;
ALTER TABLE public.legal_case_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo admins" ON public.legal_case_files FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin') AND storage_path LIKE case_id::text || '/%');

CREATE POLICY "Admins leen legal-cases" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'legal-cases' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins suben legal-cases" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'legal-cases' AND private.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins borran legal-cases" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'legal-cases' AND private.has_role(auth.uid(),'admin'));

INSERT INTO public.legal_documents (slug, title, defined_by, defined_on, source_ref, body) VALUES (
'defensa-consumidor',
'Procedimiento de atención a Defensa del Consumidor',
'Álvaro', '2026-10-17', 'Tarea 23351 de Bitrix24',
$b$## 1. Recepción y derivación

Los requerimientos se reciben por correo electrónico o por carta. La persona que los recibe en la institución debe derivarlos mediante la creación de una tarea en Bitrix24, asignando como responsable a Álvaro Joaquín Pajón Scocco.

## 2. Documentación en la tarea

En la tarea deben incorporarse el estado de deuda del socio, los documentos correspondientes a los estados de deuda y todos los legajos y demás documentación que el socio tenga firmados.

## 3. Revisión y contacto con el socio

El responsable debe revisar el estado de las deudas y comunicarse con el socio por medio del CRM, con la intención de llegar a un acuerdo. Álvaro debe estar incluido en la conversación.

## 4. Registro de conversaciones

Las conversaciones mantenidas deben guardarse en la misma tarea de Bitrix24.

## 5. Contestación

Se debe preparar y enviar la contestación desde un correo institucional de la entidad, dirigida a quien envió el requerimiento, con copia a Álvaro y a la persona de la institución que lo recibió.$b$
) ON CONFLICT (slug) DO NOTHING;