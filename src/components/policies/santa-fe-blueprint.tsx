/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertTriangle, Download, Info } from "lucide-react";

import { TraceStudio } from "@/components/policies/trace-studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RULE_STATUSES, labelOf, type PolicyBundle } from "@/lib/policies";
import {
  BLUEPRINT_LEGEND,
  download,
  exportBlueprintJson,
  exportBlueprintMarkdown,
  isOutOfEngine,
  traceMeta,
} from "@/lib/siisa";

const RESULT_FIELDS = ["elegibilidad", "motivo", "cupo_mensual", "monto_maximo_otorgable", "plazo_permitido", "cuota_estimada"];
const CATS = ["identificada en código", "contrato pendiente", "no verificada"];

/** Vista principal multialternativa: una traza conjunta + cuatro resultados por línea. Sólo diseño. */
export function SantaFeBlueprint({ bundle, editable }: { bundle: PolicyBundle; editable: boolean }) {
  const trace = bundle.traces.find((t) => !t.line_id) ?? null;
  const engine = bundle.rules.filter((r) => !isOutOfEngine(r));
  const outside = bundle.rules.filter(isOutOfEngine);
  const avail = trace ? traceMeta(bundle, trace.id, "availability") : [];
  const steps = trace ? traceMeta(bundle, trace.id, "out_of_engine") : [];
  const open = bundle.questions.filter((q) => q.status !== "resuelta");
  const qRules = (qid: string) =>
    bundle.questionRules.filter((x) => x.question_id === qid).map((x) => bundle.rules.find((r) => r.id === x.rule_id)?.code).filter(Boolean).join(", ");

  const RuleRow = ({ r }: { r: any }) => (
    <details className="rounded-md border border-border px-3 py-2 text-sm">
      <summary className="cursor-pointer">
        <span className="font-mono text-xs font-semibold">{r.code}</span> · {r.block} — {r.segment}
        <Badge variant="outline" className="ml-2 text-[10px]">{labelOf(RULE_STATUSES, r.definition_status)}</Badge>
      </summary>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p className="italic">{r.original_text}</p>
        <p><b>Condición:</b> {r.variable} {r.operator} {r.threshold} → {r.action_result}</p>
        <p><b>Fuente lógica:</b> {r.data_source} · <b>Excepciones:</b> {r.exceptions}</p>
        <p>{r.effect}</p>
      </div>
    </details>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-md border border-brand/40 bg-brand/5 p-3 text-xs">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-brand" />
        <span><b>{BLUEPRINT_LEGEND}</b> Borrador basado en el Manual Santa Fe V5 (17/09/2026) y el Anexo A v0.2. Ninguna regla está confirmada.</span>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Resultado por línea (campos propuestos, sin valores)</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bundle.lines.map((l) => (
            <Card key={l.id}>
              <CardHeader className="pb-2">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-brand">{l.code}</div>
                <CardTitle className="text-sm leading-tight">{l.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                {RESULT_FIELDS.map((f) => (
                  <div key={f} className="flex justify-between gap-2 border-b border-border/60 py-0.5">
                    <span className="text-muted-foreground">{f}</span>
                    <span>{f === "elegibilidad" ? "NO_EVALUABLE" : "—"}</span>
                  </div>
                ))}
                <p className="pt-1 text-[10px] text-muted-foreground">Origen de cupo por línea: por confirmar.</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Resultados no acumulables automáticamente. Un cupo mensual no es un capital máximo.</p>
      </div>

      {trace ? (
        <TraceStudio bundle={bundle} editable={editable} initialLineId={null} />
      ) : (
        <p className="text-sm text-muted-foreground">No hay traza conjunta cargada.</p>
      )}

      <Tabs defaultValue="reglas">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="reglas">Reglas del motor ({engine.length})</TabsTrigger>
          <TabsTrigger value="fuera">Fuera del motor ({outside.length})</TabsTrigger>
          <TabsTrigger value="fuentes">Fuentes ({avail.length})</TabsTrigger>
          <TabsTrigger value="dudas">Definiciones para validar ({open.length})</TabsTrigger>
          <TabsTrigger value="its">Asignación de línea</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value="reglas" className="mt-3 space-y-2">
          {engine.map((r) => <RuleRow key={r.id} r={r} />)}
        </TabsContent>

        <TabsContent value="fuera" className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Soporte operativo: el motor no ejecuta estos pasos ni los usa como rechazos automáticos.</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">{steps.map((s: string) => <li key={s}>{s}</li>)}</ul>
          {outside.map((r) => <RuleRow key={r.id} r={r} />)}
        </TabsContent>

        <TabsContent value="fuentes" className="mt-3">
          <div className="grid gap-3 md:grid-cols-3">
            {CATS.map((c) => (
              <div key={c} className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c}</div>
                {avail.filter((a: any) => a.categoria === c).map((a: any) => (
                  <div key={a.codigo} className="rounded-md border border-border p-3 text-xs">
                    <div className="font-semibold">{a.fuente}</div>
                    <p className="mt-1 text-muted-foreground">{a.detalle}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Ninguna fuente figura como «conectada a SIISA».</p>
        </TabsContent>

        <TabsContent value="dudas" className="mt-3 space-y-2">
          {open.map((q) => (
            <details key={q.id} className="rounded-md border border-border px-3 py-2 text-sm">
              <summary className="cursor-pointer"><span className="font-mono text-xs font-semibold">{q.code}</span> <span className="text-xs text-muted-foreground">· {qRules(q.id)}</span></summary>
              <p className="mt-2 text-xs text-muted-foreground">{q.question}</p>
              <p className="mt-1 text-[11px]">Respuesta: PENDIENTE</p>
            </details>
          ))}
        </TabsContent>

        <TabsContent value="its" className="mt-3">
          <div className="flex gap-2 rounded-md border border-border p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" />
            <div className="space-y-1">
              <p><b>Ficha informativa (no es criterio de aprobación).</b> En la plataforma Red Unisol, al finalizar/firmar, la línea ITS se infiere del nombre (CAJA/MUCI) y del empleador: 1000 = normal, 1003 = sanatorio.</p>
              <p className="text-xs text-muted-foreground">Esto no prueba que el motor de riesgo asigne líneas. Los criterios de elegibilidad por línea siguen pendientes (SF-D01).</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export" className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">{BLUEPRINT_LEGEND} Incluye las 4 alternativas, todas las reglas, dudas abiertas, la traza, fuentes, mitigación y lo que queda fuera del motor. Sin datos personales ni claves.</p>
          {trace && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => download("santa-fe-v5-blueprint.md", exportBlueprintMarkdown(bundle, trace.id), "text/markdown")}><Download className="size-4" />Markdown</Button>
              <Button size="sm" variant="outline" onClick={() => download("santa-fe-v5-blueprint.json", JSON.stringify(exportBlueprintJson(bundle, trace.id), null, 2), "application/json")}>JSON</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
