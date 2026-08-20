import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TagPicker } from "@/components/tag-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-auth";
import {
  createDraftFromVideo,
  createProcess,
  deleteProcess,
  fetchCategories,
  fetchProcesses,
  fetchTags,

  isComplete,
  missingPieces,
} from "@/lib/kb";

const TARGET = 55;

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Cargar material — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Formulario interno para publicar nuevos videos y guías de procesos de UNISOL.",
      },
      { property: "og:title", content: "Cargar material — UNISOL" },
      {
        property: "og:description",
        content: "Alta de procesos documentados con video propio y guía paso a paso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const isAdmin = useIsAdmin();

  if (isAdmin.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Verificando permisos…
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin.data) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <AlertCircle className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Sección restringida</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta no tiene permisos de administrador para cargar material. Pedile a un
            administrador que te asigne el rol.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Cargar material</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Alta de procesos documentados y control de la migración desde Trupeer.
        </p>

        <Tabs defaultValue="individual" className="mt-8">
          <TabsList>
            <TabsTrigger value="individual">Carga individual</TabsTrigger>
            <TabsTrigger value="masiva">Carga masiva</TabsTrigger>
            <TabsTrigger value="panel">Panel de migración</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="mt-6">
            <SingleUpload />
          </TabsContent>
          <TabsContent value="masiva" className="mt-6">
            <BulkUpload />
          </TabsContent>
          <TabsContent value="panel" className="mt-6">
            <MigrationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function SingleUpload() {
  const qc = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const tags = useQuery({ queryKey: ["tags"], queryFn: fetchTags });

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [author, setAuthor] = useState("");
  const [duration, setDuration] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [doc, setDoc] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: createProcess,
    onSuccess: () => {
      toast.success("Proceso publicado", { description: "Ya está disponible en el catálogo." });
      qc.invalidateQueries({ queryKey: ["processes"] });
      setTitle("");
      setCategoryId("");
      setTagIds([]);
      setAuthor("");
      setDuration("");
      setSourceUrl("");
      setSummary("");
      setDoc("");
      setVideoFile(null);
      setDocFile(null);
      setAttachments([]);
    },
    onError: (e: Error) => toast.error("No se pudo publicar", { description: e.message }),
  });

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  function onSubmit(e: React.FormEvent, status: "draft" | "published") {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Falta el título del proceso.");
      return;
    }
    if (status === "published" && (!categoryId || !summary.trim())) {
      toast.error("Para publicar necesitás categoría y resumen.");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      categoryId: categoryId || null,
      summary: summary.trim(),
      author: author.trim(),
      durationLabel: duration.trim(),
      tagIds,
      videoSourceUrl: sourceUrl.trim(),
      documentMarkdown: doc.trim(),
      status,
      videoFile,
      documentFile: docFile,
      attachmentFiles: attachments,
    });
  }

  return (
    <form onSubmit={(e) => onSubmit(e, "published")} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
          <CardDescription>Cómo se va a encontrar este proceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título del proceso</Label>
            <Input
              id="titulo"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Conciliación bancaria mensual"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracion">Duración del video</Label>
              <Input
                id="duracion"
                value={duration}
                maxLength={20}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ej: 6:42"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="autor">Responsable / autor</Label>
            <Input
              id="autor"
              value={author}
              maxLength={80}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ej: Sector Contabilidad"
            />
          </div>
          <TagPicker tags={tags.data ?? []} tagIds={tagIds} onToggle={toggleTag} />

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contenido</CardTitle>
          <CardDescription>
            El MP4 propio es la fuente principal de reproducción; el enlace de Trupeer queda como
            referencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video">Video MP4</Label>
            <Input
              id="video"
              type="file"
              accept="video/mp4,video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="embed">URL original de Trupeer (opcional)</Label>
            <Input
              id="embed"
              value={sourceUrl}
              maxLength={2000}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.trupeer.ai/embed/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docfile">Documento (PDF o DOCX)</Label>
            <Input
              id="docfile"
              type="file"
              accept=".pdf,.doc,.docx,.md,.txt"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc">Documento explicativo (Markdown)</Label>
            <Textarea
              id="doc"
              value={doc}
              rows={10}
              maxLength={20000}
              onChange={(e) => setDoc(e.target.value)}
              placeholder={"## Objetivo\n\n## Pasos\n1. ..."}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjuntos">Archivos adjuntos</Label>
            <Input
              id="adjuntos"
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resumen">Resumen breve para el buscador</Label>
            <Textarea
              id="resumen"
              value={summary}
              rows={3}
              maxLength={400}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Dos o tres líneas que describan el circuito."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={(e) => onSubmit(e, "draft")}
        >
          Guardar borrador
        </Button>
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Publicar proceso
        </Button>
      </div>
    </form>
  );
}

function BulkUpload() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [categoryId, setCategoryId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function run() {
    if (!files.length) return;
    setRunning(true);
    setDone(0);
    setErrors([]);
    for (const file of files) {
      try {
        await createDraftFromVideo(file, categoryId || null);
      } catch (e) {
        setErrors((prev) => [...prev, `${file.name}: ${(e as Error).message}`]);
      }
      setDone((d) => d + 1);
    }
    setRunning(false);
    qc.invalidateQueries({ queryKey: ["processes"] });
    toast.success("Carga masiva finalizada", {
      description: "Los videos quedaron como borradores para completar.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Carga masiva (modo migración)</CardTitle>
        <CardDescription>
          Elegí la categoría del sector y seleccioná varios MP4 de una vez. Cada archivo queda como
          borrador con el título tomado del nombre del archivo; después completás documento,
          resumen y etiquetas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cat-masiva">Categoría de la tanda</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="cat-masiva" className="sm:w-72">
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {(categories.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          ref={inputRef}
          type="file"
          multiple
          accept="video/mp4,video/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        {files.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {files.length} archivo(s) seleccionado(s).
          </p>
        )}
        {running && (
          <div className="space-y-2">
            <Progress value={(done / Math.max(files.length, 1)) * 100} />
            <p className="text-xs text-muted-foreground">
              Subiendo {done} de {files.length}…
            </p>
          </div>
        )}
        {errors.length > 0 && (
          <ul className="space-y-1 text-xs text-destructive">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <Button onClick={run} disabled={running || files.length === 0}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Subir {files.length || ""} video(s)
        </Button>
      </CardContent>
    </Card>
  );
}


function MigrationPanel() {
  const qc = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const processes = useQuery({
    queryKey: ["processes", "all"],
    queryFn: () => fetchProcesses({ includeDrafts: true }),
  });
  const [categorySlug, setCategorySlug] = useState("todas");
  const [status, setStatus] = useState("todos");

  const all = processes.data ?? [];
  const list = all.filter((p) => {
    if (categorySlug !== "todas" && p.category?.slug !== categorySlug) return false;
    if (status === "completos") return isComplete(p);
    if (status === "pendientes") return !isComplete(p);
    if (status === "published" || status === "draft") return p.status === status;
    return true;
  });
  const complete = all.filter(isComplete).length;

  const remove = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => {
      toast.success("Proceso eliminado");
      qc.invalidateQueries({ queryKey: ["processes"] });
    },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });

  function exportCsv() {
    const rows = [
      ["titulo", "categoria", "estado", "video", "documento", "actualizado"],
      ...list.map((p) => [
        p.title,
        p.category?.name ?? "",
        p.status,
        p.video_path ? "sí" : "no",
        p.document_path || p.document_markdown ? "sí" : "no",
        p.updated_at,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventario-procesos-unisol.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Panel de migración</CardTitle>
        <CardDescription>
          {complete} de {TARGET} procesos migrados por completo · {all.length} cargados en total.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(complete / TARGET) * 100} />

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="filtro-cat">Categoría</Label>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger id="filtro-cat" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {(categories.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filtro-estado">Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="filtro-estado" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendientes">Incompletos</SelectItem>
                <SelectItem value="completos">Completos</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={list.length === 0}>
            Exportar inventario (CSV)
          </Button>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {all.length === 0
              ? "Todavía no hay procesos cargados."
              : "Ningún proceso coincide con los filtros."}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {list.map((p) => {
              const missing = missingPieces(p);
              return (
                <li key={p.id} className="flex items-center gap-3 p-3">
                  {missing.length === 0 ? (
                    <CheckCircle2 className="size-4 shrink-0 text-brand" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/proceso/$slug"
                      params={{ slug: p.slug }}
                      className="block truncate text-sm font-medium hover:text-brand"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.category?.name ? `${p.category.name} · ` : ""}
                      {p.status === "published" ? "Publicado" : "Borrador"}
                      {missing.length > 0 ? ` · falta: ${missing.join(", ")}` : " · completo"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/proceso/$id" params={{ id: p.id }}>
                      <Pencil className="size-3.5" />
                      Completar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${p.title}`}
                    onClick={() => remove.mutate(p.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

    </Card>
  );
}
