import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagPicker } from "@/components/tag-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-auth";
import {
  deleteAttachment,
  fetchCategories,
  fetchProcessById,
  fetchProcessTagIds,
  fetchTags,
  updateProcess,
} from "@/lib/kb";

export const Route = createFileRoute("/_authenticated/admin/proceso/$id")({
  head: () => ({
    meta: [
      { title: "Editar proceso — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Completar y publicar un proceso documentado de UNISOL.",
      },
      { property: "og:title", content: "Editar proceso — UNISOL" },
      {
        property: "og:description",
        content: "Edición de video, documento, etiquetas y resumen de un proceso interno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditProcessPage,
});

function EditProcessPage() {
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
            Tu cuenta no tiene permisos de administrador para editar material.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return <EditForm />;
}

function EditForm() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const tags = useQuery({ queryKey: ["tags"], queryFn: fetchTags });
  const process = useQuery({ queryKey: ["process", id], queryFn: () => fetchProcessById(id) });
  const processTags = useQuery({
    queryKey: ["process-tags", id],
    queryFn: () => fetchProcessTagIds(id),
  });

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [author, setAuthor] = useState("");
  const [duration, setDuration] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [doc, setDoc] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loaded, setLoaded] = useState(false);

  const data = process.data;

  useEffect(() => {
    if (!data || loaded) return;
    setTitle(data.title);
    setAuthor(data.author);
    setDuration(data.duration_label);
    setSourceUrl(data.video_source_url ?? "");
    setSummary(data.summary);
    setDoc(data.document_markdown ?? "");
    setLoaded(true);
  }, [data, loaded]);

  useEffect(() => {
    if (!data || !categories.data) return;
    const match = categories.data.find((c) => c.slug === data.category?.slug);
    if (match) setCategoryId((prev) => prev || match.id);
  }, [data, categories.data]);

  useEffect(() => {
    if (processTags.data) setTagIds((prev) => (prev.length ? prev : processTags.data));
  }, [processTags.data]);

  const save = useMutation({
    mutationFn: updateProcess,
    onSuccess: (_res, vars) => {
      toast.success(vars.status === "published" ? "Proceso publicado" : "Borrador guardado");
      qc.invalidateQueries({ queryKey: ["processes"] });
      qc.invalidateQueries({ queryKey: ["process", id] });
      setDocFile(null);
      setAttachments([]);
      if (vars.status === "published") navigate({ to: "/admin" });
    },
    onError: (e: Error) => toast.error("No se pudo guardar", { description: e.message }),
  });

  const removeAttachment = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      toast.success("Adjunto eliminado");
      qc.invalidateQueries({ queryKey: ["process", id] });
    },
    onError: (e: Error) => toast.error("No se pudo eliminar", { description: e.message }),
  });

  function toggleTag(tagId: string) {
    setTagIds((prev) => (prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]));
  }

  function submit(e: React.FormEvent, status: "draft" | "published") {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Falta el título del proceso.");
      return;
    }
    if (status === "published" && (!categoryId || !summary.trim())) {
      toast.error("Para publicar necesitás categoría y resumen.");
      return;
    }
    save.mutate({
      id,
      title: title.trim(),
      categoryId: categoryId || null,
      summary: summary.trim(),
      author: author.trim(),
      durationLabel: duration.trim(),
      tagIds,
      videoSourceUrl: sourceUrl.trim(),
      documentMarkdown: doc.trim(),
      status,

      documentFile: docFile,
      attachmentFiles: attachments,
    });
  }

  if (process.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Cargando proceso…
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <h1 className="text-xl font-semibold">Proceso no encontrado</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/admin">Volver al panel</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link to="/admin">
            <ArrowLeft className="size-4" />
            Volver al panel
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Completar proceso</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {data.status === "published" ? "Publicado" : "Borrador"} · última actualización guardada
          automáticamente al guardar.
        </p>

        <form onSubmit={(e) => submit(e, "published")} className="mt-8 space-y-6">
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
                  placeholder="Ej: Sector Ahorros y AMT"
                />
              </div>
              <TagPicker tags={tags.data ?? []} tagIds={tagIds} onToggle={toggleTag} />

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenido</CardTitle>
              <CardDescription>
                El video se reproduce desde Google Drive mediante un enlace embebido seguro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embed">
                  URL del video en Google Drive{" "}
                  {data.video_path ? "(hay un MP4 cargado que se sigue usando)" : ""}
                </Label>
                <Input
                  id="embed"
                  value={sourceUrl}
                  maxLength={2000}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                />
                <p className="text-xs text-muted-foreground">
                  Debe estar compartido como &quot;cualquiera con el enlace puede ver&quot;.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="docfile">
                  Documento (PDF o DOCX) {data.document_path ? "(ya cargado)" : "(falta)"}
                </Label>
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
                  rows={12}
                  maxLength={20000}
                  onChange={(e) => setDoc(e.target.value)}
                  placeholder={"## Objetivo\n\n## Pasos\n1. ..."}
                  className="font-mono text-xs"
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Archivos adjuntos</CardTitle>
              <CardDescription>Planillas, formularios o instructivos complementarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.attachments.length > 0 && (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {data.attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 p-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">{a.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${a.name}`}
                        onClick={() => removeAttachment.mutate({ id: a.id, path: a.path })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Input
                id="adjuntos"
                type="file"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={(e) => submit(e, "draft")}
            >
              Guardar borrador
            </Button>
            <Button type="submit" size="lg" disabled={save.isPending}>
              {save.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar y publicar
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
