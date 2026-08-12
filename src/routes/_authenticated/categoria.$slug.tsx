import { createFileRoute, notFound } from "@tanstack/react-router";
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
import { getCategory, processes } from "@/data/knowledge";

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { name: category.name, description: category.description, slug: category.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Categoría no disponible — UNISOL" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — Base de Conocimiento UNISOL`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug, name, description } = Route.useLoaderData();
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [order, setOrder] = useState("recientes");

  const items = useMemo(() => processes.filter((p) => p.category === slug), [slug]);
  const tags = useMemo(
    () => Array.from(new Set(items.flatMap((p) => p.tags))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const list = activeTags.length
      ? items.filter((p) => activeTags.every((t) => p.tags.includes(t)))
      : items;
    return [...list].sort((a, b) =>
      order === "titulo" ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt),
    );
  }, [items, activeTags, order]);

  function toggle(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>

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

        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProcessCard key={p.slug} process={p} />
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
