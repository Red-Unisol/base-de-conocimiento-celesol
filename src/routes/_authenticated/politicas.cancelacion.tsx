import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AppLayout } from "@/components/app-layout";
import { fetchLegalDocument } from "@/lib/legal";

const documentOptions = queryOptions({
  queryKey: ["legal-doc", "cancelaciones-anticipadas-totales-mutual-celesol"],
  queryFn: () => fetchLegalDocument("cancelaciones-anticipadas-totales-mutual-celesol"),
});

export const Route = createFileRoute("/_authenticated/politicas/cancelacion")({
  loader: ({ context }) => context.queryClient.ensureQueryData(documentOptions),
  head: () => ({ meta: [
    { title: "Políticas de cancelación — UNISOL" },
    { name: "description", content: "Instructivo documental de cancelaciones anticipadas totales de préstamos de Mutual Celesol." },
    { property: "og:title", content: "Políticas de cancelación — UNISOL" },
    { property: "og:description", content: "Texto fuente de CANCELACIONES.pdf y formulario de cancelación total." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CancellationPage,
});

function CancellationPage() {
  const { data: document } = useSuspenseQuery(documentOptions);
  return <AppLayout>
    <section className="border-b border-border bg-card px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/politicas" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Políticas</Link>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase text-brand"><FileText className="size-4" /> Políticas · Cancelación</div>
        <h1 className="mt-2 text-3xl font-bold">Políticas de cancelación</h1>
      </div>
    </section>
    <article className="mx-auto max-w-5xl px-6 py-8">
      {document ? <>
        <h2 className="mb-6 text-xl font-bold">{document.title}</h2>
        <div className="space-y-4 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-secondary [&_pre]:p-4 [&_pre]:text-sm [&_pre_code]:font-sans"><ReactMarkdown>{document.body}</ReactMarkdown></div>
      </> : <p className="text-muted-foreground">No hay contenido de cancelación disponible.</p>}
    </article>
  </AppLayout>;
}