import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_content", title: "Buscar políticas y procedimientos",
  description: "Busca contenido permitido por título; devuelve identificadores para leerlo o proponer cambios.",
  inputSchema: { kind: z.enum(["policy", "process"]), query: z.string().max(200).default(""), limit: z.number().int().min(1).max(50).default(20) },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ kind, query, limit }, ctx) => {
    const db = supabaseForUser(ctx);
    const result = kind === "policy"
      ? await db.from("policies").select("id,slug,name,description,status,working_version").ilike("name", `%${query}%`).order("name").limit(limit)
      : await db.from("processes").select("id,slug,title,summary,status").ilike("title", `%${query}%`).order("title").limit(limit);
    if (result.error) return { isError: true, content: [{ type: "text", text: "No se pudo consultar el contenido permitido." }] };
    return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
  },
});