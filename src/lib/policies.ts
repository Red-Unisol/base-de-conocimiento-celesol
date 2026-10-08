/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export const POLICY_BUCKET = "policy-docs";

export const POLICY_STATUSES = [
  { value: "pendiente_carga", label: "Pendiente de carga" },
  { value: "en_relevamiento", label: "En relevamiento" },
  { value: "en_validacion", label: "En validación" },
  { value: "validada", label: "Validada" },
  { value: "en_diseno_siisa", label: "En diseño SIISA" },
  { value: "sin_logica", label: "Sin lógica documentada" },
];

/** Estados de diseño de líneas y trazas. "Implementada confirmada" sólo tras comprobarlo en SIISA. */
export const DESIGN_STATUSES = [
  { value: "relevada", label: "Relevada" },
  { value: "pendiente_validacion", label: "Pendiente de validación" },
  { value: "disenada", label: "Diseñada" },
  { value: "lista_siisa", label: "Lista para SIISA" },
  { value: "implementada_confirmada", label: "Implementada confirmada" },
];

export const SEGMENTS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "afiliado primer crédito", label: "Afiliado primer crédito" },
  { value: "recurrente", label: "Recurrente" },
  { value: "activo", label: "Activo" },
  { value: "pasivo", label: "Pasivo" },
];

export const EDGE_KINDS = [
  { value: "verdadero", label: "Verdadero" },
  { value: "falso", label: "Falso" },
  { value: "secundaria", label: "Secundaria" },
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
  "Inicio", "Fuente REST", "Parser", "Cálculo", "Binario", "Matriz", "Llamador",
  "Decisión", "Comentario", "Concurrente", "otro",
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
  lines: any[];
  traces: any[];
  variables: any[];
  variableLinks: any[];
  walkthroughs: any[];
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
  const [docs, rules, qs, nodes, edges, log, integ, all, lines, traces, vars] = await Promise.all([
    supabase.from("policy_documents").select("*").eq("policy_id", id).order("created_at"),
    supabase.from("policy_rules").select("*").eq("policy_id", id).order("sort_order").order("created_at"),
    supabase.from("policy_questions").select("*").eq("policy_id", id).order("created_at"),
    supabase.from("policy_siisa_nodes").select("*").eq("policy_id", id).order("sort_order").order("created_at"),
    supabase.from("policy_siisa_edges").select("*").eq("policy_id", id),
    supabase.from("policy_change_log").select("*").eq("policy_id", id).order("created_at", { ascending: false }),
    supabase.from("policy_integrations").select("*").order("name"),
    supabase.from("policies").select("id, name, slug").order("name"),
    supabase.from("policy_lines").select("*").eq("policy_id", id).order("sort_order"),
    supabase.from("policy_traces").select("*").eq("policy_id", id).order("created_at"),
    supabase.from("policy_variables").select("*").order("name"),
  ]);
  for (const r of [docs, rules, qs, nodes, edges, log, integ, all, lines, traces, vars]) if (r.error) throw r.error;
  const traceIds = (traces.data ?? []).map((t) => t.id);
  let variableLinks: any[] = [];
  let walkthroughs: any[] = [];
  if (traceIds.length) {
    const nodeIds = (nodes.data ?? []).map((n) => n.id);
    const [vl, wk] = await Promise.all([
      nodeIds.length
        ? supabase.from("policy_variable_links").select("*").in("node_id", nodeIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("policy_walkthroughs").select("*").in("trace_id", traceIds).order("created_at", { ascending: false }),
    ]);
    if (vl.error) throw vl.error;
    if (wk.error) throw wk.error;
    variableLinks = vl.data ?? [];
    walkthroughs = wk.data ?? [];
  }
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
    lines: lines.data ?? [],
    traces: traces.data ?? [],
    variables: vars.data ?? [],
    variableLinks,
    walkthroughs,
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
  | "policy_integrations"
  | "policy_lines"
  | "policy_traces"
  | "policy_variables"
  | "policy_variable_links"
  | "policy_walkthroughs";

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

/** Exportación legible para implementadores SIISA (no es un formato de importación). */
export function exportTraceMarkdown(b: PolicyBundle, traceId: string) {
  const t = b.traces.find((x) => x.id === traceId);
  const line = b.lines.find((l) => l.id === t?.line_id);
  const nodes = b.nodes.filter((n) => n.trace_id === traceId).sort((a, c) => a.sort_order - c.sort_order);
  const edges = b.edges.filter((e) => e.trace_id === traceId);
  const name = (id: string) => nodes.find((n) => n.id === id)?.label || "(sin nombre)";
  const rule = (id: string | null) => b.rules.find((r) => r.id === id);
  const varsOf = (nid: string) =>
    b.variableLinks.filter((v) => v.node_id === nid).map((v) => {
      const vr = b.variables.find((x) => x.id === v.variable_id);
      return `${vr?.code || vr?.name} (${v.role})`;
    });
  const lineRules = b.rules.filter((r) => !line || r.line_id === line.id || !r.line_id);
  const out: string[] = [];
  out.push(`# ${b.policy.name} — ${line?.name ?? "General"} — ${t?.name ?? ""} ${t?.version_label ?? ""}`);
  out.push("", "> Documento de PREPARACIÓN para SIISA. No es una traza ejecutada ni importable automáticamente.");
  out.push(`> Estado de diseño: ${labelOf(DESIGN_STATUSES, t?.design_status)}. Fuente: ${b.policy.source_url ?? "—"}`, "");
  out.push("## Nodos (orden propuesto)");
  nodes.forEach((n, i) => {
    const r = rule(n.rule_id);
    out.push("", `### ${i + 1}. ${n.label || "(sin nombre)"} — ${n.node_type}`);
    out.push(`- Estado: ${labelOf(IMPL_STATUSES, n.impl_status)}`);
    if (r) out.push(`- Regla: ${r.code} — ${r.original_text} [${labelOf(RULE_STATUSES, r.definition_status)}]`);
    if (r?.conditions || r?.operator || r?.threshold) out.push(`- Condición: ${r.variable} ${r.operator} ${r.threshold} ${r.conditions}`.trim());
    const v = varsOf(n.id);
    if (v.length) out.push(`- Variables: ${v.join(", ")}`);
    if (n.inputs) out.push(`- Entradas: ${n.inputs}`);
    if (n.outputs) out.push(`- Salidas: ${n.outputs}`);
    if (n.data_origin || n.integration_id) out.push(`- Fuente: ${b.integrations.find((x) => x.id === n.integration_id)?.name ?? n.data_origin}`);
    if (n.source_excerpt) out.push(`- Extracto original: «${n.source_excerpt}»`);
    if (n.siisa_transformation) out.push(`- Transformación SIISA: ${n.siisa_transformation}`);
    const outs = edges.filter((e) => e.from_node_id === n.id);
    if (outs.length) out.push(`- Salidas: ${outs.map((e) => `${e.kind}${e.label ? ` (${e.label})` : ""} → ${name(e.to_node_id)}`).join("; ")}`);
  });
  const usedIntegrations = new Set(nodes.map((n) => n.integration_id).filter(Boolean));
  out.push("", "## Contratos de fuente (catálogo)");
  b.integrations.filter((i) => usedIntegrations.has(i.id)).forEach((i) => out.push(`- ${i.name} (${i.kind}): ${i.description}`));
  if (!usedIntegrations.size) out.push("- Sin fuentes asignadas a nodos.");
  out.push("", "## Reglas de la línea");
  lineRules.forEach((r) => out.push(`- ${r.code}: ${r.original_text} [${labelOf(RULE_STATUSES, r.definition_status)}]`));
  out.push("", "## Preguntas pendientes");
  b.questions.filter((q) => q.status !== "resuelta").forEach((q) => out.push(`- ${q.code}: ${q.question}`));
  return out.join("\n");
}
