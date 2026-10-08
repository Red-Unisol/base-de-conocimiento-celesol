/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { IMPL_STATUSES, RULE_STATUSES, labelOf, type PolicyBundle } from "@/lib/policies";
import { OPERATORS, ORIGINS, SIISA_TYPES, VAR_TYPES, getConfig, normType, type IoIn, type IoOut } from "@/lib/siisa";

const NONE = "__none__";

function Sel({ value, onChange, options, placeholder, disabled }: { value: string | null | undefined; onChange: (v: string | null) => void; options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean }) {
  return (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? null : v)} disabled={Boolean(disabled)}>
      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>— Sin definir —</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function F({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border border-border p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">{title}</div>
      {children}
    </div>
  );
}

/** Lista editable de pares simples (ej. parámetros, criterios, mapeos). */
function PairList({ items, onChange, keys, disabled }: { items: any[]; onChange: (v: any[]) => void; keys: { k: string; ph: string }[]; disabled: boolean }) {
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex gap-1">
          {keys.map(({ k, ph }) => (
            <Input key={k} className="h-7 text-xs" placeholder={ph} value={it[k] ?? ""} disabled={disabled} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
          ))}
          {!disabled && <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => onChange(items.filter((_, j) => j !== i))}><X className="size-3" /></Button>}
        </div>
      ))}
      {!disabled && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onChange([...items, {}])}><Plus className="size-3" />Agregar</Button>}
    </div>
  );
}

export function NodeInspector({
  node,
  bundle,
  editable,
  onSave,
  onDelete,
  onClose,
  lineRuleIds,
}: {
  node: any;
  bundle: PolicyBundle;
  editable: boolean;
  onSave: (patch: Record<string, any>) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
  lineRuleIds: Set<string>;
}) {
  const [d, setD] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = getConfig(node);
    setD({
      label: node.label ?? "",
      node_type: normType(node.node_type),
      rule_id: node.rule_id,
      question_id: node.question_id,
      integration_id: node.integration_id,
      called_policy_id: node.called_policy_id,
      impl_status: node.impl_status,
      source_excerpt: node.source_excerpt ?? "",
      siisa_transformation: node.siisa_transformation ?? "",
      description: c.description,
      inputs: c.inputs,
      outputs: c.outputs,
      t: c.t,
    });
  }, [node]);

  if (!d) return null;
  const dis = !editable;
  const set = (k: string, v: any) => setD((s: any) => ({ ...s, [k]: v }));
  const setT = (k: string, v: any) => setD((s: any) => ({ ...s, t: { ...s.t, [k]: v } }));
  const t = d.t;
  const type = d.node_type;

  const rules = bundle.rules.filter((r) => lineRuleIds.has(r.id) || r.id === d.rule_id);
  const rule = bundle.rules.find((r) => r.id === d.rule_id);
  const question = bundle.questions.find((q) => q.id === d.question_id);
  const integOpts = bundle.integrations.map((i) => ({ value: i.id, label: i.name }));
  const varNames = bundle.variables.map((v) => v.code || v.name);
  const listId = `vars-${node.id}`;

  async function save() {
    setSaving(true);
    try {
      const inputs: IoIn[] = d.inputs.filter((i: IoIn) => i.name || i.notes);
      const outputs: IoOut[] = d.outputs.filter((o: IoOut) => o.name || o.meaning);
      await onSave({
        label: d.label,
        node_type: d.node_type,
        rule_id: d.rule_id,
        question_id: d.question_id,
        integration_id: d.integration_id,
        called_policy_id: d.called_policy_id,
        impl_status: d.impl_status ?? "no_definido",
        source_excerpt: d.source_excerpt,
        siisa_transformation: d.siisa_transformation,
        // compatibilidad: resumen en texto de las columnas previas
        inputs: inputs.map((i) => `${i.name} (${i.type || "?"})`).join(", "),
        outputs: outputs.map((o) => `${o.name} (${o.type || "?"})`).join(", "),
        config_siisa: { description: d.description, inputs, outputs, t: d.t },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <datalist id={listId}>{varNames.map((v) => <option key={v} value={v} />)}</datalist>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-brand">Inspector de nodo</div>
        <Button size="icon" variant="ghost" className="size-7" onClick={onClose} aria-label="Cerrar"><X className="size-4" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <F label="Tipo SIISA">
          <Sel value={type} onChange={(v) => set("node_type", v ?? "Comentario")} options={SIISA_TYPES.map((x) => ({ value: x, label: x }))} disabled={dis} />
        </F>
        <F label="Estado">
          <Sel value={d.impl_status} onChange={(v) => set("impl_status", v)} options={IMPL_STATUSES} disabled={dis} />
        </F>
      </div>
      <F label="Etiqueta"><Input className="h-8 text-xs" value={d.label} disabled={dis} onChange={(e) => set("label", e.target.value)} /></F>
      <F label="Descripción"><Textarea rows={2} className="text-xs" value={d.description} disabled={dis} onChange={(e) => set("description", e.target.value)} /></F>

      {/* Tipo específico */}
      {type === "Test Binario" && (
        <Section title="Condición binaria">
          <F label="Variable"><Input list={listId} className="h-8 text-xs" value={t.variable ?? ""} disabled={dis} onChange={(e) => setT("variable", e.target.value)} /></F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Operador"><Sel value={t.operator} onChange={(v) => setT("operator", v)} options={OPERATORS.map((o) => ({ value: o, label: o }))} disabled={dis} /></F>
            <F label="Comparar con"><Sel value={t.compare_kind ?? "umbral"} onChange={(v) => setT("compare_kind", v ?? "umbral")} options={[{ value: "umbral", label: "Umbral" }, { value: "variable", label: "Otra variable" }]} disabled={dis} /></F>
          </div>
          {t.compare_kind === "variable" ? (
            <F label="Segunda variable"><Input list={listId} className="h-8 text-xs" value={t.compare_variable ?? ""} disabled={dis} onChange={(e) => setT("compare_variable", e.target.value)} /></F>
          ) : (
            <F label="Umbral (dejar vacío si no está definido)"><Input className="h-8 text-xs" value={t.threshold ?? ""} disabled={dis} onChange={(e) => setT("threshold", e.target.value)} /></F>
          )}
          <div className="grid grid-cols-2 gap-2">
            <F label="Significado VERDADERO"><Input className="h-8 text-xs" value={t.true_label ?? ""} disabled={dis} onChange={(e) => setT("true_label", e.target.value)} /></F>
            <F label="Significado FALSO"><Input className="h-8 text-xs" value={t.false_label ?? ""} disabled={dis} onChange={(e) => setT("false_label", e.target.value)} /></F>
          </div>
          <p className="text-[10px] text-muted-foreground">Las ramas se dibujan en el lienzo con conexiones VERDADERO / FALSO.</p>
        </Section>
      )}
      {type === "Cálculo" && (
        <Section title="Cálculo (no se ejecuta)">
          <F label="Variable de salida"><Input list={listId} className="h-8 text-xs" value={t.output_variable ?? ""} disabled={dis} onChange={(e) => setT("output_variable", e.target.value)} /></F>
          <F label="Fórmula (texto estilo SIISA SQL)"><Textarea rows={3} className="font-mono text-xs" value={t.formula ?? ""} disabled={dis} onChange={(e) => setT("formula", e.target.value)} /></F>
          <F label="Dependencias"><Input className="h-8 text-xs" value={t.dependencies ?? ""} disabled={dis} onChange={(e) => setT("dependencies", e.target.value)} /></F>
        </Section>
      )}
      {type === "Decisión" && (
        <Section title="Decisión">
          <F label="Dictamen (vacío = pendiente)"><Input className="h-8 text-xs" value={t.verdict ?? ""} disabled={dis} onChange={(e) => setT("verdict", e.target.value)} /></F>
          <F label="Variable devuelta"><Input list={listId} className="h-8 text-xs" value={t.returned_variable ?? ""} disabled={dis} onChange={(e) => setT("returned_variable", e.target.value)} /></F>
        </Section>
      )}
      {type === "Llamador" && (
        <Section title="Llamador">
          <F label="Política llamada"><Sel value={d.called_policy_id} onChange={(v) => set("called_policy_id", v)} options={bundle.allPolicies.filter((p) => p.id !== bundle.policy.id).map((p) => ({ value: p.id, label: p.name }))} disabled={dis} /></F>
          <F label="Prefijo"><Input className="h-8 text-xs" value={t.prefix ?? ""} disabled={dis} onChange={(e) => setT("prefix", e.target.value)} /></F>
          <F label="Parámetros"><PairList items={t.params ?? []} onChange={(v) => setT("params", v)} keys={[{ k: "name", ph: "nombre" }, { k: "value", ph: "valor" }]} disabled={dis} /></F>
        </Section>
      )}
      {type === "Matriz" && (
        <Section title="Matriz">
          <F label="Criterios"><PairList items={t.criteria ?? []} onChange={(v) => setT("criteria", v)} keys={[{ k: "name", ph: "criterio" }]} disabled={dis} /></F>
          <F label="Salidas"><Input className="h-8 text-xs" value={t.outputs_desc ?? ""} disabled={dis} onChange={(e) => setT("outputs_desc", e.target.value)} /></F>
          <F label="Tabla real"><Sel value={t.table_status ?? "pendiente"} onChange={(v) => setT("table_status", v ?? "pendiente")} options={[{ value: "pendiente", label: "Pendiente" }, { value: "definida", label: "Definida" }]} disabled={dis} /></F>
          <F label="Notas de la tabla"><Textarea rows={2} className="text-xs" value={t.table_notes ?? ""} disabled={dis} onChange={(e) => setT("table_notes", e.target.value)} /></F>
          {t.table_status !== "definida" && <Badge variant="outline" className="text-[10px]">Tabla pendiente: no se infieren combinaciones</Badge>}
        </Section>
      )}
      {type === "Concurrente" && (
        <Section title="Concurrente">
          <F label="Fuentes participantes"><PairList items={t.sources ?? []} onChange={(v) => setT("sources", v)} keys={[{ k: "name", ph: "fuente / nodo" }]} disabled={dis} /></F>
        </Section>
      )}
      {(type === "REST" || type === "Parser") && (
        <Section title={type}>
          <F label="Fuente (catálogo)"><Sel value={d.integration_id} onChange={(v) => set("integration_id", v)} options={integOpts} disabled={dis} /></F>
          <F label="Referencia de fuente (sin URL ni claves)"><Input className="h-8 text-xs" value={t.source_ref ?? ""} disabled={dis} onChange={(e) => setT("source_ref", e.target.value)} /></F>
          {type === "REST" && <F label="Método"><Sel value={t.method} onChange={(v) => setT("method", v)} options={["GET", "POST", "PUT"].map((m) => ({ value: m, label: m }))} disabled={dis} /></F>}
          <F label="Request (descripción)"><Textarea rows={2} className="text-xs" value={t.request_desc ?? ""} disabled={dis} onChange={(e) => setT("request_desc", e.target.value)} /></F>
          <F label="Response (descripción)"><Textarea rows={2} className="text-xs" value={t.response_desc ?? ""} disabled={dis} onChange={(e) => setT("response_desc", e.target.value)} /></F>
          <F label="Mapeo de variables"><PairList items={t.mapping ?? []} onChange={(v) => setT("mapping", v)} keys={[{ k: "from", ph: "campo respuesta" }, { k: "to", ph: "variable" }]} disabled={dis} /></F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Timeout (opcional)"><Input className="h-8 text-xs" value={t.timeout ?? ""} disabled={dis} onChange={(e) => setT("timeout", e.target.value)} /></F>
            <F label="Reconsulta (opcional)"><Input className="h-8 text-xs" value={t.retry ?? ""} disabled={dis} onChange={(e) => setT("retry", e.target.value)} /></F>
          </div>
        </Section>
      )}
      {type === "Comentario" && (
        <Section title="Comentario">
          <Textarea rows={3} className="text-xs" value={t.text ?? ""} disabled={dis} onChange={(e) => setT("text", e.target.value)} />
        </Section>
      )}

      {/* Entradas / salidas */}
      {type !== "Comentario" && (
        <>
          <Section title={type === "Inicio" ? "Parámetros de entrada" : "Recibe"}>
            {d.inputs.map((i: IoIn, idx: number) => (
              <div key={idx} className="space-y-1 rounded border border-border/60 p-1.5">
                <div className="flex gap-1">
                  <Input list={listId} className="h-7 text-xs" placeholder="nombre" value={i.name ?? ""} disabled={dis} onChange={(e) => set("inputs", d.inputs.map((x: IoIn, j: number) => (j === idx ? { ...x, name: e.target.value } : x)))} />
                  {!dis && <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => set("inputs", d.inputs.filter((_: IoIn, j: number) => j !== idx))}><X className="size-3" /></Button>}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Sel value={i.type} onChange={(v) => set("inputs", d.inputs.map((x: IoIn, j: number) => (j === idx ? { ...x, type: v ?? "" } : x)))} options={VAR_TYPES.map((v) => ({ value: v, label: v }))} placeholder="tipo" disabled={dis} />
                  <Sel value={i.origin} onChange={(v) => set("inputs", d.inputs.map((x: IoIn, j: number) => (j === idx ? { ...x, origin: v ?? "" } : x)))} options={ORIGINS} placeholder="origen" disabled={dis} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px]"><Switch checked={Boolean(i.required)} disabled={dis} onCheckedChange={(c) => set("inputs", d.inputs.map((x: IoIn, j: number) => (j === idx ? { ...x, required: c } : x)))} />requerido</label>
                  <Input className="h-7 text-xs" placeholder="notas" value={i.notes ?? ""} disabled={dis} onChange={(e) => set("inputs", d.inputs.map((x: IoIn, j: number) => (j === idx ? { ...x, notes: e.target.value } : x)))} />
                </div>
              </div>
            ))}
            {!dis && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => set("inputs", [...d.inputs, { name: "", type: "", required: false, origin: "", notes: "" }])}><Plus className="size-3" />Entrada</Button>}
          </Section>
          <Section title="Genera">
            {d.outputs.map((o: IoOut, idx: number) => (
              <div key={idx} className="flex gap-1">
                <Input list={listId} className="h-7 text-xs" placeholder="nombre" value={o.name ?? ""} disabled={dis} onChange={(e) => set("outputs", d.outputs.map((x: IoOut, j: number) => (j === idx ? { ...x, name: e.target.value } : x)))} />
                <div className="w-24 shrink-0"><Sel value={o.type} onChange={(v) => set("outputs", d.outputs.map((x: IoOut, j: number) => (j === idx ? { ...x, type: v ?? "" } : x)))} options={VAR_TYPES.map((v) => ({ value: v, label: v }))} placeholder="tipo" disabled={dis} /></div>
                <Input className="h-7 text-xs" placeholder="significado" value={o.meaning ?? ""} disabled={dis} onChange={(e) => set("outputs", d.outputs.map((x: IoOut, j: number) => (j === idx ? { ...x, meaning: e.target.value } : x)))} />
                {!dis && <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => set("outputs", d.outputs.filter((_: IoOut, j: number) => j !== idx))}><X className="size-3" /></Button>}
              </div>
            ))}
            {!dis && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => set("outputs", [...d.outputs, { name: "", type: "", meaning: "" }])}><Plus className="size-3" />Salida</Button>}
          </Section>
        </>
      )}

      {/* Referencia */}
      <Section title="Referencia (regla, duda, fuente)">
        <F label="Regla de negocio"><Sel value={d.rule_id} onChange={(v) => set("rule_id", v)} options={rules.map((r) => ({ value: r.id, label: `${r.code} — ${r.original_text.slice(0, 50)}` }))} disabled={dis} /></F>
        {rule && <p className="rounded bg-muted p-1.5 text-[11px]">{rule.original_text} <Badge variant="secondary" className="ml-1 text-[9px]">{labelOf(RULE_STATUSES, rule.definition_status)}</Badge></p>}
        <F label="Duda"><Sel value={d.question_id} onChange={(v) => set("question_id", v)} options={bundle.questions.map((q) => ({ value: q.id, label: `${q.code} — ${q.question.slice(0, 50)}` }))} disabled={dis} /></F>
        {question && <p className="rounded bg-muted p-1.5 text-[11px]">{question.question} <Badge variant="outline" className="ml-1 text-[9px]">{question.status}</Badge></p>}
        {type !== "REST" && type !== "Parser" && <F label="Fuente de datos"><Sel value={d.integration_id} onChange={(v) => set("integration_id", v)} options={integOpts} disabled={dis} /></F>}
        <F label="Extracto del manual"><Textarea rows={2} className="text-xs" value={d.source_excerpt} disabled={dis} onChange={(e) => set("source_excerpt", e.target.value)} /></F>
        <F label="Notas de transformación SIISA"><Textarea rows={2} className="text-xs" value={d.siisa_transformation} disabled={dis} onChange={(e) => set("siisa_transformation", e.target.value)} /></F>
      </Section>

      {editable && (
        <div className="sticky bottom-0 flex gap-2 bg-background py-2">
          <Button className="flex-1" onClick={save} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />}Guardar nodo</Button>
          <Button variant="outline" size="icon" onClick={onDelete} aria-label="Eliminar nodo"><Trash2 className="size-4" /></Button>
        </div>
      )}
    </div>
  );
}
