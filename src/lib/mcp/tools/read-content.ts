import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "read_content", title: "Leer política o procedimiento",
  description: "Lee un contenido permitido. Las políticas son diseños manuales, no decisiones crediticias ejecutables; no confirmar reglas ni inventar condiciones.",
  inputSchema: { kind: z.enum(["policy", "process"]), id: z.string().uuid() },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ kind, id }, ctx) => {
    const db = supabaseForUser(ctx);
    if (kind === "process") {
      const { data, error } = await db.from("processes").select("id,slug,title,summary,document_markdown,status,updated_at").eq("id", id).maybeSingle();
      if (error || !data) return { isError: true, content: [{ type: "text", text: "Procedimiento no disponible para esta cuenta." }] };
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
    const policy = await db.from("policies").select("id,slug,name,description,status,working_version").eq("id", id).maybeSingle();
    if (policy.error || !policy.data) return { isError: true, content: [{ type: "text", text: "Política no disponible para esta cuenta." }] };
    const results = await Promise.all([
      db.from("policy_rules").select("*").eq("policy_id", id).order("sort_order").limit(200),
      db.from("policy_questions").select("*").eq("policy_id", id).limit(200),
      db.from("policy_lines").select("*").eq("policy_id", id).limit(100),
      db.from("policy_traces").select("*").eq("policy_id", id).limit(100),
      db.from("policy_siisa_nodes").select("*").eq("policy_id", id).limit(300),
      db.from("policy_siisa_edges").select("*").eq("policy_id", id).limit(500),
    ]);
    if (results.some(r => r.error)) return { isError: true, content: [{ type: "text", text: "No se pudo leer el diseño completo." }] };
    return { content: [{ type: "text", text: JSON.stringify({ policy: policy.data, rules: results[0]?.data, questions: results[1]?.data, lines: results[2]?.data, traces: results[3]?.data, nodes: results[4]?.data, edges: results[5]?.data, bounded: true, notice: "Blueprint para implementación manual; no es ejecución ni importación oficial. Resultados acotados; no interpretar ausencias como ausencia de reglas." }) }] };
  },
});