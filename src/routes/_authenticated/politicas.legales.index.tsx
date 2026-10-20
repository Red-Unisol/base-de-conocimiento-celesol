import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, FolderOpen, Gavel, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { CaseForm } from "@/components/legal/case-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-auth";
import { fetchLegalCases, fetchLegalDocument, saveLegalCase, updateLegalDocument } from "@/lib/legal";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/politicas/legales/")({
  head: () => ({
    meta: [
      { title: "Legales — Políticas UNISOL" },
      { name: "description", content: "Procedimiento de atención a Defensa del Consumidor y carpetas de casos." },
      { property: "og:title", content: "Legales — UNISOL" },
      { property: "og:description", content: "Procedimiento de Defensa del Consumidor y carpetas de casos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalesPage,
});

function LegalesPage() {
  const isAdmin = useIsAdmin();
  return (
    <AppLayout>
      <section className="border-b border-border bg-card px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Link to="/politicas" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Políticas
          </Link>
          <span className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <Gavel className="size-3.5" /> Políticas · Legales
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Legales</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Procedimientos escritos y carpetas internas de casos. No envía correos ni crea tareas externas.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8">
        <Procedure editable={Boolean(isAdmin.data)} />
        {isAdmin.data ? (
          <Cases />
        ) : (
          <p className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
            Los casos de Defensa del Consumidor sólo están disponibles para administradores.
          </p>
        )}
      </div>
    </AppLayout>
  );
}

function Procedure({ editable }: { editable: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["legal-doc", "defensa-consumidor"], queryFn: () => fetchLegalDocument("defensa-consumidor") });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const save = useMutation({
    mutationFn: () => updateLegalDocument(q.data!.id, draft),
    onSuccess: () => {
      toast.success("Procedimiento guardado");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["legal-doc"] });
    },
    onError: (e) => toast.error(`No se pudo guardar: ${(e as Error).message}`),
  });

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (q.error || !q.data) return <p className="text-sm text-destructive">No se pudo cargar el procedimiento.</p>;
  const d = q.data;

  return (
    <article className="rounded-lg border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="size-3.5" /> Procedimiento de trabajo
          </div>
          <h2 className="mt-1 text-xl font-bold">{d.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Definido por {d.defined_by}{d.defined_on ? ` el ${formatDate(d.defined_on)}` : ""} · Registrado en {d.source_ref} · Última edición {formatDate(d.updated_at)}
          </p>
        </div>
        {editable && !editing && (
          <Button size="sm" variant="outline" onClick={() => { setDraft(d.body); setEditing(true); }}>
            <Pencil className="size-4" /> Editar
          </Button>
        )}
      </header>
      <div className="p-6">
        {editing ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Cada paso empieza con «## ». Los párrafos se separan con una línea vacía.</p>
            <Textarea rows={22} value={draft} onChange={(e) => setDraft(e.target.value)} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl space-y-4 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:border-l-4 [&_h2]:border-brand [&_h2]:pl-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0">
            <ReactMarkdown>{d.body}</ReactMarkdown>
          </div>
        )}
      </div>
    </article>
  );
}

function Cases() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["legal-cases"], queryFn: fetchLegalCases });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((c) =>
      !s || [c.name, c.file_number, c.entity, c.member_name, c.member_id, c.sender, c.manager, c.bitrix_ref]
        .some((v) => v.toLowerCase().includes(s)),
    );
  }, [q.data, search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Casos de Defensa del Consumidor</h2>
          <p className="text-xs text-muted-foreground">Cada caso es una carpeta con sus datos y adjuntos. Complementa la tarea de Bitrix24, no la reemplaza.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> Nuevo caso</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por caso, expediente, socio, entidad, remitente o Bitrix24" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {q.isLoading ? (
        <Skeleton className="h-32" />
      ) : q.error ? (
        <p className="text-sm text-destructive">No se pudieron cargar los casos: {(q.error as Error).message}</p>
      ) : list.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {q.data?.length ? "Ningún caso coincide con la búsqueda." : "Todavía no hay casos cargados."}
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {list.map((c) => (
            <Link key={c.id} to="/politicas/legales/casos/$id" params={{ id: c.id }} className="flex items-center gap-3 p-4 hover:bg-secondary">
              <FolderOpen className="size-5 shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {[c.file_number && `Exp. ${c.file_number}`, c.member_name, c.entity, c.sender].filter(Boolean).join(" · ") || "Sin datos adicionales"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{c.received_on ? `Recibido ${formatDate(c.received_on)}` : ""}</div>
            </Link>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Nuevo caso</DialogTitle></DialogHeader>
          <CaseForm
            onSubmit={async (v) => {
              const id = await saveLegalCase(v);
              toast.success("Caso creado");
              navigate({ to: "/politicas/legales/casos/$id", params: { id } });
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
