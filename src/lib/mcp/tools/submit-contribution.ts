import { defineTool } from "@lovable.dev/mcp-js";
import { contributionSchema, contributionRow } from "@/lib/contributions";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "submit_contribution", title: "Guardar propuesta para revisión",
  description: "Guarda una propuesta o corrección con pasos numerados y fuentes. No modifica contenido vigente ni valida reglas; videos largos se procesan fuera de esta llamada y se aporta su transcripción.",
  inputSchema: contributionSchema.shape,
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const userId = ctx.getUserId();
    if (!userId) throw new Error("Ingresá con tu cuenta.");
    const { data, error } = await supabaseForUser(ctx).from("agent_contributions").insert(contributionRow(input, userId)).select("id,title,status").single();
    if (error) return { isError: true, content: [{ type: "text", text: "No se pudo guardar: verificá que el destino exista y esté permitido para tu cuenta." }] };
    return { content: [{ type: "text", text: `Propuesta ${data.id} guardada como pendiente de revisión. El contenido vigente no cambió.` }] };
  },
});