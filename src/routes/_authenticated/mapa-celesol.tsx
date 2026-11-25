import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { CelesolEntry, EMPTY } from "@/components/celesol-entry";
import { celesolEntriesOptions } from "@/lib/celesol";

export const Route = createFileRoute("/_authenticated/mapa-celesol")({
  loader: ({ context }) => context.queryClient.ensureQueryData(celesolEntriesOptions),
  head: () => ({ meta: [
    { title: "Mapa de funcionamiento de Mutual Celesol | UNISOL" },
    { name: "description", content: "Índice institucional de Mutual Celesol que conecta Políticas, Procesos y Varios." },
    { property: "og:title", content: "Mapa de funcionamiento de Mutual Celesol" },
    { property: "og:description", content: "Índice institucional transversal, en relevamiento." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: () => <AppLayout><div className="p-8">{EMPTY}</div></AppLayout>,
  component: MapPage,
});

const area = "rounded-lg border border-border p-3 text-sm font-medium hover:bg-secondary";
function MapPage() {
  const { data } = useSuspenseQuery(celesolEntriesOptions);
  const map = data.find((e) => e.key === "mapa")?.row;
  return <AppLayout>
    <section className="border-b border-border bg-card px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-brand"><MapIcon className="size-4" /> Índice institucional</div>
        <h1 className="mt-2 text-3xl font-bold">Mapa de funcionamiento de Mutual Celesol</h1>
        <p className="mt-2 text-sm text-muted-foreground">Conecta las tres áreas; no es una política ni un proceso.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link to="/politicas" className={area}>Políticas</Link>
          <Link to="/" className={area}>Procesos</Link>
          <Link to="/varios" className={area}>Varios</Link>
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-5xl px-6 py-8">{map ? <CelesolEntry group="Mapa" title={map.title} markdown={map.content_markdown} /> : EMPTY}</div>
  </AppLayout>;
}
