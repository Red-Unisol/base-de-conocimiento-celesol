import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Scale, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { POLICY_STATUSES, fetchPolicySummaries, labelOf, type PolicySummary } from "@/lib/policies";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/politicas/")({
  head: () => ({
    meta: [
      { title: "Políticas — Motor de políticas UNISOL" },
      { name: "description", content: "Repositorio de políticas de originación y diseño de trazas SIISA." },
      { property: "og:title", content: "Políticas — UNISOL" },
      { property: "og:description", content: "Repositorio de políticas de originación y diseño de trazas SIISA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const q = useQuery({ queryKey: ["policies"], queryFn: fetchPolicySummaries });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const list = useMemo(
    () =>
      (q.data ?? []).filter(
        (p) =>
          (status === "all" || p.status === status) &&
          p.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [q.data, search, status],
  );

  return (
    <AppLayout>
      <section className="border-b border-border bg-card px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            <Scale className="size-3.5" /> Motor de políticas
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Políticas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Repositorio de políticas de originación y diseño de trazas SIISA.
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar política por nombre" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {POLICY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {q.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : q.error ? (
            <p className="text-sm text-destructive">No se pudieron cargar las políticas.</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay políticas que coincidan.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => <PolicyCard key={p.id} p={p} />)}
            </div>
          )}

          <EngineMap policies={q.data ?? []} />
        </div>
      </section>
    </AppLayout>
  );
}

function PolicyCard({ p }: { p: PolicySummary }) {
  return (
    <Link
      to="/politicas/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{p.name}</div>
          {p.code && <div className="text-xs text-muted-foreground">{p.code}</div>}
        </div>
        <Badge variant={p.status === "pendiente_carga" ? "outline" : "secondary"} className="text-[10px]">
          {labelOf(POLICY_STATUSES, p.status)}
        </Badge>
      </div>
      {p.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        {[["Reglas", p.rules], ["Dudas abiertas", p.openQuestions], ["Documentos", p.documents]].map(([k, v]) => (
          <div key={k as string} className="rounded-md bg-secondary px-1 py-1.5">
            <div className="text-base font-semibold">{v}</div>
            <div className="text-[10px] text-muted-foreground">{k}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Versión: {p.working_version || "—"}</span>
        <span>Act. {formatDate(p.updated_at)}</span>
      </div>
    </Link>
  );
}

/** Mapa del motor: políticas principales, sus subpolíticas y las llamadas registradas en el diseño SIISA. */
function EngineMap({ policies }: { policies: PolicySummary[] }) {
  if (!policies.length) return null;
  const byId = Object.fromEntries(policies.map((p) => [p.id, p]));
  const roots = policies.filter((p) => !p.parent_policy_id || !byId[p.parent_policy_id]);
  const children = (id: string) => policies.filter((p) => p.parent_policy_id === id);
  const anyLinks = policies.some((p) => p.parent_policy_id || p.calls.length || p.lines.length);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mapa del motor</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {anyLinks
          ? "Políticas, sus líneas, subpolíticas, llamadas y fuentes de datos registradas en el diseño (propuesta, no SIISA real)."
          : "Todavía no hay dependencias cargadas. Se arman al asignar una política principal o al registrar nodos SIISA que llamen a otra política."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roots.map((p) => (
          <div key={p.id} className="rounded-md border border-border p-3">
            <Link to="/politicas/$slug" params={{ slug: p.slug }} className="text-sm font-semibold hover:text-brand">
              {p.name}
            </Link>
            <div className="mt-1 text-[10px] text-muted-foreground">{p.lines.length} líneas · {p.nodes} nodos · {p.sources.length} fuentes</div>
            {p.lines.map((l) => (
              <div key={l} className="mt-1 text-xs">• {l}</div>
            ))}
            {children(p.id).map((c) => (
              <div key={c.id} className="mt-1.5 border-l-2 border-brand pl-2 text-xs">
                Subpolítica: {c.name}
              </div>
            ))}
            {[...new Set(p.calls)].map((id) => byId[id] && (
              <div key={id} className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowRight className="size-3" /> llama a {byId[id].name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
