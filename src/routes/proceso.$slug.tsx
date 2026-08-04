import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Download, FileText, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { categoryName, getProcess } from "@/data/knowledge";

export const Route = createFileRoute("/proceso/$slug")({
  loader: ({ params }) => {
    const process = getProcess(params.slug);
    if (!process) throw notFound();
    return process;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Proceso no disponible — UNISOL" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.title} — Base de Conocimiento UNISOL`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.summary },
      ],
    };
  },
  component: ProcessDetail,
});

function ProcessDetail() {
  const process = Route.useLoaderData();

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/categoria/$slug" params={{ slug: process.category }}>
            <ArrowLeft className="size-4" />
            {categoryName(process.category)}
          </Link>
        </Button>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{process.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{process.summary}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-institutional">
              <div className="aspect-video w-full bg-secondary">
                <iframe
                  src={process.videoEmbedUrl}
                  title={`Video Trupeer: ${process.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen"
                  allowFullScreen
                  className="size-full"
                />
              </div>
            </div>

            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="size-4" />
                Documento paso a paso
              </h2>
              <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-brand">
                <ReactMarkdown>{process.document}</ReactMarkdown>
              </div>
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
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span>{process.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    {process.duration} · actualizado el{" "}
                    {new Date(process.updatedAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {process.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
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
                {process.attachments.map((file: { name: string; size: string; type: string }) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 rounded-md border border-border p-2.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-secondary text-[10px] font-bold text-brand">
                      {file.type}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{file.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{file.size}</span>
                    </span>
                    <Button variant="ghost" size="icon" aria-label={`Descargar ${file.name}`}>
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
