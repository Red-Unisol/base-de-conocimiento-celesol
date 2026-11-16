import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
export default defineTool({
  name: "list_contributions", title: "Ver aportes guardados",
  description: "Consulta aportes visibles: propios para colaboradores, todos para administradores.",
  inputSchema: { limit: z.number().int().min(1).max(50).default(20) },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("agent_contributions").select("id,kind,title,content_markdown,source_notes,status,review_notes,created_at").order("created_at", { ascending: false }).limit(limit);
    return error ? { isError: true, content: [{ type: "text", text: "No se pudieron consultar los aportes." }] } : { content: [{ type: "text", text: JSON.stringify(data) }] };
  },
});