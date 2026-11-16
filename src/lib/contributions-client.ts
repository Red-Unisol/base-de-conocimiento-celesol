import { supabase } from "@/integrations/supabase/client";
import { contributionRow } from "./contributions";

export async function submitContribution(input: unknown) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Ingresá con tu cuenta.");
  const { data, error } = await supabase.from("agent_contributions").insert(contributionRow(input, auth.user.id)).select().single();
  if (error) throw error;
  return data;
}
export async function fetchContributions() {
  const { data, error } = await supabase.from("agent_contributions").select("*, agent_recordings(id,name,path)").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}
export async function uploadRecording(contributionId: string, file: File) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Ingresá con tu cuenta.");
  const path = `${auth.user.id}/${contributionId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const upload = await supabase.storage.from("agent-recordings").upload(path, file, { upsert: false });
  if (upload.error) throw upload.error;
  const result = await supabase.from("agent_recordings").insert({ contribution_id: contributionId, name: file.name, path, size_bytes: file.size });
  if (result.error) throw new Error("El archivo se cargó pero no se pudo vincular. No vuelvas a guardar la propuesta; avisá al administrador.");
}