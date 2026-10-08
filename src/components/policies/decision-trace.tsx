import { ArrowDown, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type TraceRuleResult = "pasó" | "no pasó" | "no evaluada";
export type TraceRule = {
  id: string;
  name: string;
  value: string;
  threshold: string;
  result: TraceRuleResult;
  source: string;
};
export type DecisionTraceData = {
  rules: TraceRule[];
  decision: "aprobado" | "rechazado" | "pendiente";
  reason: string;
  version: string;
  applicant?: { document: string; name: string };
};

/** Corta en la primera regla que no pasa: las siguientes se muestran como no evaluadas. */
export function normalizeTrace(rules: TraceRule[]): TraceRule[] {
  const cut = rules.findIndex((r) => r.result === "no pasó");
  return rules.map((r, i) => (cut >= 0 && i > cut ? { ...r, result: "no evaluada" } : r));
}

type Detail = { title: string; rows: [string, string][] } | null;

const box = "w-full max-w-sm rounded-lg border px-4 py-2.5 text-center text-sm";
const styles = {
  ok: "border-brand bg-brand/10",
  fail: "border-destructive bg-destructive/10",
  idle: "border-dashed border-muted-foreground/50 text-muted-foreground",
};

function Arrow({ kind }: { kind: "ok" | "idle" }) {
  return (
    <div className="flex h-7 items-center justify-center">
      <div className={cn("h-full border-l-2", kind === "ok" ? "border-brand" : "border-dashed border-muted-foreground/50")} />
      <ArrowDown className={cn("-ml-[9px] mt-5 size-4", kind === "ok" ? "text-brand" : "text-muted-foreground/60")} />
    </div>
  );
}

export function DecisionTrace({ data }: { data: DecisionTraceData }) {
  const [detail, setDetail] = useState<Detail>(null);
  const rules = normalizeTrace(data.rules);
  const failIdx = rules.findIndex((r) => r.result === "no pasó");
  const allPassed = rules.length > 0 && rules.every((r) => r.result === "pasó");
  const open = (r: TraceRule) =>
    setDetail({
      title: r.name,
      rows: [["Dato del solicitante", r.value || "—"], ["Umbral / condición", r.threshold || "—"], ["Resultado", r.result], ["Fuente", r.source || "—"], ["Versión de la política", data.version || "—"]],
    });

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col items-center">
        <button className={cn(box, styles.ok, "font-semibold")} onClick={() => setDetail({ title: "Solicitud recibida", rows: [["Nro de documento", data.applicant?.document || "—"], ["Nombre", data.applicant?.name || "—"], ["Versión de la política", data.version || "—"]] })}>
          <div>Solicitud recibida</div>
          <div className="mt-0.5 text-xs font-normal text-muted-foreground">
            Nro de documento: {data.applicant?.document || "—"} · Nombre: {data.applicant?.name || "—"}
          </div>
        </button>
        {rules.map((r, i) => {
          const st = r.result === "pasó" ? "ok" : r.result === "no pasó" ? "fail" : "idle";
          const arrowIn: "ok" | "idle" = i === 0 || rules[i - 1]?.result === "pasó" ? "ok" : "idle";
          return (
            <div key={r.id} className="flex w-full flex-col items-center">
              <Arrow kind={arrowIn} />
              <div className="relative flex w-full max-w-sm items-center justify-center">
                <button className={cn(box, styles[st])} onClick={() => open(r)}>
                  <div className="font-semibold">{r.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {st === "idle" ? "No evaluado" : `${r.value || "—"} · ${r.threshold || "—"}`}
                  </div>
                </button>
                {i === failIdx && (
                  <div className="absolute left-full ml-2 hidden items-center gap-2 sm:flex">
                    <div className="flex items-center text-destructive">
                      <div className="w-6 border-t-2 border-destructive" />
                      <ArrowRight className="-ml-2 size-4" />
                    </div>
                    <button
                      className={cn("w-44 rounded-lg border px-3 py-2 text-left text-sm", styles.fail)}
                      onClick={() => setDetail({ title: "Rechazado", rows: [["Motivo", data.reason || r.name], ["Regla", r.name], ["Versión", data.version || "—"]] })}
                    >
                      <div className="font-semibold text-destructive">Rechazado</div>
                      <div className="text-xs">{data.reason || r.name}</div>
                    </button>
                  </div>
                )}
              </div>
              {i === failIdx && (
                <div className={cn("mt-2 w-full max-w-sm rounded-lg border px-3 py-2 text-sm sm:hidden", styles.fail)}>
                  <b className="text-destructive">Rechazado</b> — {data.reason || r.name}
                </div>
              )}
            </div>
          );
        })}
        <Arrow kind={allPassed ? "ok" : "idle"} />
        <div className={cn(box, allPassed ? styles.ok : styles.idle, "font-semibold")}>Aprobado</div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-brand bg-brand/10" />Pasó</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-destructive bg-destructive/10" />Cortó la decisión</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border border-dashed border-muted-foreground/60" />No evaluado</span>
      </div>

      <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>{detail?.title}</SheetTitle></SheetHeader>
          <dl className="mt-4 space-y-3 text-sm">
            {detail?.rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </SheetContent>
      </Sheet>
    </div>
  );
}
