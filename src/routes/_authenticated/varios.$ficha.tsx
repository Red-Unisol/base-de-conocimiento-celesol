import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Boxes } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { CelesolEntry, EMPTY } from "@/components/celesol-entry";
import { celesolEntriesOptions } from "@/lib/celesol";

export const Route = createFileRoute("/_authenticated/varios/$ficha")({
  loader: ({ context }) => context.queryClient.ensureQueryData(celesolEntriesOptions),
  head: () => ({ meta: [
    { title: "Ficha de referencia — Varios | UNISOL" },
    { name: "description", content: "Ficha de referencia de una contraparte, en relevamiento." },
    { property: "og:title", content: "Ficha de referencia — Varios" },
    { property: "og:description", content: "Ficha de contraparte en relevamiento / borrador." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: () => <AppLayout><div className="p-8">{EMPTY}</div></AppLayout>,
  component: FichaPage,
});

function FichaPage() {
  const { ficha } = Route.useParams();
  const { data } = useSuspenseQuery(celesolEntriesOptions);
  const entry = data.find((e) => e.key === ficha && e.key !== "mapa");
  return <AppLayout>
    <section className="border-b border-border bg-card px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/varios" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Varios</Link>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase text-brand"><Boxes className="size-4" /> Varios{entry?.row ? ` · ${entry.group}` : ""}</div>
      </div>
    </section>
    <div className="mx-auto max-w-5xl px-6 py-8">
      {entry?.row ? <CelesolEntry group={entry.group} title={entry.row.title} markdown={entry.row.content_markdown} /> : EMPTY}
      <p className="mt-8 text-sm"><Link to="/mapa-celesol" className="text-brand underline">Mapa de funcionamiento de Mutual Celesol</Link></p>
    </div>
  </AppLayout>;
}
