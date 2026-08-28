CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.processes ADD COLUMN IF NOT EXISTS document_text text;
ALTER TABLE public.processes ADD COLUMN IF NOT EXISTS indexed_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.process_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding extensions.vector(1536) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS process_chunks_unique ON public.process_chunks (process_id, chunk_index);

GRANT SELECT ON public.process_chunks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.process_chunks TO authenticated;
GRANT ALL ON public.process_chunks TO service_role;

ALTER TABLE public.process_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura autenticada de fragmentos" ON public.process_chunks;
CREATE POLICY "Lectura autenticada de fragmentos"
  ON public.process_chunks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.processes p WHERE p.id = process_chunks.process_id AND private.can_view_category(p.category_id)));

DROP POLICY IF EXISTS "Admins gestionan fragmentos" ON public.process_chunks;
CREATE POLICY "Admins gestionan fragmentos"
  ON public.process_chunks FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.match_process_chunks(query_embedding extensions.vector(1536), match_count integer DEFAULT 8)
RETURNS TABLE (process_id uuid, chunk_index integer, content text, similarity double precision)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT c.process_id, c.chunk_index, c.content, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.process_chunks c
  ORDER BY c.embedding <=> query_embedding
  LIMIT greatest(1, least(match_count, 30));
$$;

REVOKE ALL ON FUNCTION public.match_process_chunks(extensions.vector(1536), integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_process_chunks(extensions.vector(1536), integer) TO authenticated, service_role;