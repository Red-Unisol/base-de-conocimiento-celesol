/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Database, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { PolicyWorkspace } from "@/components/policies/policy-workspace";
import { RecordDialog, type Field } from "@/components/policies/record-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  INTEGRATION_STATUSES,
  deleteRow,
  fetchPolicyBundle,
  fetchPolicySummaries,
  labelOf,
  logChange,
  saveRow,
  slugify,
} from "@/lib/policies";

export const Route = createFileRoute("/_authenticated/admin/politicas")({
  validateSearch: (s: Record<string, unknown>): { p?: string } => ({
    p: typeof s.p === "string" ? s.p : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Administrar políticas — UNISOL" },
      { name: "description", content: "Alta y edición de políticas, reglas, dudas y diseño SIISA." },
      { property: "og:title", content: "Administrar políticas — UNISOL" },
      { property: "og:description", content: "Gestión interna del módulo Políticas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPolicies,
});

function AdminPolicies() {
  const isAdmin = useIsAdmin();
  const { p } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/politicas" });
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["policies"], queryFn: fetchPolicySummaries, enabled: Boolean(isAdmin.data) });
  const selected = p ?? list.data?.[0]?.slug;
  const bundle = useQuery({
    queryKey: ["policy", selected],
    queryFn: () => fetchPolicyBundle(selected!),
    enabled: Boolean(selected && isAdmin.data),
  });
  const [creating, setCreating] = useState(false);

  if (isAdmin.isLoading) return <AppLayout><div className="p-6"><Skeleton className="h-40" /></div></AppLayout>;
  if (!isAdmin.data)
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg p-10 text-center text-sm text-muted-foreground">
          <AlertCircle className="mx-auto mb-2 size-6" /> Esta sección es solo para administradores.
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administrar políticas</h1>
            <p className="text-sm text-muted-foreground">Cargá documentos, reglas, dudas y el diseño SIISA de cada política.</p>
          </div>
          <div className="flex gap-2">
            <Select value={selected ?? ""} onValueChange={(v) => navigate({ search: { p: v } })}>
              <SelectTrigger className="w-60"><SelectValue placeholder="Elegí una política" /></SelectTrigger>
              <SelectContent>
                {(list.data ?? []).map((x) => <SelectItem key={x.slug} value={x.slug}>{x.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreating(true)}><Plus className="size-4" />Nueva política</Button>
          </div>
        </div>

        {bundle.isLoading ? (
          <Skeleton className="h-64" />
        ) : bundle.data ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{bundle.data.policy.name}</h2>
              <Link to="/politicas/$slug" params={{ slug: bundle.data.policy.slug }} className="text-xs text-brand hover:underline">
                Ver ficha pública
              </Link>
            </div>
            <PolicyWorkspace bundle={bundle.data} editable />
          </>
        ) : null}

        <IntegrationsCatalog />
      </div>

      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nueva política"
        fields={[{ name: "name", label: "Nombre", full: true }, { name: "code", label: "Código (opcional)" }]}
        initial={{}}
        onSubmit={async (v) => {
          if (!v.name?.trim()) {
            toast.error("El nombre es obligatorio");
            throw new Error("nombre");
          }
          try {
            const row = await saveRow("policies", {
              name: v.name.trim(),
              code: v.code ?? "",
              slug: slugify(v.name),
              sort_order: (list.data?.length ?? 0) + 1,
            });
            await logChange(row.id, "edicion", "Creó la política");
            await qc.invalidateQueries({ queryKey: ["policies"] });
            navigate({ search: { p: row.slug } });
          } catch (e: any) {
            toast.error(e?.message ?? "No se pudo crear");
            throw e;
          }
        }}
      />
    </AppLayout>
  );
}

const integrationFields: Field[] = [
  { name: "name", label: "Nombre" },
  { name: "code", label: "Código" },
  { name: "kind", label: "Tipo (ej. padrón, bureau, interno)" },
  { name: "status", label: "Estado", kind: "select", options: INTEGRATION_STATUSES },
  { name: "description", label: "Descripción", kind: "textarea" },
  { name: "notes", label: "Notas", kind: "textarea" },
];

function IntegrationsCatalog() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["policy-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("policy_integrations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const [edit, setEdit] = useState<any | null>(null);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["policy-integrations"] });
    void qc.invalidateQueries({ queryKey: ["policy"] });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><Database className="size-4" />Catálogo de orígenes de datos</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setEdit({ status: "no_definido" })}><Plus className="size-4" />Agregar</Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-xs text-muted-foreground">
          Solo descripción de los orígenes (por ejemplo, datos de Red Unisol Platform). No guarda direcciones, claves ni conexiones.
        </p>
        {(q.data ?? []).length === 0 && <p className="text-xs text-muted-foreground">Sin orígenes cargados.</p>}
        {(q.data ?? []).map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
            <div className="flex-1">
              <div className="font-medium">{i.name} {i.code && <span className="text-xs text-muted-foreground">· {i.code}</span>}</div>
              <div className="text-xs text-muted-foreground">{i.kind || "—"} · {labelOf(INTEGRATION_STATUSES, i.status)}</div>
            </div>
            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEdit(i)}><Pencil className="size-3.5" /></Button>
            <Button size="icon" variant="ghost" className="size-7" onClick={async () => {
              if (!confirm(`¿Eliminar «${i.name}»?`)) return;
              try { await deleteRow("policy_integrations", i.id); refresh(); } catch (e: any) { toast.error(e?.message); }
            }}><Trash2 className="size-3.5" /></Button>
          </div>
        ))}
      </CardContent>
      <RecordDialog
        open={Boolean(edit)}
        onOpenChange={(o) => !o && setEdit(null)}
        title={edit?.id ? "Editar origen de datos" : "Nuevo origen de datos"}
        fields={integrationFields}
        initial={edit ?? {}}
        onSubmit={async (v) => {
          if (!v.name?.trim()) { toast.error("El nombre es obligatorio"); throw new Error("nombre"); }
          const { name, code, kind, status, description, notes } = v;
          try {
            await saveRow("policy_integrations", { name, code: code ?? "", kind: kind ?? "", status: status ?? "no_definido", description: description ?? "", notes: notes ?? "" }, edit?.id);
            toast.success("Guardado");
            refresh();
          } catch (e: any) { toast.error(e?.message); throw e; }
        }}
      />
    </Card>
  );
}
