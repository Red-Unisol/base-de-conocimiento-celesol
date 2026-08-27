import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Download, FileText, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ATTACHMENT_BUCKET,
  DOC_BUCKET,
  VIDEO_BUCKET,
  fetchProcess,
  signedUrl,
} from "@/lib/kb";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/proceso/$slug")({
  head: ({ params }) => {
    const title = `Proceso ${params.slug} — Base de Conocimiento UNISOL`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Video y guía paso a paso del proceso documentado en UNISOL Unión Solidaria.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Documentación interna del proceso: video, guía y archivos adjuntos.",
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ProcessDetail,
});

function bytes(n: number) {
  if (!n) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function ProcessDetail() {
  const { slug } = Route.useParams();
  const query = useQuery({ queryKey: ["process", slug], queryFn: () => fetchProcess(slug) });
  const process = query.data ?? null;

  const video = useQuery({
    queryKey: ["signed", VIDEO_BUCKET, process?.video_path],
    enabled: Boolean(process?.video_path),
    queryFn: () => signedUrl(VIDEO_BUCKET, process!.video_path!),
  });

  const doc = useQuery({
    queryKey: ["signed", DOC_BUCKET, process?.document_path],
    enabled: Boolean(process?.document_path) && !process?.document_markdown,
    queryFn: () => signedUrl(DOC_BUCKET, process!.document_path!, 3600),
  });

  const driveUrl = driveEmbedUrl(process?.video_source_url);

  async function download(bucket: string, path: string, name: string) {
    const url = await signedUrl(bucket, path, 120);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noreferrer";
    a.click();
  }


  if (query.isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="aspect-video w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!process) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-xl font-semibold">Proceso no encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El proceso que buscás no existe o fue dado de baja.
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
      <div className="mx-auto max-w-6xl px-6 py-8">
        {process.category && (
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link to="/categoria/$slug" params={{ slug: process.category.slug }}>
              <ArrowLeft className="size-4" />
              {process.category.name}
            </Link>
          </Button>
        )}

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{process.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{process.summary}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-institutional">
              <div className="aspect-video w-full bg-secondary">
                {video.data ? (
                  <video
                    src={video.data}
                    controls
                    preload="metadata"
                    className="size-full"
                    title={`Video del proceso: ${process.title}`}
                  />
                ) : driveUrl ? (
                  <iframe
                    src={driveUrl}
                    title={`Video del proceso: ${process.title}`}
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="size-full"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                    Este proceso todavía no tiene video cargado.
                  </div>
                )}
              </div>
            </div>

            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="size-4" />
                Documento paso a paso
              </h2>
              {process.document_markdown ? (
                <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-brand">
                  <ReactMarkdown>{process.document_markdown}</ReactMarkdown>
                </div>
              ) : process.document_path ? (
                doc.data ? (
                  <iframe
                    src={doc.data}
                    title={`Documento del proceso: ${process.title}`}
                    className="mt-4 h-[70vh] w-full rounded-xl border border-border bg-card"
                  />
                ) : (
                  <Skeleton className="mt-4 h-[70vh] w-full" />
                )
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Todavía no se cargó la guía escrita de este proceso.
                </p>
              )}

            </section>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Ficha del proceso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {process.author && (
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span>{process.author}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    {process.duration_label ? `${process.duration_label} · ` : ""}actualizado el{" "}
                    {formatDate(process.updated_at)}
                  </span>
                </div>
                {process.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      {process.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Archivos adjuntos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {process.attachments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin archivos adjuntos.</p>
                )}
                {process.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-md border border-border p-2.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold text-brand">
                      {file.file_type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{file.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {bytes(file.size_bytes)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Descargar ${file.name}`}
                      onClick={() => download(ATTACHMENT_BUCKET, file.path, file.name)}
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
