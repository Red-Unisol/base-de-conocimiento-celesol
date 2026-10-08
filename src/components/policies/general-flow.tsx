import { ArrowDown, FileScan, GitFork, IdCard } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import type { PolicySummary } from "@/lib/policies";

/**
 * Esquema general por etapas, previo a cada política.
 * Es diseño: no lee recibos ni deriva solicitudes reales.
 */
const STAGES = [
  {
    n: 1,
    icon: IdCard,
    title: "Datos clave del solicitante",
    desc: "Se cargan al iniciar la solicitud.",
    fields: ["Nro de documento", "Nombre"],
    note: "",
  },
  {
    n: 2,
    icon: FileScan,
    title: "Datos del recibo (lectura OCR)",
    desc: "Información que se extraerá del recibo de sueldo o haber.",
    fields: ["Empleador / organismo", "Situación de revista", "Haber bruto", "Descuentos de ley", "Descuentos voluntarios", "Haber neto", "Período del recibo"],
    note: "Campos propuestos a partir de las reglas relevadas; confirmar la lista definitiva.",
  },
];

export function GeneralFlow({ policies }: { policies: PolicySummary[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Esquema general por etapas</h2>
        <p className="text-xs text-muted-foreground">Diseño de las etapas comunes antes de evaluar cada política. No procesa solicitudes reales.</p>
      </div>
      <div className="flex flex-col items-center">
        {STAGES.map((s) => (
          <div key={s.n} className="flex w-full flex-col items-center">
            <div className="w-full max-w-2xl rounded-lg border border-brand p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <s.icon className="size-4 text-brand" /> Etapa {s.n} · {s.title}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.fields.map((f) => <Badge key={f} variant="outline" className="font-normal">{f}</Badge>)}
              </div>
              {s.note && <p className="mt-2 text-[11px] text-muted-foreground">{s.note}</p>}
            </div>
            <ArrowDown className="my-1.5 size-4 text-brand" />
          </div>
        ))}
        <div className="w-full max-w-2xl rounded-lg border border-dashed border-muted-foreground/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GitFork className="size-4 text-brand" /> Etapa 3 · Derivación al convenio / política
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Según empleador y datos del recibo, la solicitud se dirige a la política que corresponde. Criterio de derivación: pendiente de definir.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {policies.filter((p) => !p.parent_policy_id).map((p) => (
              <Link key={p.id} to="/politicas/$slug" params={{ slug: p.slug }} className="rounded-md border border-border px-2 py-1.5 text-center text-xs hover:border-brand">
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
