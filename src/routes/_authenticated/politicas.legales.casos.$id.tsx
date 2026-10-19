import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Eye, FolderOpen, Pencil, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { CaseForm } from "@/components/legal/case-form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-auth";
import {
  FILE_KINDS, caseFileUrl, deleteCaseFile, fetchCaseFiles, fetchLegalCase, kindLabel, saveLegalCase,
  uploadCaseFile, type LegalCase, type LegalCaseFile,
} from "@/lib/legal";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/politicas/legales/casos/$id")({
  head: () => ({
    meta: [
      { title: "Carpeta de caso — Legales UNISOL" },
      { name: "description", content: "Datos y adjuntos de un caso de Defensa del Consumidor." },
      { property: "og:title", content: "Carpeta de caso — UNISOL" },
      { property: "og:description", content: "Datos y adjuntos de un caso de Defensa del Consumidor." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CasePage,
});

function CasePage() {
  const { id } = Route.useParams();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["legal-case", id], queryFn: () => fetchLegalCase(id), enabled: Boolean(isAdmin.data) });
  const [editing, setEditing] = useState(false);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Link to="/politicas/legales" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3" /> Legales
        </Link>
        {isAdmin.isLoading ? <Skeleton className="h-64" /> : !isAdmin.data ? (
          <p className="text-sm text-muted-foreground">No tenés permiso para ver los casos de Defensa del Consumidor.</p>
        ) : q.isLoading ? <Skeleton className="h-64" /> : q.error ? (
          <p className="text-sm text-destructive">No se pudo cargar el caso: {(q.error as Error).message}</p>
        ) : !q.data ? (
          <p className="text-sm text-muted-foreground">No se encontró el caso.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="size-6 text-brand" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{q.data.name}</h1>
                  <p className="text-xs text-muted-foreground">Carpeta creada {formatDate(q.data.created_at)} · actualizada {formatDate(q.data.updated_at)}</p>
                </div>
              </div>
              {!editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="size-4" /> Editar datos</Button>}
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              {editing ? (
                <CaseForm
                  initial={q.data}
                  onSubmit={async (v) => {
                    await saveLegalCase(v, id);
                    toast.success("Caso actualizado");
                    setEditing(false);
                    qc.invalidateQueries({ queryKey: ["legal-case", id] });
                    qc.invalidateQueries({ queryKey: ["legal-cases"] });
                  }}
                />
              ) : <CaseData c={q.data} />}
            </div>
            <Files caseId={id} />
          </>
        )}
      </div>
    </AppLayout>
  );
}

function CaseData({ c }: { c: LegalCase }) {
  const rows: [string, string][] = [
    ["Nº de expediente o reclamo", c.file_number],
    ["Entidad involucrada", c.entity],
    ["Socio", c.member_name],
    ["Identificación del socio", c.member_id],
    ["Remite", c.sender],
    ["Fecha de recepción", c.received_on ? formatDate(c.received_on) : ""],
    ["Responsable", c.manager],
    ["Tarea de Bitrix24", c.bitrix_ref],
    ["Plazos informados", c.deadlines],
    ["Observaciones", c.notes],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="whitespace-pre-wrap break-words">
            {v ? (/^https?:\/\//.test(v) ? <a href={v} target="_blank" rel="noreferrer" className="text-brand underline">{v}</a> : v) : <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Files({ caseId }: { caseId: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["legal-case-files", caseId], queryFn: () => fetchCaseFiles(caseId) });
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("requerimiento");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const refresh = () => qc.invalidateQueries({ queryKey: ["legal-case-files", caseId] });

  async function upload() {
    if (!files.length) return toast.error("Elegí al menos un archivo.");
    setBusy(true);
    let ok = 0;
    for (const f of files) {
      try {
        await uploadCaseFile(caseId, f, { title: files.length > 1 ? (title ? `${title} — ${f.name}` : f.name) : title, kind, notes });
        ok++;
      } catch (e) {
        toast.error(`No se pudo subir «${f.name}»: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (ok) toast.success(`${ok} archivo(s) agregado(s)`);
    setFiles([]); setTitle(""); setNotes(""); setInputKey((k) => k + 1);
    refresh();
  }

  async function open(f: LegalCaseFile, download: boolean) {
    try {
      window.open(await caseFileUrl(f, download), "_blank", "noopener");
    } catch (e) {
      toast.error(`No se pudo abrir el archivo: ${(e as Error).message}`);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Adjuntos del caso</h2>
      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Archivos (podés elegir varios)</Label>
          <Input key={inputKey} type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Si queda vacío se usa el nombre del archivo" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FILE_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Observaciones</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Button size="sm" onClick={upload} disabled={busy}><Upload className="size-4" /> {busy ? "Subiendo…" : "Agregar a la carpeta"}</Button>
        </div>
      </div>

      {q.isLoading ? <Skeleton className="h-24" /> : q.error ? (
        <p className="text-sm text-destructive">No se pudieron cargar los adjuntos.</p>
      ) : !q.data?.length ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Esta carpeta todavía no tiene adjuntos.</p>
      ) : (
        FILE_KINDS.filter((k) => q.data!.some((f) => f.kind === k.value)).map((k) => (
          <div key={k.value} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</h3>
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {q.data!.filter((f) => f.kind === k.value).map((f) => (
                <div key={f.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{f.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.original_name} · {(f.size_bytes / 1024).toFixed(0)} KB · {formatDate(f.created_at)} <Badge variant="outline" className="ml-1 text-[10px]">{kindLabel(f.kind)}</Badge>
                    </div>
                    {f.notes && <p className="mt-1 whitespace-pre-wrap text-xs">{f.notes}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => open(f, false)}><Eye className="size-4" /> Ver</Button>
                  <Button size="sm" variant="ghost" onClick={() => open(f, true)}><Download className="size-4" /> Descargar</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Quitar «{f.title}»?</AlertDialogTitle>
                        <AlertDialogDescription>El archivo se borra de la carpeta y no se puede recuperar.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try { await deleteCaseFile(f); toast.success("Archivo quitado"); refresh(); }
                            catch (e) { toast.error(`No se pudo quitar: ${(e as Error).message}`); }
                          }}
                        >Quitar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
