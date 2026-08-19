CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

ALTER POLICY "Admins ven todos los roles" ON public.user_roles USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins gestionan categorias" ON public.categories USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins gestionan etiquetas" ON public.tags USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins gestionan procesos" ON public.processes USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins gestionan process_tags" ON public.process_tags USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins gestionan adjuntos" ON public.attachments USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins suben material" ON storage.objects WITH CHECK ((bucket_id = ANY (ARRAY['process-videos'::text, 'process-docs'::text, 'process-attachments'::text])) AND private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins actualizan material" ON storage.objects USING ((bucket_id = ANY (ARRAY['process-videos'::text, 'process-docs'::text, 'process-attachments'::text])) AND private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK ((bucket_id = ANY (ARRAY['process-videos'::text, 'process-docs'::text, 'process-attachments'::text])) AND private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Admins borran material" ON storage.objects USING ((bucket_id = ANY (ARRAY['process-videos'::text, 'process-docs'::text, 'process-attachments'::text])) AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);