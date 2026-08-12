import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AiSearch } from "@/components/ai-search";
import { AppLayout } from "@/components/app-layout";
import { ProcessCard } from "@/components/process-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryIcon, fetchCategories, fetchProcesses } from "@/lib/kb";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Base de Conocimiento UNISOL — Procesos internos" },
      {
        name: "description",
        content:
          "Buscá con IA entre los videos y guías de procesos de UNISOL Unión Solidaria: contabilidad, cobranzas, ahorros y AMT, mesa de entrada, análisis y management.",
      },
      { property: "og:title", content: "Base de Conocimiento UNISOL" },
      {
        property: "og:description",
        content: "Videos y guías paso a paso de los procesos internos de la mutual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const processes = useQuery({
    queryKey: ["processes", "published"],
    queryFn: () => fetchProcesses(),
  });

  const recent = processes.data ?? [];

  return (
    <AppLayout>
      <section className="border-b border-border bg-card px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            UNISOL Unión Solidaria
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Base de Conocimiento Institucional
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Consultá los procesos de la mutual en lenguaje natural. La respuesta se genera
            únicamente a partir de la documentación y las transcripciones internas.
          </p>
          <div className="mt-8">
            <AiSearch processes={recent} />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Categorías
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.isLoading &&
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            {(categories.data ?? []).map((cat) => {
              const Icon = categoryIcon(cat.icon);
              return (
                <Link
                  key={cat.slug}
                  to="/categoria/$slug"
                  params={{ slug: cat.slug }}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-brand">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{cat.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {cat.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Procesos recientes
            </h2>
            {categories.data?.[0] && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/categoria/$slug" params={{ slug: categories.data[0].slug }}>
                  Ver catálogo
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
          {processes.isLoading ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : recent.length ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.slice(0, 6).map((p) => (
                <ProcessCard key={p.id} process={p} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Todavía no hay procesos publicados. Empezá la migración desde{" "}
              <Link to="/admin" className="text-brand underline-offset-2 hover:underline">
                Cargar material
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
