import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LegalCase, LegalCaseInput } from "@/lib/legal";

const FIELDS: { key: keyof LegalCaseInput; label: string; type?: "date" | "area" }[] = [
  { key: "name", label: "Nombre o identificación del caso *" },
  { key: "file_number", label: "Nº de expediente o reclamo" },
  { key: "entity", label: "Entidad involucrada" },
  { key: "member_name", label: "Nombre del socio" },
  { key: "member_id", label: "Identificación del socio" },
  { key: "sender", label: "Organismo o persona que remite" },
  { key: "received_on", label: "Fecha de recepción", type: "date" },
  { key: "manager", label: "Responsable de la gestión" },
  { key: "deadlines", label: "Plazos informados (tal como fueron comunicados)", type: "area" },
  { key: "bitrix_ref", label: "Tarea de Bitrix24 (número o enlace)" },
  { key: "notes", label: "Observaciones", type: "area" },
];

export function CaseForm({ initial, onSubmit }: { initial?: LegalCase; onSubmit: (v: LegalCaseInput) => Promise<void> }) {
  const [v, setV] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, String(initial?.[f.key as keyof LegalCase] ?? "")])),
  );
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!v.name.trim()) return toast.error("El nombre del caso es obligatorio.");
        setBusy(true);
        try {
          await onSubmit({ ...v, name: v.name.trim(), received_on: v.received_on || null } as LegalCaseInput);
        } catch (err) {
          toast.error(`No se pudo guardar: ${(err as Error).message}`);
        } finally {
          setBusy(false);
        }
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.key} className={f.type === "area" ? "space-y-1 sm:col-span-2" : "space-y-1"}>
          <Label htmlFor={`cf-${f.key}`} className="text-xs">{f.label}</Label>
          {f.type === "area" ? (
            <Textarea id={`cf-${f.key}`} rows={3} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
          ) : (
            <Input id={`cf-${f.key}`} type={f.type ?? "text"} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
          )}
        </div>
      ))}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar caso"}</Button>
      </div>
    </form>
  );
}
