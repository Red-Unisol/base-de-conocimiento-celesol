import { z } from "zod";

export const contributionSchema = z.object({
  kind: z.enum(["policy", "process"]),
  target_id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  content_markdown: z.string().trim().min(1).max(100000),
  source_notes: z.string().max(10000).default(""),
});
export function contributionRow(value: unknown, userId: string) {
  const input = contributionSchema.parse(value);
  return {
    created_by: userId, kind: input.kind, title: input.title,
    content_markdown: input.content_markdown, source_notes: input.source_notes,
    policy_id: input.kind === "policy" ? input.target_id ?? null : null,
    process_id: input.kind === "process" ? input.target_id ?? null : null,
    status: "pendiente" as const,
  };
}