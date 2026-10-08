/* eslint-disable @typescript-eslint/no-explicit-any */
import { Info } from "lucide-react";
import { useMemo, useState } from "react";

import { DecisionTrace, normalizeTrace, type TraceRule, type TraceRuleResult } from "@/components/policies/decision-trace";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RULE_STATUSES, labelOf, type PolicyBundle } from "@/lib/policies";
import { cn } from "@/lib/utils";

/**
 * Vista de traza por línea: muestra las reglas cargadas en orden y permite marcar un recorrido de ejemplo.
 * El resultado de cada regla lo elige el operador; no es una decisión crediticia real.
 */
export function TraceView({ bundle }: { bundle: PolicyBundle }) {
  const { lines, rules, policy, integrations } = bundle;
  const [lineId, setLineId] = useState<string | null>(lines[0]?.id ?? null);
  const [inputs, setInputs] = useState<Record<string, { value: string; result: TraceRuleResult }>>({});
  const line = lines.find((l) => l.id === lineId) ?? null;
  const trace = bundle.traces.find((t) => t.line_id === lineId);

  const ordered = useMemo(
    () =>
      rules
        .filter((r) => !lineId || r.line_id === lineId || !r.line_id)
        .sort((a, b) => (a.line_id ? 0 : 1) - (b.line_id ? 0 : 1) || a.sort_order - b.sort_order),
    [rules, lineId],
  );

  const traceRules: TraceRule[] = ordered.map((r) => ({
    id: r.id,
    name: `${r.code} · ${r.block || "Regla"}`,
    value: inputs[r.id]?.value ?? "",
    threshold: [r.operator, r.threshold].filter(Boolean).join(" ") || r.original_text,
    result: inputs[r.id]?.result ?? "no evaluada",
    source: integrations.find((i) => i.id === r.integration_id)?.name ?? r.data_source ?? "",
  }));
  const norm = normalizeTrace(traceRules);
  const failed = norm.find((r) => r.result === "no pasó");
  const decision = failed ? "rechazado" : norm.length && norm.every((r) => r.result === "pasó") ? "aprobado" : "pendiente";
  const version = `${policy.name} ${trace?.version_label ?? policy.working_version ?? ""}`.trim();
  const set = (id: string, patch: Partial<{ value: string; result: TraceRuleResult }>) =>
    setInputs((s) => ({ ...s, [id]: { value: s[id]?.value ?? "", result: s[id]?.result ?? "no evaluada", ...patch } }));

  if (!lines.length) return <p className="text-sm text-muted-foreground">Esta política todavía no tiene líneas cargadas.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {lines.map((l) => (
          <button
            key={l.id}
            onClick={() => { setLineId(l.id); setInputs({}); }}
            className={cn("rounded-md border px-3 py-1.5 text-sm", lineId === l.id ? "border-brand bg-brand/10 font-semibold" : "border-border hover:border-brand")}
          >
            {l.name}
          </button>
        ))}
      </div>

      {line && (
        <div className="rounded-lg border border-border p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cuándo aplica «{line.name}»</div>
          <p className="mt-1">
            Segmento: <b>{line.segment || "sin definir"}</b>. {line.description}
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {rules.filter((r) => r.line_id === line.id).map((r) => (
              <li key={r.id}>
                • {r.original_text} <Badge variant="secondary" className="ml-1 text-[9px]">{labelOf(RULE_STATUSES, r.definition_status)}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">Texto relevado del manual; pendiente de validación operativa.</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        Recorrido de ejemplo: cargá el dato de prueba y marcá a mano si cada regla pasó. El sistema sólo dibuja el camino; no decide ni otorga créditos. No uses datos personales reales.
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <DecisionTrace
          data={{
            rules: traceRules,
            decision,
            reason: failed ? `No cumple ${failed.name}` : "",
            version,
          }}
        />
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reglas en orden de evaluación</div>
          {ordered.map((r, i) => (
            <div key={r.id} className={cn("space-y-1.5 rounded-md border border-border p-2", norm[i]?.result === "no evaluada" && inputs[r.id]?.result && "opacity-60")}>
              <div className="text-xs"><b>{r.code}</b> {r.original_text}</div>
              <div className="flex gap-1.5">
                <Input className="h-7 text-xs" placeholder="dato de prueba" value={inputs[r.id]?.value ?? ""} onChange={(e) => set(r.id, { value: e.target.value })} />
                <Select value={inputs[r.id]?.result ?? "no evaluada"} onValueChange={(v) => set(r.id, { result: v as TraceRuleResult })}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasó">Pasó</SelectItem>
                    <SelectItem value="no pasó">No pasó</SelectItem>
                    <SelectItem value="no evaluada">No evaluada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <div className="text-sm">
            Decisión del recorrido: <b>{decision === "aprobado" ? "Aprobado" : decision === "rechazado" ? "Rechazado" : "Pendiente"}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
