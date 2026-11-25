import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { z } from "zod";
import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { fetchCelesolEntries } from "@/lib/celesol";

const entriesOptions = queryOptions({ queryKey: ["celesol-entries"], queryFn: fetchCelesolEntries });

export const Route = createFileRoute("/_authenticated/politicas/celesol")({
  validateSearch: z.object({ ficha: z.enum(["mapa", "sg", "reba"]).optional() }),
  loader: ({ context }) => context.queryClient.ensureQueryData(entriesOptions),
  head: () => ({ meta: [
    { title: "Mutual Celesol — funcionamiento institucional | UNISOL" },
    { name: "description", content: "Mapa de funcionamiento de Mutual Celesol, proveedores y fondeadores, en relevamiento." },
    { property: "og:title", content: "Mutual Celesol — funcionamiento institucional" },
    { property: "og:description", content: "Mapa, proveedores y fondeadores de Mutual Celesol (borrador)." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: () => <AppLayout><p className="p-8 text-muted-foreground">No hay contenido disponible.</p></AppLayout>,
  component: CelesolPage,
});

function CelesolPage() {
  const { data } = useSuspenseQuery(entriesOptions);
  const { ficha = "mapa" } = Route.useSearch();
  const visible = data.filter((e) => e.row);
  const current = visible.find((e) => e.key === ficha) ?? visible[0];
  const groups = ["Mapa", "Proveedores", "Fondeadores"] as const;
  return <AppLayout>
    <section className="border-b border-border bg-card px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/politicas" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Políticas</Link>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase text-brand"><Building2 className="size-4" /> Políticas · Mutual Celesol</div>
        <h1 className="mt-2 text-3xl font-bold">Mutual Celesol</h1>
        <p className="mt-2 text-sm text-muted-foreground">Documentación institucional. No es política vigente ni parte del motor de riesgo.</p>
        <Badge variant="outline" className="mt-3">En relevamiento / Borrador</Badge>
      </div>
    </section>
    {visible.length === 0 ? <p className="mx-auto max-w-5xl px-6 py-8 text-muted-foreground">No hay contenido disponible.</p> :
    <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
      <nav className="space-y-4">
        {groups.map((g) => { const items = visible.filter((e) => e.group === g); if (!items.length) return null; return <div key={g}>
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{g}</div>
          {items.map((e) => <Link key={e.key} to="/politicas/celesol" search={{ ficha: e.key }} className={`block rounded-md px-3 py-2 text-sm hover:bg-secondary ${current?.key === e.key ? "bg-secondary font-medium" : ""}`}>{e.row?.title}</Link>)}
        </div>; })}
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Referencias</div>
          <Link to="/politicas/$slug" params={{ slug: "politicas-de-posicionamiento" }} className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">Políticas de posicionamiento</Link>
        </div>
      </nav>
      {current?.row && <article>
        <div className="mb-4 flex flex-wrap items-center gap-2"><Badge variant="secondary">{current.group}</Badge><Badge variant="outline">En relevamiento / Borrador</Badge></div>
        <h2 className="mb-6 text-xl font-bold">{current.row.title}</h2>
        <div className="space-y-3 text-sm leading-relaxed [&_a]:text-brand [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"><ReactMarkdown>{current.row.content_markdown}</ReactMarkdown></div>
      </article>}
    </div>}
  </AppLayout>;
}
