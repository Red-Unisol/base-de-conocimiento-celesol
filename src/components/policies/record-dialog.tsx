/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type Option = { value: string; label: string };
export type Field = {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "select" | "bool" | "date" | "number" | "multi";
  options?: Option[];
  full?: boolean;
  placeholder?: string;
};

const NONE = "__none__";

export function RecordDialog({
  open,
  onOpenChange,
  title,
  fields,
  initial,
  onSubmit,
  extra,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  fields: Field[];
  initial: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  extra?: ReactNode;
}) {
  const [values, setValues] = useState<Record<string, any>>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: string, v: any) => setValues((s) => ({ ...s, [k]: v }));

  async function submit() {
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const v = values[f.name];
            const kind = f.kind ?? "text";
            return (
              <div
                key={f.name}
                className={
                  f.full || kind === "textarea" || kind === "multi"
                    ? "space-y-1.5 sm:col-span-2"
                    : "space-y-1.5"
                }
              >
                {kind === "bool" ? (
                  <label className="flex items-center gap-2 pt-6 text-sm">
                    <Switch checked={Boolean(v)} onCheckedChange={(c) => set(f.name, c)} />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <Label className="text-xs">{f.label}</Label>
                    {kind === "textarea" && (
                      <Textarea
                        rows={3}
                        value={v ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    )}
                    {(kind === "text" || kind === "date" || kind === "number") && (
                      <Input
                        type={kind}
                        value={v ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) =>
                          set(f.name, kind === "number" ? Number(e.target.value) : e.target.value)
                        }
                      />
                    )}
                    {kind === "select" && (
                      <Select
                        value={v ? String(v) : NONE}
                        onValueChange={(nv) => set(f.name, nv === NONE ? null : nv)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>— Sin definir —</SelectItem>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {kind === "multi" && (
                      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                        {(f.options ?? []).length === 0 && (
                          <p className="text-xs text-muted-foreground">No hay opciones cargadas.</p>
                        )}
                        {(f.options ?? []).map((o) => {
                          const arr: string[] = v ?? [];
                          return (
                            <label key={o.value} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={arr.includes(o.value)}
                                onCheckedChange={(c) =>
                                  set(
                                    f.name,
                                    c ? [...arr, o.value] : arr.filter((x) => x !== o.value),
                                  )
                                }
                              />
                              {o.label}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {extra}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
