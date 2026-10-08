import { Link } from "@tanstack/react-router";
import { ArrowDown, FileScan, GitFork, IdCard, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { PolicySummary } from "@/lib/policies";
import { cn } from "@/lib/utils";

/**
 * Traza general (diseño): nodos comunes antes de cada política.
 * No lee recibos ni deriva solicitudes reales.
 */
type FlowNode = {
  id: string;
  type: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  receives: string[];
  generates: string[];
  note?: string;
};

const NODES: FlowNode[] = [
  {
    id: "ingreso",
    type: "Inicio",
    icon: IdCard,
    title: "Ingreso de datos",
    desc: "Datos clave cargados al iniciar la solicitud.",
    receives: [],
    generates: ["Nro de documento", "Nombre"],
  },
  {
    id: "ocr",
    type: "Parser",
    icon: FileScan,
    title: "Lectura del recibo (OCR)",
    desc: "Extrae la información del recibo de sueldo o haber.",
    receives: ["Nro de documento", "Imagen o PDF del recibo"],
    generates: ["Empleador / organismo", "Situación de revista", "Haber bruto", "Descuentos de ley", "Descuentos voluntarios", "Haber neto", "Período del recibo"],
    note: "Campos propuestos a partir de las reglas relevadas; falta confirmar la lista definitiva.",
  },
  {
    id: "derivacion",
    type: "Decisión",
    icon: GitFork,
    title: "Derivación al convenio",
    desc: "Según empleador y datos del recibo, dirige la solicitud a la política que corresponde.",
    receives: ["Empleador / organismo", "Situación de revista"],
    generates: ["Política / convenio destino"],
    note: "Criterio de derivación pendiente de definir.",
  },
];

function NodeBox({ n, onOpen, pending }: { n: FlowNode; onOpen: () => void; pending?: boolean }) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "w-full max-w-sm rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40",
        pending ? "border-dashed border-muted-foreground/50" : "border-brand",
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{n.type}</div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <n.icon className="size-4 text-brand" /> {n.title}
      </div>
      {n.receives.length > 0 && <div className="mt-1 truncate text-[11px] text-muted-foreground">Recibe: {n.receives.join(", ")}</div>}
      <div className="truncate text-[11px] text-muted-foreground">Genera: {n.generates.join(", ")}</div>
      {pending && <div className="mt-1 text-[11px] text-destructive">Pendiente de definir</div>}
    </button>
  );
}

export function GeneralFlow({ policies }: { policies: PolicySummary[] }) {
  const [open, setOpen] = useState<FlowNode | null>(null);
  const targets = policies.filter((p) => !p.parent_policy_id);

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Traza general</h2>
        <p className="text-xs text-muted-foreground">Tocá un nodo para ver qué contiene. Es diseño: no procesa solicitudes reales.</p>
      </div>

      <div className="flex flex-col items-center">
        {NODES.map((n, i) => (
          <div key={n.id} className="flex w-full flex-col items-center">
            {i > 0 && <ArrowDown className="my-1.5 size-4 text-brand" />}
            <NodeBox n={n} onOpen={() => setOpen(n)} pending={n.id === "derivacion"} />
          </div>
        ))}

        {/* Ramas hacia cada política */}
        <div className="mt-1 h-5 border-l-2 border-dashed border-muted-foreground/50" />
        <div className="w-full border-t-2 border-dashed border-muted-foreground/50" />
        <div className="grid w-full grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4 lg:grid-cols-6">
          {targets.map((p) => (
            <div key={p.id} className="flex flex-col items-center">
              <div className="h-4 border-l-2 border-dashed border-muted-foreground/50" />
              <ArrowDown className="-mt-1 size-3 text-muted-foreground" />
              <Link
                to="/politicas/$slug"
                params={{ slug: p.slug }}
                className="w-full rounded-lg border border-border px-2 py-2 text-center text-xs hover:border-brand"
              >
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Llamador</div>
                <div className="font-semibold">{p.name}</div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4 text-sm">
                <div><Badge variant="outline">Nodo {open.type}</Badge></div>
                <p className="text-muted-foreground">{open.desc}</p>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recibe</div>
                  {open.receives.length ? (
                    <ul className="mt-1 space-y-1">{open.receives.map((f) => <li key={f}>• {f}</li>)}</ul>
                  ) : <p className="mt-1 text-xs text-muted-foreground">Es el primer nodo: no recibe datos de otro nodo.</p>}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Genera</div>
                  <ul className="mt-1 space-y-1">{open.generates.map((f) => <li key={f}>• {f}</li>)}</ul>
                </div>
                {open.id === "derivacion" && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deriva a</div>
                    <ul className="mt-1 space-y-1">{targets.map((p) => <li key={p.id}>• {p.name} — criterio pendiente</li>)}</ul>
                  </div>
                )}
                {open.note && <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">{open.note}</p>}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
