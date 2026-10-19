import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LegalDocument = Database["public"]["Tables"]["legal_documents"]["Row"];
export type LegalCase = Database["public"]["Tables"]["legal_cases"]["Row"];
export type LegalCaseInput = Database["public"]["Tables"]["legal_cases"]["Insert"];
export type LegalCaseFile = Database["public"]["Tables"]["legal_case_files"]["Row"];

export const LEGAL_BUCKET = "legal-cases";

export const FILE_KINDS = [
  { value: "requerimiento", label: "Requerimiento, carta o correo recibido" },
  { value: "estado_deuda", label: "Estado de deuda y sus documentos" },
  { value: "legajo", label: "Legajos y documentación firmada" },
  { value: "conversacion", label: "Conversaciones y antecedentes" },
  { value: "contestacion", label: "Contestaciones y constancias de presentación" },
  { value: "otro", label: "Otro" },
] as const;

export const kindLabel = (v: string) => FILE_KINDS.find((k) => k.value === v)?.label ?? v;

export async function fetchLegalDocument(slug: string) {
  const { data, error } = await supabase.from("legal_documents").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateLegalDocument(id: string, body: string) {
  const { error } = await supabase.from("legal_documents").update({ body }).eq("id", id);
  if (error) throw error;
}

export async function fetchLegalCases() {
  const { data, error } = await supabase.from("legal_cases").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchLegalCase(id: string) {
  const { data, error } = await supabase.from("legal_cases").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveLegalCase(input: LegalCaseInput, id?: string) {
  const clean = { ...input, received_on: input.received_on || null };
  if (id) {
    const { error } = await supabase.from("legal_cases").update(clean).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase.from("legal_cases").insert(clean).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function fetchCaseFiles(caseId: string) {
  const { data, error } = await supabase
    .from("legal_case_files")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Cada archivo va a una ruta única dentro de la carpeta del caso, así nunca se pisan nombres repetidos. */
export async function uploadCaseFile(caseId: string, file: File, meta: { title: string; kind: string; notes: string }) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${caseId}/${crypto.randomUUID()}-${safe}`;
  const up = await supabase.storage.from(LEGAL_BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (up.error) throw up.error;
  const { error } = await supabase.from("legal_case_files").insert({
    case_id: caseId,
    title: meta.title || file.name,
    kind: meta.kind,
    notes: meta.notes,
    original_name: file.name,
    storage_path: path,
    size_bytes: file.size,
    mime_type: file.type,
  });
  if (error) {
    await supabase.storage.from(LEGAL_BUCKET).remove([path]);
    throw error;
  }
}

export async function caseFileUrl(f: LegalCaseFile, download = false) {
  const { data, error } = await supabase.storage
    .from(LEGAL_BUCKET)
    .createSignedUrl(f.storage_path, 600, download ? { download: f.original_name } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteCaseFile(f: LegalCaseFile) {
  const { error } = await supabase.storage.from(LEGAL_BUCKET).remove([f.storage_path]);
  if (error) throw error;
  const del = await supabase.from("legal_case_files").delete().eq("id", f.id);
  if (del.error) throw del.error;
}
