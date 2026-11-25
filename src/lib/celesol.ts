import { supabase } from "@/integrations/supabase/client";

/** Índice tipado de las fichas institucionales; el contenido vive en agent_contributions. */
export const CELESOL_ENTRIES = [
  { key: "mapa", id: "b1307411-bf98-4db7-8f0d-866b27fccb09", group: "Mapa" },
  { key: "sg", id: "ad09e64a-909d-4a2d-b050-fb6d1324d1cd", group: "Proveedores" },
  { key: "reba", id: "3f521b20-6187-4bb1-b230-6c2fd2557414", group: "Fondeadores" },
] as const;
export type CelesolKey = (typeof CELESOL_ENTRIES)[number]["key"];

export async function fetchCelesolEntries() {
  const { data, error } = await supabase
    .from("agent_contributions")
    .select("id, title, content_markdown, status")
    .in("id", CELESOL_ENTRIES.map((e) => e.id));
  if (error) throw error;
  return CELESOL_ENTRIES.map((e) => ({ ...e, row: data?.find((r) => r.id === e.id) ?? null }));
}
