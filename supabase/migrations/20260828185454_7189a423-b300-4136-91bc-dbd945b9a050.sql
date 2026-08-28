-- 1. Perfiles de usuarios registrados
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfil propio o admin" ON public.profiles;
CREATE POLICY "Perfil propio o admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Actualiza su propio perfil" ON public.profiles;
CREATE POLICY "Actualiza su propio perfil" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Crea su propio perfil" ON public.profiles;
CREATE POLICY "Crea su propio perfil" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 2. Alta automática: perfil + rol usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, coalesce(NEW.email, ''))
  ON CONFLICT (id) DO UPDATE SET email = excluded.email;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Perfiles y rol base para las cuentas ya existentes
INSERT INTO public.profiles (id, email, created_at)
SELECT u.id, coalesce(u.email, ''), u.created_at FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'usuario'::app_role FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. El admin gestiona roles
DROP POLICY IF EXISTS "Admins asignan roles" ON public.user_roles;
CREATE POLICY "Admins asignan roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins quitan roles" ON public.user_roles;
CREATE POLICY "Admins quitan roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

GRANT INSERT, DELETE ON public.user_roles TO authenticated;

-- 4. Categorias restringidas por rol
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS required_role public.app_role;
UPDATE public.categories SET required_role = 'it'::app_role WHERE slug = 'sistemas';

CREATE OR REPLACE FUNCTION private.can_view_category(_category_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _category_id IS NULL THEN true
    ELSE COALESCE(
      (
        SELECT c.required_role IS NULL
          OR private.has_role(auth.uid(), 'admin'::app_role)
          OR private.has_role(auth.uid(), c.required_role)
        FROM public.categories c
        WHERE c.id = _category_id
      ),
      true
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION private.can_view_category(uuid) TO authenticated;

DROP POLICY IF EXISTS "Lectura autenticada de categorias" ON public.categories;
CREATE POLICY "Lectura autenticada de categorias" ON public.categories
  FOR SELECT TO authenticated
  USING (private.can_view_category(id));

DROP POLICY IF EXISTS "Lectura autenticada de procesos" ON public.processes;
CREATE POLICY "Lectura autenticada de procesos" ON public.processes
  FOR SELECT TO authenticated
  USING (private.can_view_category(category_id));

DROP POLICY IF EXISTS "Lectura autenticada de process_tags" ON public.process_tags;
CREATE POLICY "Lectura autenticada de process_tags" ON public.process_tags
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = process_tags.process_id
      AND private.can_view_category(p.category_id)
  ));

DROP POLICY IF EXISTS "Lectura autenticada de adjuntos" ON public.attachments;
CREATE POLICY "Lectura autenticada de adjuntos" ON public.attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = attachments.process_id
      AND private.can_view_category(p.category_id)
  ));