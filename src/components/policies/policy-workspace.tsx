/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, FileText, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { RecordDialog, type Field } from "@/components/policies/record-dialog";
import { TraceStudio } from "@/components/policies/trace-studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CHANGE_TYPES,
  DOC_TYPES,
  IMPL_STATUSES,
  NODE_TYPES,
  POLICY_STATUSES,
  QUESTION_STATUSES,
  RULE_STATUSES,
  SEGMENTS,
  deleteRow,
  labelOf,
  logChange,
  saveRow,
  setQuestionRules,
  signedPolicyFileUrl,
  uploadPolicyFile,
  type PolicyBundle,
} from "@/lib/policies";
import { formatDate } from "@/lib/utils";

type DialogState = { title: string; fields: Field[]; initial: any; onSubmit: (v: any) => Promise<void>; extra?: ReactNode } | null;

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function Val({ v }: { v: any }) {
  if (v === true) return <>Sí</>;
  if (v === false) return <>No</>;
  return <>{v === null || v === undefined || v === "" ? "—" : String(v)}</>;
}

export function PolicyWorkspace({ bundle, editable }: { bundle: PolicyBundle; editable: boolean }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { policy, documents, rules, questions, questionRules, nodes, edges, log, integrations, allPolicies } = bundle;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["policy", policy.slug] });
    void qc.invalidateQueries({ queryKey: ["policies"] });
  };

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

  async function remove(table: any, id: string, what: string, type: string) {
    if (!confirm(`¿Eliminar ${what}?`)) return;
    try {
      await deleteRow(table, id);
      await logChange(policy.id, type, `Eliminó ${what}`, policy.working_version);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo eliminar");
    }
  }

  const ruleOpts = rules.map((r) => ({ value: r.id, label: `${r.code || "(sin código)"} — ${r.variable || r.original_text.slice(0, 40) || "regla"}` }));
  const integOpts = integrations.map((i) => ({ value: i.id, label: i.name }));
  const policyOpts = allPolicies.filter((p) => p.id !== policy.id).map((p) => ({ value: p.id, label: p.name }));
  const nodeOpts = nodes.map((n) => ({ value: n.id, label: `${n.label || "(sin nombre)"} · ${n.node_type}` }));

  /* ---------- Field configs ---------- */
  const policyFields: Field[] = [
    { name: "name", label: "Nombre" },
    { name: "code", label: "Código" },
    { name: "status", label: "Estado", kind: "select", options: POLICY_STATUSES },
    { name: "working_version", label: "Versión de trabajo" },
    { name: "parent_policy_id", label: "Política principal (si es subpolítica)", kind: "select", options: policyOpts },
    { name: "source_url", label: "Fuente principal (URL)" },
    { name: "description", label: "Descripción", kind: "textarea" },
    { name: "scope", label: "Alcance", kind: "textarea" },
  ];
  const docFields: Field[] = [
    { name: "title", label: "Título" },
    { name: "doc_type", label: "Tipo", kind: "select", options: DOC_TYPES },
    { name: "external_url", label: "URL externa (Google Drive u otra)", full: true },
    { name: "version_label", label: "Versión" },
    { name: "doc_date", label: "Fecha", kind: "date" },
    { name: "notes", label: "Observaciones", kind: "textarea" },
  ];
  const lineOpts = bundle.lines.map((l: any) => ({ value: l.id, label: l.name }));
  const ruleFields: Field[] = [
    { name: "line_id", label: "Línea (vacío = general)", kind: "select", options: lineOpts },
    { name: "segment", label: "Segmento", kind: "select", options: SEGMENTS },
    { name: "code", label: "Código de regla" },
    { name: "block", label: "Bloque" },
    { name: "original_text", label: "Texto original de la política", kind: "textarea" },
    { name: "variable", label: "Variable" },
    { name: "data_source", label: "Fuente del dato" },
    { name: "integration_id", label: "Origen de dato (catálogo)", kind: "select", options: integOpts },
    { name: "operator", label: "Operador" },
    { name: "threshold", label: "Parámetro / umbral" },
    { name: "action_result", label: "Acción / resultado", full: true },
    { name: "conditions", label: "Condiciones", kind: "textarea" },
    { name: "effect", label: "Efecto", kind: "textarea" },
    { name: "exceptions", label: "Excepciones", kind: "textarea" },
    { name: "source_excerpt", label: "Extracto textual del manual", kind: "textarea" },
    { name: "definition_status", label: "Estado de definición", kind: "select", options: RULE_STATUSES },
    { name: "precedence", label: "Precedencia", kind: "number" },
    { name: "sort_order", label: "Orden", kind: "number" },
    { name: "modifies_limit", label: "Modifica cupo", kind: "bool" },
    { name: "modifies_term", label: "Modifica plazo", kind: "bool" },
    { name: "allows_exception", label: "Admite excepción", kind: "bool" },
    { name: "manual_intervention", label: "Intervención manual", kind: "bool" },
  ];
  const questionFields: Field[] = [
    { name: "code", label: "Código" },
    { name: "status", label: "Estado", kind: "select", options: QUESTION_STATUSES },
    { name: "question", label: "Pregunta", kind: "textarea" },
    { name: "rule_ids", label: "Reglas vinculadas", kind: "multi", options: ruleOpts },
    { name: "answer", label: "Respuesta", kind: "textarea" },
    { name: "validated_by", label: "Quién validó" },
    { name: "validated_at", label: "Fecha de validación", kind: "date" },
    { name: "agreed_definition", label: "Definición acordada", kind: "textarea" },
    { name: "validity_scope", label: "Vigencia / alcance", kind: "textarea" },
  ];
  const nodeFields: Field[] = [
    { name: "label", label: "Nombre del nodo" },
    { name: "node_type", label: "Tipo de nodo propuesto", kind: "select", options: NODE_TYPES },
    { name: "rule_id", label: "Regla asociada", kind: "select", options: ruleOpts },
    { name: "called_policy_id", label: "Política / subpolítica llamada", kind: "select", options: policyOpts },
    { name: "integration_id", label: "Integración (catálogo)", kind: "select", options: integOpts },
    { name: "data_origin", label: "Origen de dato (texto)" },
    { name: "inputs", label: "Variables de entrada", kind: "textarea" },
    { name: "outputs", label: "Salidas", kind: "textarea" },
    { name: "impl_status", label: "Estado de implementación", kind: "select", options: IMPL_STATUSES },
    { name: "sort_order", label: "Orden", kind: "number" },
    { name: "notes", label: "Notas de implementación", kind: "textarea" },
  ];
  const edgeFields: Field[] = [
    { name: "from_node_id", label: "Desde", kind: "select", options: nodeOpts },
    { name: "to_node_id", label: "Hacia", kind: "select", options: nodeOpts },
    { name: "label", label: "Etiqueta (ej. Sí / No)", full: true },
  ];

  const nullify = (v: any) => {
    const out: any = {};
    for (const [k, val] of Object.entries(v)) out[k] = val === "" && /(_id|_at|_date|url)$/.test(k) ? null : val;
    return out;
  };

  /* ---------- Openers ---------- */
  const editPolicy = () =>
    setDialog({
      title: "Editar política",
      fields: policyFields,
      initial: policy,
      onSubmit: wrap(async (v) => {
        const { name, code, status, working_version, parent_policy_id, source_url, description, scope } = nullify(v);
        await saveRow("policies", { name, code, status, working_version, parent_policy_id, source_url, description, scope }, policy.id);
        await logChange(policy.id, working_version !== policy.working_version ? "nueva_version" : "edicion", "Actualizó la ficha de la política", working_version);
      }),
    });

  const openDoc = (d?: any) => {
    setPendingFile(null);
    setDialog({
      title: d ? "Editar documento" : "Nuevo documento fuente",
      fields: docFields,
      initial: d ?? { doc_type: "otro" },
      extra: (
        <div className="space-y-1.5">
          <Label className="text-xs">Archivo (PDF, DOCX o XLSX) — opcional</Label>
          <Input
            type="file"
            accept=".pdf,.docx,.doc,.xlsx,.xls"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          {d?.storage_path && <p className="text-xs text-muted-foreground">Ya tiene un archivo cargado; si elegís otro, se reemplaza.</p>}
        </div>
      ),
      onSubmit: wrap(async (v) => {
        const { title, doc_type, external_url, version_label, doc_date, notes } = nullify(v);
        if (!title) throw new Error("El título es obligatorio");
        const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
        const file = fileInput?.files?.[0] ?? pendingFile;
        const storage_path = file ? await uploadPolicyFile(policy.id, file) : d?.storage_path ?? null;
        await saveRow("policy_documents", { policy_id: policy.id, title, doc_type: doc_type ?? "otro", external_url, version_label, doc_date, notes, storage_path }, d?.id);
        await logChange(policy.id, "documento", `${d ? "Editó" : "Agregó"} documento «${title}»`, policy.working_version);
      }),
    });
  };

  const openRule = (r?: any) =>
    setDialog({
      title: r ? "Editar regla" : "Nueva regla",
      fields: ruleFields,
      initial: r ?? { definition_status: "PENDIENTE_VALIDACION", sort_order: rules.length + 1 },
      onSubmit: wrap(async (v) => {
        const vals = nullify(v);
        const keys = ruleFields.map((f) => f.name);
        const row: any = { policy_id: policy.id };
        for (const k of keys) row[k] = vals[k];
        row.definition_status ??= "PENDIENTE_VALIDACION";
        await saveRow("policy_rules", row, r?.id);
        await logChange(policy.id, "regla", `${r ? "Editó" : "Agregó"} regla ${row.code || ""}`.trim(), policy.working_version);
      }),
    });

  const openQuestion = (q?: any) =>
    setDialog({
      title: q ? "Editar duda" : "Nueva duda",
      fields: questionFields,
      initial: q
        ? { ...q, rule_ids: questionRules.filter((x) => x.question_id === q.id).map((x) => x.rule_id) }
        : { status: "abierta", rule_ids: [] },
      onSubmit: wrap(async (v) => {
        const { rule_ids, ...rest } = nullify(v);
        if (!rest.question) throw new Error("La pregunta es obligatoria");
        const row: any = { policy_id: policy.id };
        for (const f of questionFields) if (f.name !== "rule_ids") row[f.name] = rest[f.name];
        row.status ??= "abierta";
        const saved = await saveRow("policy_questions", row, q?.id);
        await setQuestionRules(saved.id, rule_ids ?? []);
        await logChange(policy.id, "duda", `${q ? "Editó" : "Agregó"} duda ${row.code || ""}${row.status === "resuelta" ? " (resuelta)" : ""}`.trim(), policy.working_version);
      }),
    });

  const openNode = (n?: any) =>
    setDialog({
      title: n ? "Editar nodo SIISA" : "Nuevo nodo SIISA",
      fields: nodeFields,
      initial: n ?? { node_type: "otro", impl_status: "no_definido", sort_order: nodes.length + 1 },
      onSubmit: wrap(async (v) => {
        const vals = nullify(v);
        const row: any = { policy_id: policy.id };
        for (const f of nodeFields) row[f.name] = vals[f.name];
        row.node_type ??= "otro";
        row.impl_status ??= "no_definido";
        await saveRow("policy_siisa_nodes", row, n?.id);
        await logChange(policy.id, "siisa", `${n ? "Editó" : "Agregó"} nodo «${row.label || row.node_type}»`, policy.working_version);
      }),
    });

  const openEdge = () =>
    setDialog({
      title: "Nueva conexión",
      fields: edgeFields,
      initial: {},
      onSubmit: wrap(async (v) => {
        if (!v.from_node_id || !v.to_node_id) throw new Error("Elegí ambos nodos");
        await saveRow("policy_siisa_edges", { policy_id: policy.id, ...v });
        await logChange(policy.id, "siisa", "Agregó conexión entre nodos", policy.working_version);
      }),
    });

  async function openFile(path: string) {
    try {
      window.open(await signedPolicyFileUrl(path), "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo abrir el archivo");
    }
  }

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const policyById = Object.fromEntries(allPolicies.map((p) => [p.id, p]));
  const ruleById = Object.fromEntries(rules.map((r) => [r.id, r]));
  const integById = Object.fromEntries(integrations.map((i) => [i.id, i]));

  const Add = ({ onClick, children }: { onClick: () => void; children: ReactNode }) =>
    editable ? (
      <Button size="sm" onClick={onClick}>
        <Plus className="size-4" />
        {children}
      </Button>
    ) : null;

  const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) =>
    editable ? (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="size-7" onClick={onEdit}><Pencil className="size-3.5" /></Button>
        <Button size="icon" variant="ghost" className="size-7" onClick={onDelete}><Trash2 className="size-3.5" /></Button>
      </div>
    ) : null;

  return (
    <>
      <Tabs defaultValue="estudio">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="estudio">Estudio de traza</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="reglas">Reglas ({rules.length})</TabsTrigger>
          <TabsTrigger value="dudas">Dudas ({questions.filter((q) => q.status !== "resuelta").length})</TabsTrigger>
          <TabsTrigger value="siisa">Nodos (tabla)</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* RESUMEN */}
        <TabsContent value="estudio" className="mt-4">
          <TraceStudio bundle={bundle} editable={editable} />
        </TabsContent>

        <TabsContent value="resumen" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              {[
                ["Nombre", policy.name],
                ["Código", policy.code],
                ["Estado", labelOf(POLICY_STATUSES, policy.status)],
                ["Versión de trabajo", policy.working_version],
                ["Política principal", policy.parent_policy_id ? policyById[policy.parent_policy_id]?.name : "—"],
                ["Actualizada", formatDate(policy.updated_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="mt-0.5 text-sm"><Val v={v} /></div>
                </div>
              ))}
              <div className="sm:col-span-2">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fuente principal</div>
                <div className="mt-0.5 text-sm">
                  {policy.source_url ? (
                    <a href={policy.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                      {policy.source_url} <ExternalLink className="size-3" />
                    </a>
                  ) : "—"}
                </div>
              </div>
              {[["Descripción", policy.description], ["Alcance", policy.scope]].map(([k, v]) => (
                <div key={k} className="sm:col-span-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k}</div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm"><Val v={v} /></p>
                </div>
              ))}
              {editable && (
                <div className="sm:col-span-2">
                  <Button size="sm" variant="outline" onClick={editPolicy}><Pencil className="size-4" />Editar ficha</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTOS */}
        <TabsContent value="documentos" className="mt-4 space-y-3">
          <div className="flex justify-end"><Add onClick={() => openDoc()}>Agregar documento</Add></div>
          {documents.length === 0 ? (
            <Empty>Sin documentos fuente cargados.</Empty>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Versión / fecha</TableHead>
                <TableHead>Acceso</TableHead><TableHead>Observaciones</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{labelOf(DOC_TYPES, d.doc_type)}</TableCell>
                    <TableCell className="text-xs">{d.version_label || "—"}{d.doc_date ? ` · ${d.doc_date}` : ""}</TableCell>
                    <TableCell className="space-x-2 text-xs">
                      {d.storage_path && <button className="inline-flex items-center gap-1 text-brand hover:underline" onClick={() => openFile(d.storage_path)}><FileText className="size-3" />Archivo</button>}
                      {d.external_url && <a className="inline-flex items-center gap-1 text-brand hover:underline" href={d.external_url} target="_blank" rel="noreferrer"><ExternalLink className="size-3" />Enlace</a>}
                      {!d.storage_path && !d.external_url && "—"}
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground">{d.notes || "—"}</TableCell>
                    <TableCell><RowActions onEdit={() => openDoc(d)} onDelete={() => remove("policy_documents", d.id, `documento «${d.title}»`, "documento")} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* REGLAS */}
        <TabsContent value="reglas" className="mt-4 space-y-3">
          <div className="flex justify-end"><Add onClick={() => openRule()}>Agregar regla</Add></div>
          {rules.length === 0 ? (
            <Empty>Todavía no hay reglas cargadas para esta política.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader><TableRow>
                  {["#", "Código", "Bloque", "Texto original", "Variable", "Fuente", "Operador", "Umbral", "Acción", "Cupo", "Plazo", "Excep.", "Manual", "Estado", "Dudas", ""].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {rules.map((r) => {
                    const linked = questionRules.filter((x) => x.rule_id === r.id).map((x) => questions.find((q) => q.id === x.question_id)?.code || "•");
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{r.sort_order}</TableCell>
                        <TableCell className="font-medium">{r.code || "—"}</TableCell>
                        <TableCell>{r.block || "—"}</TableCell>
                        <TableCell className="min-w-56 max-w-sm whitespace-pre-wrap">{r.original_text || "—"}</TableCell>
                        <TableCell>{r.variable || "—"}</TableCell>
                        <TableCell>{r.integration_id ? integById[r.integration_id]?.name : r.data_source || "—"}</TableCell>
                        <TableCell>{r.operator || "—"}</TableCell>
                        <TableCell>{r.threshold || "—"}</TableCell>
                        <TableCell className="min-w-40">{r.action_result || "—"}</TableCell>
                        <TableCell><Val v={r.modifies_limit} /></TableCell>
                        <TableCell><Val v={r.modifies_term} /></TableCell>
                        <TableCell><Val v={r.allows_exception} /></TableCell>
                        <TableCell><Val v={r.manual_intervention} /></TableCell>
                        <TableCell><Badge variant={r.definition_status === "CONFIRMADA" ? "default" : "secondary"} className="whitespace-nowrap text-[10px]">{labelOf(RULE_STATUSES, r.definition_status)}</Badge></TableCell>
                        <TableCell>{linked.length ? linked.join(", ") : "—"}</TableCell>
                        <TableCell><RowActions onEdit={() => openRule(r)} onDelete={() => remove("policy_rules", r.id, `regla ${r.code}`, "regla")} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* DUDAS */}
        <TabsContent value="dudas" className="mt-4 space-y-3">
          <div className="flex justify-end"><Add onClick={() => openQuestion()}>Agregar duda</Add></div>
          {questions.length === 0 ? (
            <Empty>Sin dudas registradas.</Empty>
          ) : (
            questions.map((q) => {
              const linked = questionRules.filter((x) => x.question_id === q.id).map((x) => ruleById[x.rule_id]?.code || "regla");
              return (
                <Card key={q.id}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant={q.status === "resuelta" ? "default" : "outline"}>{labelOf(QUESTION_STATUSES, q.status)}</Badge>
                      {q.code && <span className="font-semibold">{q.code}</span>}
                      <p className="flex-1 whitespace-pre-wrap">{q.question}</p>
                      <RowActions onEdit={() => openQuestion(q)} onDelete={() => remove("policy_questions", q.id, `duda ${q.code}`, "duda")} />
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>Reglas vinculadas: <span className="text-foreground">{linked.join(", ") || "—"}</span></div>
                      <div>Validó: <span className="text-foreground">{q.validated_by || "—"}{q.validated_at ? ` · ${q.validated_at}` : ""}</span></div>
                      {q.answer && <div className="sm:col-span-2">Respuesta: <span className="text-foreground">{q.answer}</span></div>}
                      {q.agreed_definition && <div className="sm:col-span-2">Definición acordada: <span className="text-foreground">{q.agreed_definition}</span></div>}
                      {q.validity_scope && <div className="sm:col-span-2">Vigencia / alcance: <span className="text-foreground">{q.validity_scope}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* SIISA */}
        <TabsContent value="siisa" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Diseño interno de la futura traza en el Motor de Decisiones SIISA. Es solo un registro: nada de esto se publica ni se conecta con SIISA.
          </p>
          <div className="flex justify-end gap-2">
            <span className="text-xs text-muted-foreground">Los nodos se crean y conectan desde «Estudio de traza».</span>
          </div>
          
          {nodes.length > 0 && (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader><TableRow>
                  {["#", "Nodo", "Tipo", "Regla", "Entradas", "Salidas", "Llama a", "Origen de dato", "Estado", "Notas", ""].map((h) => <TableHead key={h}>{h}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {nodes.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>{n.sort_order}</TableCell>
                      <TableCell className="font-medium">{n.label || "—"}</TableCell>
                      <TableCell>{n.node_type}</TableCell>
                      <TableCell>{n.rule_id ? ruleById[n.rule_id]?.code || "regla" : "—"}</TableCell>
                      <TableCell className="whitespace-pre-wrap">{n.inputs || "—"}</TableCell>
                      <TableCell className="whitespace-pre-wrap">{n.outputs || "—"}</TableCell>
                      <TableCell>{n.called_policy_id ? policyById[n.called_policy_id]?.name : "—"}</TableCell>
                      <TableCell>{n.integration_id ? integById[n.integration_id]?.name : n.data_origin || "—"}</TableCell>
                      <TableCell>{labelOf(IMPL_STATUSES, n.impl_status)}</TableCell>
                      <TableCell className="max-w-xs whitespace-pre-wrap">{n.notes || "—"}</TableCell>
                      <TableCell><RowActions onEdit={() => openNode(n)} onDelete={() => remove("policy_siisa_nodes", n.id, `nodo «${n.label}»`, "siisa")} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {edges.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conexiones</div>
              {edges.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span>{nodeById[e.from_node_id]?.label || "?"}</span>
                  <ArrowRight className="size-3" />
                  <span>{nodeById[e.to_node_id]?.label || "?"}</span>
                  {e.label && <Badge variant="outline" className="text-[10px]">{e.label}</Badge>}
                  {editable && <Button size="icon" variant="ghost" className="size-6" onClick={() => remove("policy_siisa_edges", e.id, "conexión", "siisa")}><Trash2 className="size-3" /></Button>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* HISTORIAL */}
        <TabsContent value="historial" className="mt-4">
          {log.length === 0 ? (
            <Empty>Sin cambios registrados todavía.</Empty>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Fecha</TableHead><TableHead>Versión</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead><TableHead>Usuario</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {log.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(l.created_at)}</TableCell>
                    <TableCell className="text-xs">{l.version_label || "—"}</TableCell>
                    <TableCell className="text-xs">{labelOf(CHANGE_TYPES, l.change_type)}</TableCell>
                    <TableCell className="text-sm">{l.description}</TableCell>
                    <TableCell className="text-xs">{l.user_email || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {dialog && (
        <RecordDialog
          open={Boolean(dialog)}
          onOpenChange={(o) => !o && setDialog(null)}
          title={dialog.title}
          fields={dialog.fields}
          initial={dialog.initial}
          onSubmit={dialog.onSubmit}
          extra={dialog.extra}
        />
      )}
      {editable && <span className="hidden"><Upload /></span>}
    </>
  );
}

/** Vista simple por niveles: cada columna es un paso del flujo según las conexiones cargadas. */
function SiisaFlow({ nodes, edges, policyById }: { nodes: any[]; edges: any[]; policyById: Record<string, any> }) {
  if (nodes.length === 0) return <Empty>Todavía no hay nodos de diseño SIISA para esta política.</Empty>;
  const level: Record<string, number> = {};
  const incoming = new Set(edges.map((e) => e.to_node_id));
  const queue = nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id);
  queue.forEach((id) => (level[id] = 0));
  let guard = 0;
  while (queue.length && guard++ < 1000) {
    const id = queue.shift()!;
    const cur = level[id] ?? 0;
    for (const e of edges.filter((x) => x.from_node_id === id)) {
      const lv = level[e.to_node_id];
      if (lv === undefined || lv < cur + 1) {
        if (cur + 1 < nodes.length) {
          level[e.to_node_id] = cur + 1;
          queue.push(e.to_node_id);
        }
      }
    }
  }
  nodes.forEach((n) => (level[n.id] ??= 0));
  const cols: any[][] = [];
  nodes.forEach((n) => (cols[level[n.id] ?? 0] ??= []).push(n));
  return (
    <div className="flex items-stretch gap-3 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
      {cols.map((col, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            {col.map((n) => (
              <div key={n.id} className="w-44 rounded-md border border-border bg-card p-2.5 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">{n.node_type}</div>
                <div className="text-sm font-medium">{n.label || "(sin nombre)"}</div>
                {n.called_policy_id && <div className="text-[11px] text-muted-foreground">→ {policyById[n.called_policy_id]?.name}</div>}
                <div className="mt-1 text-[10px] text-muted-foreground">{labelOf(IMPL_STATUSES, n.impl_status)}</div>
              </div>
            ))}
          </div>
          {i < cols.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}
