/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Modelo de diseño de nodos SIISA (sólo diseño / blueprint). No ejecuta nada ni se conecta a SIISA.
 */
import { DESIGN_STATUSES, IMPL_STATUSES, RULE_STATUSES, labelOf, type PolicyBundle } from "@/lib/policies";

export const SIISA_TYPES = [
  "Inicio", "Test Binario", "Cálculo", "Decisión", "Matriz", "Llamador",
  "Comentario", "Concurrente", "REST", "Parser",
] as const;
export type SiisaType = (typeof SIISA_TYPES)[number];

/** Normaliza nombres de tipo usados en versiones previas del módulo. */
export function normType(t: string | null | undefined): string {
  if (t === "Binario") return "Test Binario";
  if (t === "Fuente REST" || t === "REST/Parser") return "REST";
  return t ?? "otro";
}

export const VAR_TYPES = ["texto", "entero", "real", "booleano"] as const;
export const ORIGINS = [
  { value: "parametro", label: "Parámetro" },
  { value: "consulta", label: "Consulta" },
  { value: "calculo", label: "Cálculo" },
  { value: "otro", label: "Otro" },
];
export const OPERATORS = ["=", "<>", ">", ">=", "<", "<=", "entre", "en lista", "no en lista", "contiene"];

export type IoIn = { name: string; type: string; required: boolean; origin: string; notes: string };
export type IoOut = { name: string; type: string; meaning: string };
export type NodeConfig = {
  description?: string;
  inputs?: IoIn[];
  outputs?: IoOut[];
  t?: Record<string, any>;
};

export function getConfig(n: any): Required<Omit<NodeConfig, "t">> & { t: Record<string, any> } {
  const c: NodeConfig = n?.config_siisa ?? {};
  return { description: c.description ?? "", inputs: c.inputs ?? [], outputs: c.outputs ?? [], t: c.t ?? {} };
}

export type Issue = { level: "pendiente" | "aviso"; text: string; nodeId?: string };

export function traceIssues(b: PolicyBundle, traceId: string): Issue[] {
  const nodes = b.nodes.filter((n) => n.trace_id === traceId);
  const edges = b.edges.filter((e) => e.trace_id === traceId);
  const out: Issue[] = [];
  if (!nodes.length) return [{ level: "pendiente", text: "La traza no tiene nodos." }];
  if (!nodes.some((n) => normType(n.node_type) === "Inicio")) out.push({ level: "pendiente", text: "Falta nodo Inicio." });
  if (!nodes.some((n) => normType(n.node_type) === "Decisión")) out.push({ level: "pendiente", text: "Falta nodo Decisión final (dictamen)." });
  for (const n of nodes) {
    const type = normType(n.node_type);
    const c = getConfig(n);
    const name = n.label || type;
    const push = (text: string, level: Issue["level"] = "pendiente") => out.push({ level, text: `${name}: ${text}`, nodeId: n.id });
    const ins = edges.filter((e) => e.to_node_id === n.id);
    const outs = edges.filter((e) => e.from_node_id === n.id);
    if (type !== "Comentario" && !ins.length && !outs.length) push("nodo sin conectar.");
    if (type !== "Inicio" && type !== "Comentario" && !ins.length && outs.length) push("no tiene entrada desde otro nodo.", "aviso");
    c.inputs.forEach((i) => {
      if (!i.name) push("entrada sin nombre.");
      else if (!i.type || !i.origin) push(`la entrada «${i.name}» no tiene tipo u origen.`);
    });
    c.outputs.forEach((o) => { if (!o.name || !o.type) push("salida sin nombre o tipo."); });
    const t = c.t;
    if (type === "Test Binario") {
      if (!t["variable"] || !t["operator"] || (!t["threshold"] && !t["compare_variable"])) push("condición incompleta (variable, operador y umbral).");
      if (!outs.some((e) => e.kind === "verdadero")) push("falta rama VERDADERO.");
      if (!outs.some((e) => e.kind === "falso")) push("falta rama FALSO.");
    }
    if (type === "Cálculo" && (!t["formula"] || !t["output_variable"])) push("falta fórmula o variable de salida.");
    if (type === "Decisión" && !t["verdict"]) push("falta dictamen definido.");
    if (type === "Llamador" && !n.called_policy_id) push("falta política llamada.");
    if (type === "Matriz" && t["table_status"] !== "definida") push("tabla de la matriz pendiente (no se infieren combinaciones).");
    if ((type === "REST" || type === "Parser") && !n.integration_id && !t["source_ref"]) push("falta referencia de fuente.");
    if (type === "Concurrente" && !(t["sources"] ?? []).length) push("faltan fuentes participantes.");
    const r = n.rule_id ? b.rules.find((x) => x.id === n.rule_id) : null;
    if (r && r.definition_status !== "CONFIRMADA") push(`regla ${r.code} sin validar (${labelOf(RULE_STATUSES, r.definition_status)}).`, "aviso");
    const q = n.question_id ? b.questions.find((x) => x.id === n.question_id) : null;
    if (q && q.status !== "resuelta") push(`duda ${q.code} abierta.`, "aviso");
  }
  return out;
}

function ctx(b: PolicyBundle, traceId: string) {
  const trace = b.traces.find((t) => t.id === traceId);
  const line = b.lines.find((l) => l.id === trace?.line_id) ?? null;
  const nodes = b.nodes.filter((n) => n.trace_id === traceId).sort((a, c) => a.sort_order - c.sort_order);
  const edges = b.edges.filter((e) => e.trace_id === traceId);
  return { trace, line, nodes, edges };
}

const HEADER = "Blueprint funcional para implementación manual en SIISA; no es ejecución ni importación oficial.";

export function exportSpecJson(b: PolicyBundle, traceId: string) {
  const { trace, line, nodes, edges } = ctx(b, traceId);
  const label = (id: string) => nodes.find((n) => n.id === id)?.label || id;
  const usedInteg = new Set(nodes.map((n) => n.integration_id).filter(Boolean));
  const rulesUsed = new Set(nodes.map((n) => n.rule_id).filter(Boolean));
  const inicio = nodes.find((n) => normType(n.node_type) === "Inicio");
  return {
    aviso: HEADER,
    generado: new Date().toISOString(),
    politica: { nombre: b.policy.name, codigo: b.policy.code, fuente: b.policy.source_url },
    linea: line ? { nombre: line.name, codigo: line.code, segmento: line.segment } : null,
    traza: { nombre: trace?.name, version: trace?.version_label, estado_diseno: labelOf(DESIGN_STATUSES, trace?.design_status) },
    parametros_entrada: inicio ? getConfig(inicio).inputs : [],
    nodos: nodes.map((n) => {
      const c = getConfig(n);
      const r = b.rules.find((x) => x.id === n.rule_id);
      const q = b.questions.find((x) => x.id === n.question_id);
      return {
        id: n.id,
        orden: n.sort_order,
        tipo: normType(n.node_type),
        nombre: n.label,
        descripcion: c.description,
        estado: labelOf(IMPL_STATUSES, n.impl_status),
        recibe: c.inputs,
        genera: c.outputs,
        configuracion: c.t,
        politica_llamada: n.called_policy_id ? b.allPolicies.find((p) => p.id === n.called_policy_id)?.name ?? null : null,
        fuente: n.integration_id ? b.integrations.find((i) => i.id === n.integration_id)?.name ?? null : null,
        regla: r ? { codigo: r.code, texto_original: r.original_text, estado: labelOf(RULE_STATUSES, r.definition_status) } : null,
        duda: q ? { codigo: q.code, pregunta: q.question, estado: q.status } : null,
        extracto_manual: n.source_excerpt || null,
        transformacion_siisa: n.siisa_transformation || null,
        salidas: edges.filter((e) => e.from_node_id === n.id).map((e) => ({ rama: e.kind, etiqueta: e.label, hacia: label(e.to_node_id) })),
      };
    }),
    conexiones: edges.map((e) => ({ desde: label(e.from_node_id), hacia: label(e.to_node_id), rama: e.kind, etiqueta: e.label })),
    fuentes_identificadas: b.integrations.filter((i) => usedInteg.has(i.id)).map((i) => ({ nombre: i.name, tipo: i.kind, descripcion: i.description })),
    reglas_criterios: b.rules.filter((r) => rulesUsed.has(r.id)).map((r) => ({ codigo: r.code, texto_original: r.original_text, estado: labelOf(RULE_STATUSES, r.definition_status) })),
    preguntas_pendientes: b.questions.filter((q) => q.status !== "resuelta").map((q) => ({ codigo: q.code, pregunta: q.question })),
    dictamenes_disenados: nodes.filter((n) => normType(n.node_type) === "Decisión").map((n) => ({ nodo: n.label, dictamen: getConfig(n).t["verdict"] ?? "PENDIENTE" })),
    pendientes_completitud: traceIssues(b, traceId).map((i) => `[${i.level}] ${i.text}`),
  };
}

export function exportSpecMarkdown(b: PolicyBundle, traceId: string) {
  const j = exportSpecJson(b, traceId);
  const L: string[] = [];
  const io = (xs: any[], f: (x: any) => string) => (xs.length ? xs.map(f).join("; ") : "—");
  L.push(`# Especificación SIISA — ${j.politica.nombre}${j.linea ? ` / ${j.linea.nombre}` : ""}`);
  L.push("", `> **${HEADER}**`, "");
  L.push(`- Traza: ${j.traza.nombre} · versión ${j.traza.version} · ${j.traza.estado_diseno}`);
  L.push(`- Fuente de la política: ${j.politica.fuente ?? "—"}`, `- Generado: ${j.generado}`);
  L.push("", "## Parámetros de entrada (nodo Inicio)");
  L.push(j.parametros_entrada.length ? j.parametros_entrada.map((p: any) => `- ${p.name} (${p.type || "tipo PENDIENTE"})${p.required ? " · requerido" : ""} · origen: ${p.origin || "PENDIENTE"}${p.notes ? ` · ${p.notes}` : ""}`).join("\n") : "- PENDIENTE: sin parámetros definidos.");
  L.push("", "## Nodos");
  j.nodos.forEach((n, i) => {
    L.push("", `### ${i + 1}. [${n.tipo}] ${n.nombre || "(sin nombre)"}`);
    if (n.descripcion) L.push(n.descripcion);
    L.push(`- Estado: ${n.estado}`);
    L.push(`- Recibe: ${io(n.recibe, (x) => `${x.name} (${x.type || "?"}, ${x.origin || "?"})`)}`);
    L.push(`- Genera: ${io(n.genera, (x) => `${x.name} (${x.type || "?"})${x.meaning ? ` = ${x.meaning}` : ""}`)}`);
    const t = n.configuracion as Record<string, any>;
    switch (n.tipo) {
      case "Test Binario":
        L.push(`- Condición: ${t["variable"] || "PENDIENTE"} ${t["operator"] || "?"} ${t["compare_kind"] === "variable" ? t["compare_variable"] || "PENDIENTE" : t["threshold"] || "PENDIENTE"}`);
        L.push(`- Verdadero: ${t["true_label"] || "—"} · Falso: ${t["false_label"] || "—"}`);
        break;
      case "Cálculo":
        L.push(`- Variable de salida: ${t["output_variable"] || "PENDIENTE"}`, `- Fórmula (texto, no ejecutada): \`${t["formula"] || "PENDIENTE"}\``, `- Dependencias: ${t["dependencies"] || "—"}`);
        break;
      case "Decisión":
        L.push(`- Dictamen: ${t["verdict"] || "PENDIENTE"} · variable devuelta: ${t["returned_variable"] || "—"}`);
        break;
      case "Llamador":
        L.push(`- Política llamada: ${n.politica_llamada ?? "PENDIENTE"} · prefijo: ${t["prefix"] || "—"}`, `- Parámetros: ${io(t["params"] ?? [], (p) => `${p.name}=${p.value}`)}`);
        break;
      case "Matriz":
        L.push(`- Criterios: ${io(t["criteria"] ?? [], (c) => c.name)}`, `- Salidas: ${t["outputs_desc"] || "—"}`, `- Tabla: ${t["table_status"] === "definida" ? "definida" : "PENDIENTE (no se infirieron combinaciones)"}${t["table_notes"] ? ` · ${t["table_notes"]}` : ""}`);
        break;
      case "Concurrente":
        L.push(`- Fuentes participantes: ${io(t["sources"] ?? [], (s) => s.name)}`);
        break;
      case "REST":
      case "Parser":
        L.push(`- Fuente: ${n.fuente ?? t["source_ref"] ?? "PENDIENTE"} · método: ${t["method"] || "—"}`, `- Request: ${t["request_desc"] || "—"}`, `- Response: ${t["response_desc"] || "—"}`, `- Mapeo: ${io(t["mapping"] ?? [], (m) => `${m.from} → ${m.to}`)}`, `- Timeout: ${t["timeout"] || "—"} · Reconsulta: ${t["retry"] || "—"}`);
        break;
      case "Comentario":
        L.push(`- ${t["text"] || ""}`);
        break;
    }
    if (n.fuente && n.tipo !== "REST" && n.tipo !== "Parser") L.push(`- Fuente: ${n.fuente}`);
    if (n.regla) L.push(`- Regla de referencia: ${n.regla.codigo} — ${n.regla.texto_original} [${n.regla.estado}]`);
    if (n.duda) L.push(`- Duda: ${n.duda.codigo} — ${n.duda.pregunta} [${n.duda.estado}]`);
    if (n.transformacion_siisa) L.push(`- Notas de transformación: ${n.transformacion_siisa}`);
    L.push(`- Deriva a: ${io(n.salidas, (s) => `${s.rama.toUpperCase()}${s.etiqueta ? ` (${s.etiqueta})` : ""} → ${s.hacia}`)}`);
  });
  L.push("", "## Fuentes identificadas", j.fuentes_identificadas.length ? j.fuentes_identificadas.map((f) => `- ${f.nombre} (${f.tipo}): ${f.descripcion}`).join("\n") : "- Ninguna asignada.");
  L.push("", "## Reglas / criterios originales", j.reglas_criterios.length ? j.reglas_criterios.map((r) => `- ${r.codigo}: ${r.texto_original} [${r.estado}]`).join("\n") : "- Ninguna vinculada a nodos.");
  L.push("", "## Dictámenes diseñados", j.dictamenes_disenados.length ? j.dictamenes_disenados.map((d) => `- ${d.nodo}: ${d.dictamen}`).join("\n") : "- PENDIENTE.");
  L.push("", "## Preguntas pendientes", j.preguntas_pendientes.length ? j.preguntas_pendientes.map((q) => `- ${q.codigo}: ${q.pregunta}`).join("\n") : "- Ninguna.");
  L.push("", "## Pendientes antes de SIISA", j.pendientes_completitud.length ? j.pendientes_completitud.map((p) => `- ${p}`).join("\n") : "- Sin pendientes detectados.");
  return L.join("\n");
}

export function download(name: string, content: string, mime: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
