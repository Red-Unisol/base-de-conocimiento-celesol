import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppLayout } from "@/components/app-layout";
import { ProcessCard } from "@/components/process-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCategories, fetchProcesses } from "@/lib/kb";

export const Route = createFileRoute("/_authenticated/categoria/$slug")({
  head: () => ({
    meta: [
      { title: "Categoría de procesos — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content:
          "Videos y guías paso a paso de los procesos internos de UNISOL agrupados por categoría.",
      },
      { property: "og:title", content: "Categoría de procesos — UNISOL" },
      {
        property: "og:description",
        content: "Catálogo de procesos documentados de la mutual, filtrable por etiquetas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [order, setOrder] = useState("recientes");

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const processes = useQuery({
    queryKey: ["processes", "published", slug],
    queryFn: () => fetchProcesses({ categorySlug: slug }),
  });

  const category = (categories.data ?? []).find((c) => c.slug === slug);
  const items = useMemo(() => processes.data ?? [], [processes.data]);
  const tags = useMemo(() => Array.from(new Set(items.flatMap((p) => p.tags))).sort(), [items]);

  const filtered = useMemo(() => {
    const list = activeTags.length
      ? items.filter((p) => activeTags.every((t) => p.tags.includes(t)))
      : items;
    return [...list].sort((a, b) =>
      order === "titulo" ? a.title.localeCompare(b.title) : b.updated_at.localeCompare(a.updated_at),
    );
  }, [items, activeTags, order]);

  function toggle(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">{category?.name ?? "Categoría"}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          {category?.description ?? ""}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-border py-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Etiquetas
          </span>
          {tags.map((tag) => {
            const active = activeTags.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => toggle(tag)}>
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer font-normal"
                >
                  {tag}
                </Badge>
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Limpiar
            </button>
          )}
          <div className="ml-auto">
            <Select value={order} onValueChange={setOrder}>
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recientes">Más recientes</SelectItem>
                <SelectItem value="titulo">Título (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {processes.isLoading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProcessCard key={p.id} process={p} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">
            Todavía no hay procesos documentados con esos filtros.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
