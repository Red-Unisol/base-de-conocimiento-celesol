import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { EMPTY } from "@/components/celesol-entry";
import { Badge } from "@/components/ui/badge";
import { celesolEntriesOptions } from "@/lib/celesol";

export const Route = createFileRoute("/_authenticated/varios/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(celesolEntriesOptions),
  head: () => ({ meta: [
    { title: "Varios — proveedores y fondeadores | UNISOL" },
    { name: "description", content: "Fichas de referencia de contrapartes: proveedores y fondeadores." },
    { property: "og:title", content: "Varios — proveedores y fondeadores" },
    { property: "og:description", content: "Fichas de referencia en relevamiento." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  errorComponent: () => <AppLayout><div className="p-8">{EMPTY}</div></AppLayout>,
  component: VariosPage,
});

function VariosPage() {
  const { data } = useSuspenseQuery(celesolEntriesOptions);
  const items = data.filter((e) => e.key !== "mapa" && e.row);
  return <AppLayout>
    <section className="border-b border-border bg-card px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-brand"><Boxes className="size-4" /> Varios</div>
        <h1 className="mt-2 text-3xl font-bold">Varios</h1>
        <p className="mt-2 text-sm text-muted-foreground">Fichas de referencia de contrapartes. El material nuevo entra por Aportes y se ubica acá después de revisarlo.</p>
      </div>
    </section>
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      {items.length === 0 ? EMPTY : (["Proveedores", "Fondeadores"] as const).map((g) => {
        const list = items.filter((e) => e.group === g);
        if (!list.length) return null;
        return <div key={g}>
          <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{g}</h2>
          <div className="grid gap-3 sm:grid-cols-2">{list.map((e) => (
            <Link key={e.key} to="/varios/$ficha" params={{ ficha: e.key }} className="flex items-center gap-2 rounded-lg border border-border p-4 hover:bg-secondary">
              <span className="font-medium">{e.row?.title}</span><Badge variant="outline" className="ml-auto">Borrador</Badge><ArrowRight className="size-4" />
            </Link>))}</div>
        </div>;
      })}
    </div>
  </AppLayout>;
}
