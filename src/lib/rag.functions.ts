import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RagSource = { id: string; title: string; slug: string; category: string };
export type RagAnswer = { answer: string; sources: RagSource[]; error?: string };

/** Indexa un proceso: guarda el texto del documento y regenera sus fragmentos semánticos. */
export const indexProcess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { processId: string; documentText?: string }) => {
    if (!input?.processId) throw new Error("Falta el proceso a indexar.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Sólo el administrador puede indexar.");

    const { data: proc, error: pErr } = await supabase
      .from("processes")
      .select("id, title, summary, document_text, document_markdown, categories(name)")
      .eq("id", data.processId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!proc) throw new Error("No encontramos el proceso.");

    const { buildChunks, embed, normalizeText } = await import("@/lib/rag.server");

    const incoming = data.documentText ? normalizeText(data.documentText) : "";
    const text = incoming || proc.document_text || proc.document_markdown || "";

    if (incoming && incoming !== proc.document_text) {
      const { error } = await supabase
        .from("processes")
        .update({ document_text: incoming })
        .eq("id", proc.id);
      if (error) throw error;
    }

    const chunks = buildChunks(
      {
        title: proc.title,
        category: (proc.categories as { name: string } | null)?.name ?? "Sin categoría",
        summary: proc.summary ?? "",
      },
      text,
    );

    const vectors = await embed(chunks);

    const { error: delErr } = await supabase.from("process_chunks").delete().eq("process_id", proc.id);
    if (delErr) throw delErr;

    const rows = chunks.map((content, i) => ({
      process_id: proc.id,
      chunk_index: i,
      content,
      embedding: JSON.stringify(vectors[i]),
    }));

    for (let i = 0; i < rows.length; i += 40) {
      const { error } = await supabase.from("process_chunks").insert(rows.slice(i, i + 40));
      if (error) throw error;
    }

    const { error: stampErr } = await supabase
      .from("processes")
      .update({ indexed_at: new Date().toISOString() })
      .eq("id", proc.id);
    if (stampErr) throw stampErr;

    return { chunks: rows.length, hasText: text.trim().length > 0 };
  });

/** Consulta la base de conocimiento: recupera fragmentos por significado y redacta la respuesta. */
export const askKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => {
    const q = (input?.query ?? "").trim();
    if (!q) throw new Error("Escribí una consulta.");
    return { query: q.slice(0, 500) };
  })
  .handler(async ({ data, context }): Promise<RagAnswer> => {
    const { supabase } = context;
    const { answerFromContext, embed } = await import("@/lib/rag.server");

    let vector: number[];
    try {
      [vector] = await embed([data.query]);
    } catch (e) {
      return { answer: "", sources: [], error: (e as Error).message };
    }

    const { data: matches, error } = await supabase.rpc("match_process_chunks", {
      query_embedding: JSON.stringify(vector),
      match_count: 8,
    });
    if (error) throw error;

    const rows = matches ?? [];
    if (rows.length === 0) {
      return {
        answer:
          "No encontré documentación interna relacionada con esa consulta. Probá con otros términos o revisá las categorías del menú lateral.",
        sources: [],
      };
    }

    const ids = [...new Set(rows.map((r) => r.process_id))];
    const { data: procs, error: pErr } = await supabase
      .from("processes")
      .select("id, title, slug, categories(name)")
      .in("id", ids);
    if (pErr) throw pErr;

    const byId = new Map(
      (procs ?? []).map((p) => [
        p.id,
        {
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: (p.categories as { name: string } | null)?.name ?? "Sin categoría",
        },
      ]),
    );

    const context_rows = rows
      .filter((r) => byId.has(r.process_id))
      .map((r) => {
        const p = byId.get(r.process_id)!;
        return { title: p.title, slug: p.slug, category: p.category, content: r.content };
      });

    const sources: RagSource[] = [];
    for (const r of context_rows) {
      const p = [...byId.values()].find((x) => x.slug === r.slug)!;
      if (!sources.some((s) => s.id === p.id)) sources.push(p);
    }

    try {
      const answer = await answerFromContext(data.query, context_rows);
      return { answer, sources };
    } catch (e) {
      return { answer: "", sources, error: (e as Error).message };
    }
  });
