/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from "@tanstack/react-query";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  CopyPlus,
  Download,
  GitCompare,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NodeInspector } from "@/components/policies/node-inspector";
import { RecordDialog, type Field } from "@/components/policies/record-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SIISA_TYPES, download as dl, exportSpecJson, exportSpecMarkdown, getConfig, normType, traceIssues } from "@/lib/siisa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  DESIGN_STATUSES,
  EDGE_KINDS,
  IMPL_STATUSES,
  NODE_TYPES,
  RULE_STATUSES,
  SEGMENTS,
  deleteRow,
  exportTraceMarkdown,
  labelOf,
  logChange,
  saveRow,
  type PolicyBundle,
} from "@/lib/policies";
import { cn } from "@/lib/utils";

const EDGE_COLORS: Record<string, string> = {
  verdadero: "var(--color-brand)",
  falso: "var(--color-destructive)",
  secundaria: "var(--color-muted-foreground)",
};

type Dlg = { title: string; fields: Field[]; initial: any; onSubmit: (v: any) => Promise<void> } | null;

export function TraceStudio({ bundle, editable }: { bundle: PolicyBundle; editable: boolean }) {
  const qc = useQueryClient();
  const { policy, lines, traces, rules, questions, nodes: allNodes, edges: allEdges, variables, variableLinks, integrations, allPolicies } = bundle;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["policy", policy.slug] });
    void qc.invalidateQueries({ queryKey: ["policies"] });
  };

  const [lineId, setLineId] = useState<string | null>(lines[0]?.id ?? null);
  const lineTraces = traces.filter((t) => (lineId ? t.line_id === lineId : !t.line_id));
  const [traceId, setTraceId] = useState<string | null>(null);
  const trace = lineTraces.find((t) => t.id === traceId) ?? lineTraces[lineTraces.length - 1] ?? null;
  const line = lines.find((l) => l.id === lineId) ?? null;

  const tNodes = useMemo(() => allNodes.filter((n) => trace && n.trace_id === trace.id), [allNodes, trace]);
  const tEdges = useMemo(() => allEdges.filter((e) => trace && e.trace_id === trace.id), [allEdges, trace]);
  const lineRules = rules.filter((r) => !lineId || r.line_id === lineId || !r.line_id);

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [focusRule, setFocusRule] = useState<string | null>(null);
  const [edgeKind, setEdgeKind] = useState("verdadero");
  const [dlg, setDlg] = useState<Dlg>(null);
  const [walk, setWalk] = useState<string[] | null>(null);
  const [walkInputs, setWalkInputs] = useState<Record<string, string>>({});
  const [compareId, setCompareId] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const issues = useMemo(() => (trace ? traceIssues(bundle, trace.id) : []), [bundle, trace]);
  const [edgeDraft, setEdgeDraft] = useState<{ kind: string; label: string } | null>(null);
  const ruleById = Object.fromEntries(rules.map((r) => [r.id, r]));
  const nodeById = Object.fromEntries(tNodes.map((n) => [n.id, n]));

  const evaluable = (n: any) => {
    const r = n.rule_id ? ruleById[n.rule_id] : null;
    if (["Inicio", "Comentario"].includes(normType(n.node_type))) return true;
    return Boolean(r && r.definition_status === "CONFIRMADA" && r.variable && r.operator && r.threshold);
  };

  /* ---------- Flow data ---------- */
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  useEffect(() => {
    setRfNodes(
      tNodes.map((n, i) => {
        const inWalk = walk?.includes(n.id);
        const current = walk && walk[walk.length - 1] === n.id;
        const hl = focusRule && n.rule_id === focusRule;
        return {
          id: n.id,
          position: { x: n.pos_x || (i % 4) * 220, y: n.pos_y || Math.floor(i / 4) * 140 },
          data: {
            label: (() => {
              const c = getConfig(n);
              const pend = issues.filter((x) => x.nodeId === n.id).length;
              const gen = c.outputs.map((o) => o.name).filter(Boolean);
              const t = normType(n.node_type);
              if (t === "Cálculo" && c.t["output_variable"]) gen.unshift(c.t["output_variable"]);
              if (t === "Decisión") gen.unshift(`dictamen: ${c.t["verdict"] || "PENDIENTE"}`);
              return (
                <div className="space-y-0.5 text-left">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-brand">{t}</div>
                  <div className="text-xs font-semibold leading-tight">{n.label || "(sin nombre)"}</div>
                  {t !== "Comentario" && (
                    <>
                      <div className="text-[9px] leading-tight"><span className="text-muted-foreground">Recibe:</span> {c.inputs.map((i) => i.name).filter(Boolean).join(", ") || "—"}</div>
                      <div className="text-[9px] leading-tight"><span className="text-muted-foreground">Genera:</span> {[...new Set(gen)].join(", ") || "—"}</div>
                    </>
                  )}
                  {t === "Test Binario" && <div className="font-mono text-[9px]">{c.t["variable"] || "?"} {c.t["operator"] || "?"} {c.t["compare_kind"] === "variable" ? c.t["compare_variable"] || "?" : c.t["threshold"] || "?"}</div>}
                  {pend > 0 ? <div className="text-[9px] font-semibold text-destructive">{pend} pendiente(s)</div> : <div className="text-[9px] text-brand">Completo en diseño</div>}
                </div>
              );
            })(),
          },
          style: {
            width: 190,
            borderRadius: 8,
            padding: 8,
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            border: `2px solid ${current ? "var(--color-brand)" : hl || selected === n.id ? "var(--color-primary)" : inWalk ? "var(--color-brand)" : "var(--color-border)"}`,
            opacity: walk && !inWalk ? 0.45 : 1,
          },
          draggable: editable && !walk,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tNodes, walk, focusRule, selected, editable, rules, issues]);

  const rfEdges: Edge[] = tEdges.map((e) => {
    const walked = walk ? walk.some((id, i) => id === e.from_node_id && walk[i + 1] === e.to_node_id) : false;
    const color: string = EDGE_COLORS[e.kind] ?? "var(--color-muted-foreground)";
    return {
      id: e.id,
      source: e.from_node_id,
      target: e.to_node_id,
      label: `${e.kind === "verdadero" ? "✓ VERDADERO" : e.kind === "falso" ? "✗ FALSO" : "· secundaria"}${e.label ? ` — ${e.label}` : ""}`,
      animated: walked,
      style: { stroke: color, strokeWidth: walked || selectedEdge === e.id ? 3 : 1.5, strokeDasharray: e.kind === "falso" ? "6 4" : e.kind === "secundaria" ? "2 3" : "0" },
      labelStyle: { fontSize: 10, fontWeight: 600, fill: color },
      labelBgStyle: { fill: "var(--color-card)" },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    };
  });

  async function onNodesChange(changes: NodeChange[]) {
    setRfNodes((ns) => applyNodeChanges(changes, ns));
    if (!editable) return;
    for (const c of changes) {
      if (c.type === "position" && c.dragging === false && c.position) {
        await supabase.from("policy_siisa_nodes").update({ pos_x: c.position.x, pos_y: c.position.y }).eq("id", c.id);
      }
    }
  }

  async function onConnect(c: Connection) {
    if (!editable || !trace || !c.source || !c.target) return;
    try {
      await saveRow("policy_siisa_edges", { policy_id: policy.id, trace_id: trace.id, from_node_id: c.source, to_node_id: c.target, kind: edgeKind, label: "" });
      await logChange(policy.id, "siisa", `Conectó nodos (${edgeKind}) en ${trace.name} ${trace.version_label}`, trace.version_label);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo conectar");
    }
  }

  /* ---------- Dialog configs ---------- */
  const ruleOpts = lineRules.map((r) => ({ value: r.id, label: `${r.code} — ${r.original_text.slice(0, 60)}` }));
  const qOpts = questions.map((q) => ({ value: q.id, label: `${q.code} — ${q.question.slice(0, 60)}` }));
  const integOpts = integrations.map((i) => ({ value: i.id, label: i.name }));
  const policyOpts = allPolicies.filter((p) => p.id !== policy.id).map((p) => ({ value: p.id, label: p.name }));
  const varOpts = variables.map((v) => ({ value: v.id, label: `${v.code || v.name}` }));

  const lineFields: Field[] = [
    { name: "name", label: "Nombre de la línea" },
    { name: "code", label: "Código" },
    { name: "segment", label: "Segmento", kind: "select", options: SEGMENTS },
    { name: "design_status", label: "Estado de diseño", kind: "select", options: DESIGN_STATUSES },
    { name: "description", label: "Descripción", kind: "textarea" },
    { name: "source_excerpt", label: "Extracto del manual", kind: "textarea" },
  ];
  const traceFields: Field[] = [
    { name: "name", label: "Nombre de la traza" },
    { name: "version_label", label: "Versión" },
    { name: "design_status", label: "Estado de diseño", kind: "select", options: DESIGN_STATUSES },
    { name: "notes", label: "Notas", kind: "textarea" },
  ];
  const nodeFields: Field[] = [
    { name: "label", label: "Nombre del nodo" },
    { name: "node_type", label: "Tipo de nodo (manual SIISA)", kind: "select", options: NODE_TYPES },
    { name: "rule_id", label: "Regla de negocio", kind: "select", options: ruleOpts },
    { name: "question_id", label: "Duda vinculada", kind: "select", options: qOpts },
    { name: "variable_ids", label: "Variables requeridas", kind: "multi", options: varOpts },
    { name: "integration_id", label: "Fuente (catálogo)", kind: "select", options: integOpts },
    { name: "called_policy_id", label: "Política / subpolítica llamada", kind: "select", options: policyOpts },
    { name: "impl_status", label: "Estado", kind: "select", options: IMPL_STATUSES },
    { name: "source_excerpt", label: "Extracto textual del manual", kind: "textarea" },
    { name: "siisa_transformation", label: "Transformación propuesta SIISA", kind: "textarea" },
    { name: "inputs", label: "Entradas", kind: "textarea" },
    { name: "outputs", label: "Salidas", kind: "textarea" },
    { name: "version_label", label: "Versión" },
    { name: "sort_order", label: "Orden", kind: "number" },
    { name: "notes", label: "Notas de implementación", kind: "textarea" },
  ];

  const wrap = (fn: (v: any) => Promise<void>) => async (v: any) => {
    try {
      await fn(v);
      toast.success("Guardado");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar");
      throw e;
    }
  };
  const clean = (v: any) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === "" && /_id$/.test(k) ? null : x]));

  const openLine = (l?: any) =>
    setDlg({
      title: l ? "Editar línea" : "Nueva línea",
      fields: lineFields,
      initial: l ?? { design_status: "relevada" },
      onSubmit: wrap(async (v) => {
        if (!v.name) throw new Error("El nombre es obligatorio");
        const row: any = { policy_id: policy.id };
        for (const f of lineFields) row[f.name] = v[f.name] ?? (f.name === "design_status" ? "relevada" : "");
        const saved = await saveRow("policy_lines", row, l?.id);
        if (!l) {
          await saveRow("policy_traces", { policy_id: policy.id, line_id: saved.id, name: `Traza ${saved.name}`, version_label: "v0.1", design_status: "relevada" });
          setLineId(saved.id);
        }
        await logChange(policy.id, "edicion", `${l ? "Editó" : "Creó"} la línea ${row.name}`);
      }),
    });

  const openTrace = (t?: any) =>
    setDlg({
      title: t ? "Editar traza" : "Nueva traza",
      fields: traceFields,
      initial: t ?? { design_status: "relevada", version_label: "v0.1", name: line ? `Traza ${line.name}` : "Traza" },
      onSubmit: wrap(async (v) => {
        const row: any = { policy_id: policy.id, line_id: lineId };
        for (const f of traceFields) row[f.name] = v[f.name] ?? "";
        row.design_status ||= "relevada";
        if (row.design_status === "implementada_confirmada" && !confirm("¿Confirmás que esta traza fue comprobada como implementada en SIISA?")) throw new Error("Cancelado");
        const saved = await saveRow("policy_traces", row, t?.id);
        setTraceId(saved.id);
        await logChange(policy.id, "siisa", `${t ? "Editó" : "Creó"} traza ${row.name} ${row.version_label} (${labelOf(DESIGN_STATUSES, row.design_status)})`, row.version_label);
      }),
    });

  async function newVersion() {
    if (!trace) return;
    const version = prompt("Nombre de la nueva versión", `${trace.version_label}-b`);
    if (!version) return;
    try {
      const nt = await saveRow("policy_traces", { policy_id: policy.id, line_id: trace.line_id, name: trace.name, version_label: version, design_status: "relevada", based_on_trace_id: trace.id, notes: `Basada en ${trace.version_label}` });
      const map: Record<string, string> = {};
      for (const n of tNodes) {
        const { id, created_at, ...rest } = n;
        void created_at;
        const c = await saveRow("policy_siisa_nodes", { ...rest, trace_id: nt.id, version_label: version });
        map[id] = c.id;
        const links = variableLinks.filter((l) => l.node_id === id);
        if (links.length) await supabase.from("policy_variable_links").insert(links.map((l) => ({ variable_id: l.variable_id, node_id: c.id, role: l.role })));
      }
      for (const e of tEdges) {
        await saveRow("policy_siisa_edges", { policy_id: policy.id, trace_id: nt.id, from_node_id: map[e.from_node_id], to_node_id: map[e.to_node_id], kind: e.kind, label: e.label });
      }
      await logChange(policy.id, "nueva_version", `Nueva versión ${version} de ${trace.name} (desde ${trace.version_label})`, version);
      setTraceId(nt.id);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo versionar");
    }
  }

  const openNode = (n?: any) =>
    setDlg({
      title: n ? "Editar nodo" : "Nuevo nodo",
      fields: nodeFields,
      initial: n
        ? { ...n, variable_ids: variableLinks.filter((l) => l.node_id === n.id).map((l) => l.variable_id) }
        : { node_type: "Binario", impl_status: "no_definido", sort_order: tNodes.length + 1, variable_ids: [], version_label: trace?.version_label ?? "", pos_x: 40 + (tNodes.length % 4) * 220, pos_y: 40 + Math.floor(tNodes.length / 4) * 140 },
      onSubmit: wrap(async (v) => {
        if (!trace) throw new Error("Primero creá una traza");
        const { variable_ids, ...rest } = clean(v) as any;
        const row: any = { policy_id: policy.id, trace_id: trace.id, pos_x: rest.pos_x ?? 0, pos_y: rest.pos_y ?? 0 };
        for (const f of nodeFields) if (f.name !== "variable_ids") row[f.name] = rest[f.name] ?? (f.kind === "select" ? null : f.kind === "number" ? 0 : "");
        row.node_type ||= "otro";
        row.impl_status ||= "no_definido";
        const saved = await saveRow("policy_siisa_nodes", row, n?.id);
        await supabase.from("policy_variable_links").delete().eq("node_id", saved.id);
        if (variable_ids?.length) await supabase.from("policy_variable_links").insert(variable_ids.map((id: string) => ({ variable_id: id, node_id: saved.id, trace_id: trace.id, role: "entrada" })));
        setSelected(saved.id);
        await logChange(policy.id, "siisa", `${n ? "Editó" : "Agregó"} nodo «${row.label || row.node_type}» en ${trace.version_label}`, trace.version_label);
      }),
    });

  async function addNode(type: string) {
    if (!trace) return;
    try {
      const i = tNodes.length;
      const n = await saveRow("policy_siisa_nodes", {
        policy_id: policy.id, trace_id: trace.id, node_type: type, label: type, impl_status: "no_definido",
        sort_order: i + 1, pos_x: 40 + (i % 4) * 230, pos_y: 40 + Math.floor(i / 4) * 170, version_label: trace.version_label,
        config_siisa: { description: "", inputs: [], outputs: [], t: {} },
      });
      await logChange(policy.id, "siisa", `Agregó nodo ${type} en ${trace.name} ${trace.version_label}`, trace.version_label);
      setSelected(n.id);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo agregar");
    }
  }
  async function saveNode(patch: Record<string, any>) {
    if (!sel || !trace) return;
    try {
      await saveRow("policy_siisa_nodes", patch, sel.id);
      await logChange(policy.id, "siisa", `Editó nodo «${patch["label"] || patch["node_type"]}» en ${trace.version_label}`, trace.version_label);
      toast.success("Nodo guardado");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar");
    }
  }
  async function saveEdge() {
    if (!selectedEdge || !edgeDraft) return;
    try {
      await saveRow("policy_siisa_edges", { kind: edgeDraft.kind, label: edgeDraft.label }, selectedEdge);
      await logChange(policy.id, "siisa", `Editó conexión (${edgeDraft.kind})`, trace?.version_label);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo guardar");
    }
  }
  async function removeNode(id: string) {
    if (!confirm("¿Eliminar este nodo y sus conexiones?")) return;
    await deleteRow("policy_siisa_nodes", id);
    await logChange(policy.id, "siisa", `Eliminó nodo «${nodeById[id]?.label}»`, trace?.version_label);
    setSelected(null);
    refresh();
  }
  async function removeEdge(id: string) {
    await deleteRow("policy_siisa_edges", id);
    await logChange(policy.id, "siisa", "Eliminó conexión", trace?.version_label);
    setSelectedEdge(null);
    refresh();
  }

  /* ---------- Walkthrough ---------- */
  function startWalk() {
    const incoming = new Set(tEdges.map((e) => e.to_node_id));
    const start = tNodes.find((n) => n.node_type === "Inicio") ?? tNodes.find((n) => !incoming.has(n.id));
    if (!start) {
      toast.error("La traza no tiene nodos");
      return;
    }
    setWalk([start.id]);
    setSelected(start.id);
    setWalkInputs({});
  }
  async function saveWalk() {
    if (!walk || !trace) return;
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from("policy_walkthroughs").insert({
      trace_id: trace.id,
      title: `Recorrido manual ${new Date().toLocaleString("es-AR")}`,
      inputs: walkInputs,
      path: walk.map((id) => ({ node: nodeById[id]?.label, type: nodeById[id]?.node_type, evaluable: evaluable(nodeById[id]) })),
      notes: "Recorrido didáctico elegido por el operador. No es una decisión de crédito ni una ejecución SIISA.",
      user_email: data.user?.email ?? "",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Recorrido guardado como propuesta");
    refresh();
  }
  const walkCurrent = walk ? nodeById[walk[walk.length - 1] ?? ""] : null;
  const walkOut = walkCurrent ? tEdges.filter((e) => e.from_node_id === walkCurrent.id) : [];
  const walkVars = walk
    ? [...new Set(variableLinks.filter((l) => walk.includes(l.node_id)).map((l) => l.variable_id))].map((id) => variables.find((v) => v.id === id)).filter(Boolean)
    : [];

  /* ---------- Compare ---------- */
  const compareNodes = compareId ? allNodes.filter((n) => n.trace_id === compareId) : [];
  const diff = useMemo(() => {
    if (!compareId) return null;
    const key = (n: any) => n.label || n.id;
    const a = new Map(compareNodes.map((n) => [key(n), n]));
    const b = new Map(tNodes.map((n) => [key(n), n]));
    const added = [...b.keys()].filter((k) => !a.has(k));
    const removed = [...a.keys()].filter((k) => !b.has(k));
    const changed = [...b.keys()].filter((k) => {
      const x = a.get(k), y = b.get(k);
      return x && y && ["node_type", "rule_id", "siisa_transformation", "impl_status", "integration_id"].some((f) => x[f] !== y[f]);
    });
    return { added, removed, changed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareId, tNodes, allNodes]);

  function download() {
    if (!trace) return;
    const md = exportTraceMarkdown(bundle, trace.id);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${policy.slug}-${line?.code || "general"}-${trace.version_label}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const sel = selected ? nodeById[selected] : null;
  const selRule = sel?.rule_id ? ruleById[sel.rule_id] : null;
  const selVars = sel ? variableLinks.filter((l) => l.node_id === sel.id).map((l) => variables.find((v) => v.id === l.variable_id)).filter(Boolean) : [];
  const selQ = sel?.question_id ? questions.find((q) => q.id === sel.question_id) : null;

  /* ---------- Render ---------- */
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand" />
        Estudio de diseño para preparar la implementación en SIISA. Nada de lo que se ve acá se ejecuta en SIISA ni otorga créditos; el recorrido es una simulación propuesta y manual.
      </div>

      {/* Lines */}
      <div className="flex flex-wrap items-center gap-2">
        {lines.length === 0 && <span className="text-sm text-muted-foreground">Esta política todavía no tiene líneas cargadas.</span>}
        {lines.map((l) => (
          <button
            key={l.id}
            onClick={() => { setLineId(l.id); setTraceId(null); setSelected(null); setWalk(null); setCompareId(null); }}
            className={cn("rounded-md border px-3 py-1.5 text-sm transition-colors", lineId === l.id ? "border-brand bg-brand/10 font-semibold" : "border-border hover:border-brand")}
          >
            {l.name}
            {l.segment && <span className="ml-1.5 text-[10px] text-muted-foreground">{l.segment}</span>}
          </button>
        ))}
        {editable && <Button size="sm" variant="ghost" onClick={() => openLine()}><Plus className="size-4" />Línea</Button>}
        {editable && line && <Button size="icon" variant="ghost" className="size-8" onClick={() => openLine(line)}><Pencil className="size-3.5" /></Button>}
      </div>
      {line && (
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-2">{labelOf(DESIGN_STATUSES, line.design_status)}</Badge>
          {line.description}
        </div>
      )}

      {/* Trace toolbar */}
      {(line || lines.length === 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {lineTraces.length > 0 ? (
            <Select value={trace?.id ?? ""} onValueChange={(v) => { setTraceId(v); setWalk(null); setSelected(null); }}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {lineTraces.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} · {t.version_label} · {labelOf(DESIGN_STATUSES, t.design_status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">Sin trazas.</span>
          )}
          {editable && <Button size="sm" variant="outline" onClick={() => openTrace()}><Plus className="size-4" />Traza</Button>}
          {editable && trace && <Button size="sm" variant="outline" onClick={() => openTrace(trace)}><Pencil className="size-4" />Estado</Button>}
          {editable && trace && <Button size="sm" variant="outline" onClick={newVersion}><CopyPlus className="size-4" />Nueva versión</Button>}
          <div className="ml-auto flex flex-wrap gap-2">
            {trace && lineTraces.length > 1 && (
              <Select value={compareId ?? "none"} onValueChange={(v) => setCompareId(v === "none" ? null : v)}>
                <SelectTrigger className="w-48"><GitCompare className="size-4" /><SelectValue placeholder="Comparar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin comparar</SelectItem>
                  {lineTraces.filter((t) => t.id !== trace.id).map((t) => <SelectItem key={t.id} value={t.id}>vs {t.version_label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {trace && (walk ? (
              <Button size="sm" variant="outline" onClick={() => setWalk(null)}><X className="size-4" />Salir del recorrido</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={startWalk} disabled={!tNodes.length}><Play className="size-4" />Recorrido manual</Button>
            ))}
            {trace && <Button size="sm" onClick={() => dl(`${policy.slug}-${line?.code || "general"}-${trace.version_label}-SIISA.md`, exportSpecMarkdown(bundle, trace.id), "text/markdown")}><Download className="size-4" />Exportar especificación SIISA</Button>}
            {trace && <Button size="sm" variant="outline" onClick={() => dl(`${policy.slug}-${line?.code || "general"}-${trace.version_label}-SIISA.json`, JSON.stringify(exportSpecJson(bundle, trace.id), null, 2), "application/json")}>JSON</Button>}
          </div>
        </div>
      )}

      {diff && (
        <Card><CardContent className="grid gap-2 p-3 text-xs sm:grid-cols-3">
          <div><b>Agregados</b>: {diff.added.join(", ") || "—"}</div>
          <div><b>Quitados</b>: {diff.removed.join(", ") || "—"}</div>
          <div><b>Modificados</b>: {diff.changed.join(", ") || "—"}</div>
        </CardContent></Card>
      )}

      {trace && (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Canvas */}
          <div className="relative h-[60vh] min-h-[380px] overflow-hidden lg:h-[560px] rounded-lg border border-border bg-muted/20">
            {editable && !walk && (
              <div className="absolute left-2 top-2 z-10 flex items-center gap-2 rounded-md border border-border bg-card p-1.5 text-xs shadow-sm">
                <Select value="" onValueChange={(v) => addNode(v)}>
                  <SelectTrigger className="h-7 w-32 text-xs"><Plus className="size-3.5" /><SelectValue placeholder="Añadir nodo" /></SelectTrigger>
                  <SelectContent>{SIISA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <span className="hidden text-muted-foreground sm:inline">Conectar como</span>
                <Select value={edgeKind} onValueChange={setEdgeKind}>
                  <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{EDGE_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                </Select>
                {selectedEdge && edgeDraft && (
                  <>
                    <Select value={edgeDraft.kind} onValueChange={(k) => setEdgeDraft({ ...edgeDraft, kind: k })}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{EDGE_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="h-7 w-28 text-xs" placeholder="etiqueta" value={edgeDraft.label} onChange={(e) => setEdgeDraft({ ...edgeDraft, label: e.target.value })} />
                    <Button size="sm" className="h-7" onClick={saveEdge}><Save className="size-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => removeEdge(selectedEdge)}><Trash2 className="size-3.5" /></Button>
                  </>
                )}
              </div>
            )}
            {tNodes.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Traza vacía. {editable ? "Usá «Añadir nodo» (empezá por Inicio) para modelarla." : "Todavía no tiene nodos."} No se infiere ningún nodo automáticamente.
              </div>
            ) : (
              <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={onNodesChange}
                onConnect={onConnect}
                onNodeClick={(_, n) => { setSelected(n.id); setSelectedEdge(null); setFocusRule(null); }}
                onEdgeClick={(_, e) => { setSelectedEdge(e.id); const x = tEdges.find((y) => y.id === e.id); setEdgeDraft({ kind: x?.kind ?? "secundaria", label: x?.label ?? "" }); }}
                onPaneClick={() => { setSelected(null); setSelectedEdge(null); }}
                nodesConnectable={editable && !walk}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={16} />
                <Controls showInteractive={false} />
                <MiniMap pannable zoomable className="!bg-card" />
              </ReactFlow>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-3">
            {walk ? (
              <Card><CardContent className="space-y-3 p-4 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand">Recorrido manual (didáctico)</div>
                <p className="text-xs text-muted-foreground">Elegís cada rama a mano. El sistema no decide ni aprueba nada.</p>
                {walkVars.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium">Valores de prueba (sin datos personales reales)</div>
                    {walkVars.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <span className="w-24 shrink-0 truncate text-xs">{v.code || v.name}</span>
                        <Input className="h-7 text-xs" value={walkInputs[v.code || v.name] ?? ""} onChange={(e) => setWalkInputs((s) => ({ ...s, [v.code || v.name]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                )}
                {walkCurrent && (
                  <div className="rounded-md border border-border p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">{walkCurrent.node_type}</div>
                    <div className="font-medium">{walkCurrent.label}</div>
                    {!evaluable(walkCurrent) && (
                      <Badge variant="destructive" className="mt-1">NO EVALUABLE — regla no confirmada o incompleta</Badge>
                    )}
                  </div>
                )}
                {walkOut.length ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Elegí la rama:</div>
                    {walkOut.map((e) => (
                      <Button key={e.id} size="sm" variant="outline" className="w-full justify-start" onClick={() => { setWalk([...(walk ?? []), e.to_node_id]); setSelected(e.to_node_id); }}>
                        {labelOf(EDGE_KINDS, e.kind)}{e.label ? ` (${e.label})` : ""} → {nodeById[e.to_node_id]?.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Fin del recorrido: el nodo no tiene salidas.</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => walk.length > 1 && setWalk(walk.slice(0, -1))}><RotateCcw className="size-3.5" />Atrás</Button>
                  {editable && <Button size="sm" onClick={saveWalk}><Save className="size-3.5" />Guardar propuesta</Button>}
                </div>
              </CardContent></Card>
            ) : sel && !isMobile ? (
              <Card><CardContent className="max-h-[560px] overflow-y-auto p-4">
                <NodeInspector node={sel} bundle={bundle} editable={editable} onSave={saveNode} onDelete={() => removeNode(sel.id)} onClose={() => setSelected(null)} lineRuleIds={new Set(lineRules.map((r) => r.id))} />
              </CardContent></Card>
            ) : (
              <Card><CardContent className="p-4 text-xs text-muted-foreground">
                Seleccioná un nodo para ver qué recibe, qué genera, qué condición plantea y a dónde deriva. {editable ? "Usá «Añadir nodo» para empezar." : ""}
                <div className="mt-3 text-foreground">
                  <b>{trace.name}</b> · {trace.version_label} · {labelOf(DESIGN_STATUSES, trace.design_status)}
                  {trace.notes && <p className="mt-1 text-muted-foreground">{trace.notes}</p>}
                </div>
              </CardContent></Card>
            )}
          </div>
        </div>
      )}

      {trace && (
        <Card><CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="size-4 text-brand" /> Pendientes antes de SIISA ({issues.length})
          </div>
          {issues.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin pendientes detectados en el diseño.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {issues.map((x, i) => (
                <li key={i}>
                  <button className="text-left hover:underline" onClick={() => x.nodeId && setSelected(x.nodeId)}>
                    <Badge variant={x.level === "pendiente" ? "destructive" : "secondary"} className="mr-1.5 text-[9px]">{x.level}</Badge>
                    {x.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">Avisos no bloqueantes. Ante indefinición se muestra pendiente; nunca se asume un valor ni un dictamen.</p>
        </CardContent></Card>
      )}

      <Sheet open={Boolean(isMobile && sel && !walk)} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader><SheetTitle>{sel?.label || "Nodo"}</SheetTitle></SheetHeader>
          {sel && <NodeInspector node={sel} bundle={bundle} editable={editable} onSave={saveNode} onDelete={() => removeNode(sel.id)} onClose={() => setSelected(null)} lineRuleIds={new Set(lineRules.map((r) => r.id))} />}
        </SheetContent>
      </Sheet>

      {/* Synced rule list */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reglas {line ? `de ${line.name} y generales` : ""} ({lineRules.length})
        </div>
        {lineRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin reglas.</p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {lineRules.map((r) => {
              const linked = tNodes.filter((n) => n.rule_id === r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => { setFocusRule(focusRule === r.id ? null : r.id); setSelected(linked[0]?.id ?? null); }}
                  className={cn("flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50", focusRule === r.id && "bg-brand/10")}
                >
                  <span className="w-20 shrink-0 font-mono text-xs">{r.code}</span>
                  <span className="flex-1">
                    {r.original_text}
                    {!r.line_id && <span className="ml-1 text-[10px] text-muted-foreground">(general)</span>}
                  </span>
                  <Badge variant={r.definition_status === "CONFIRMADA" ? "default" : r.definition_status === "CONTRADICCION_A_RESOLVER" || r.definition_status === "NO_AUTOMATIZABLE_HOY" ? "destructive" : "secondary"} className="shrink-0 text-[10px]">
                    {labelOf(RULE_STATUSES, r.definition_status)}
                  </Badge>
                  <span className="w-16 shrink-0 text-right text-[10px] text-muted-foreground">{linked.length ? `${linked.length} nodo(s)` : "sin nodo"}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {dlg && (
        <RecordDialog open onOpenChange={(o) => !o && setDlg(null)} title={dlg.title} fields={dlg.fields} initial={dlg.initial} onSubmit={dlg.onSubmit} />
      )}
    </div>
  );
}
