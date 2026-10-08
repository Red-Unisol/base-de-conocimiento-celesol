/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export const POLICY_BUCKET = "policy-docs";

export const POLICY_STATUSES = [
  { value: "pendiente_carga", label: "Pendiente de carga" },
  { value: "en_relevamiento", label: "En relevamiento" },
  { value: "en_validacion", label: "En validación" },
  { value: "validada", label: "Validada" },
  { value: "en_diseno_siisa", label: "En diseño SIISA" },
];

export const DOC_TYPES = [
  { value: "manual", label: "Manual" },
  { value: "anexo", label: "Anexo" },
  { value: "documento_trabajo", label: "Documento de trabajo" },
  { value: "manual_siisa", label: "Manual SIISA" },
  { value: "otro", label: "Otro" },
];

export const RULE_STATUSES = [
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "PENDIENTE_VALIDACION", label: "Pendiente de validación" },
  { value: "INCOMPLETA_EN_MANUAL", label: "Incompleta en manual" },
  { value: "CONTRADICCION_A_RESOLVER", label: "Contradicción a resolver" },
  { value: "NO_AUTOMATIZABLE_HOY", label: "No automatizable hoy" },
];

export const QUESTION_STATUSES = [
  { value: "abierta", label: "Abierta" },
  { value: "resuelta", label: "Resuelta" },
];

export const NODE_TYPES = [
  "Inicio", "Test Binario", "Decisión", "Matriz", "Llamador", "Cálculo",
  "Comentario", "Concurrente", "REST/Parser", "otro",
].map((v) => ({ value: v, label: v }));

export const IMPL_STATUSES = [
  { value: "no_definido", label: "No definido" },
  { value: "disenado", label: "Diseñado" },
  { value: "listo_siisa", label: "Listo para SIISA" },
  { value: "implementado", label: "Implementado (registro interno)" },
];

export const CHANGE_TYPES = [
  { value: "edicion", label: "Edición" },
  { value: "nueva_version", label: "Nueva versión" },
  { value: "documento", label: "Documento" },
  { value: "regla", label: "Regla" },
  { value: "duda", label: "Duda" },
  { value: "siisa", label: "Diseño SIISA" },
];

export const INTEGRATION_STATUSES = [
  { value: "no_definido", label: "No definido" },
  { value: "identificado", label: "Identificado" },
  { value: "disponible", label: "Disponible" },
];

export function labelOf(list: { value: string; label: string }[], v: string | null | undefined) {
  return list.find((o) => o.value === v)?.label ?? v ?? "—";
}

export type PolicySummary = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  status: string;
  working_version: string;
  parent_policy_id: string | null;
  updated_at: string;
  rules: number;
  openQuestions: number;
  documents: number;
  nodes: number;
  calls: string[]; // ids de políticas llamadas desde nodos SIISA
};

export async function fetchPolicySummaries(): Promise<PolicySummary[]> {
  const { data, error } = await supabase
    .from("policies")
    .select(
      "id, slug, code, name, description, status, working_version, parent_policy_id, updated_at, policy_rules(id), policy_documents(id), policy_questions(id, status), policy_siisa_nodes!policy_siisa_nodes_policy_id_fkey(id, called_policy_id)",
    )
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    code: p.code,
    name: p.name,
    description: p.description,
    status: p.status,
    working_version: p.working_version,
    parent_policy_id: p.parent_policy_id,
    updated_at: p.updated_at,
    rules: p.policy_rules?.length ?? 0,
    documents: p.policy_documents?.length ?? 0,
    openQuestions: (p.policy_questions ?? []).filter((q: any) => q.status !== "resuelta").length,
    nodes: p.policy_siisa_nodes?.length ?? 0,
    calls: (p.policy_siisa_nodes ?? []).map((n: any) => n.called_policy_id).filter(Boolean),
  }));
}

export type PolicyBundle = {
  policy: any;
  documents: any[];
  rules: any[];
  questions: any[];
  questionRules: { question_id: string; rule_id: string }[];
  nodes: any[];
  edges: any[];
  log: any[];
  integrations: any[];
  allPolicies: { id: string; name: string; slug: string }[];
};

export async function fetchPolicyBundle(slug: string): Promise<PolicyBundle | null> {
  const { data: policy, error } = await supabase
    .from("policies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!policy) return null;
  const id = policy.id;
  const [docs, rules, qs, nodes, edges, log, integ, all] = await Promise.all([
    supabase.from("policy_documents").select("*").eq("policy_id", id).order("created_at"),
    supabase.from("policy_rules").select("*").eq("policy_id", id).order("sort_order").order("created_at"),
    supabase.from("policy_questions").select("*").eq("policy_id", id).order("created_at"),
    supabase.from("policy_siisa_nodes").select("*").eq("policy_id", id).order("sort_order").order("created_at"),
    supabase.from("policy_siisa_edges").select("*").eq("policy_id", id),
    supabase.from("policy_change_log").select("*").eq("policy_id", id).order("created_at", { ascending: false }),
    supabase.from("policy_integrations").select("*").order("name"),
    supabase.from("policies").select("id, name, slug").order("name"),
  ]);
  for (const r of [docs, rules, qs, nodes, edges, log, integ, all]) if (r.error) throw r.error;
  const qIds = (qs.data ?? []).map((q) => q.id);
  let questionRules: { question_id: string; rule_id: string }[] = [];
  if (qIds.length) {
    const qr = await supabase.from("policy_question_rules").select("*").in("question_id", qIds);
    if (qr.error) throw qr.error;
    questionRules = qr.data ?? [];
  }
  return {
    policy,
    documents: docs.data ?? [],
    rules: rules.data ?? [],
    questions: qs.data ?? [],
    questionRules,
    nodes: nodes.data ?? [],
    edges: edges.data ?? [],
    log: log.data ?? [],
    integrations: integ.data ?? [],
    allPolicies: all.data ?? [],
  };
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Table =
  | "policies"
  | "policy_documents"
  | "policy_rules"
  | "policy_questions"
  | "policy_siisa_nodes"
  | "policy_siisa_edges"
  | "policy_integrations";

export async function saveRow(table: Table, values: Record<string, any>, id?: string) {
  const q = id
    ? supabase.from(table).update(values as never).eq("id", id).select().single()
    : supabase.from(table).insert(values as never).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return data as any;
}

export async function deleteRow(table: Table, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function setQuestionRules(questionId: string, ruleIds: string[]) {
  const del = await supabase.from("policy_question_rules").delete().eq("question_id", questionId);
  if (del.error) throw del.error;
  if (ruleIds.length) {
    const ins = await supabase
      .from("policy_question_rules")
      .insert(ruleIds.map((rule_id) => ({ question_id: questionId, rule_id })));
    if (ins.error) throw ins.error;
  }
}

export async function logChange(
  policyId: string,
  change_type: string,
  description: string,
  version_label = "",
) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("policy_change_log").insert({
    policy_id: policyId,
    change_type,
    description,
    version_label,
    user_email: data.user?.email ?? "",
  });
  // Marca la política como actualizada
  await supabase.from("policies").update({ updated_at: new Date().toISOString() }).eq("id", policyId);
}

export async function uploadPolicyFile(policyId: string, file: File) {
  const path = `${policyId}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
  const { error } = await supabase.storage.from(POLICY_BUCKET).upload(path, file);
  if (error) throw error;
  return path;
}

export async function signedPolicyFileUrl(path: string) {
  const { data, error } = await supabase.storage.from(POLICY_BUCKET).createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}
