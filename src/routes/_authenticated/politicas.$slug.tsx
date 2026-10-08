import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { PolicyWorkspace } from "@/components/policies/policy-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/hooks/use-auth";
import { POLICY_STATUSES, fetchPolicyBundle, labelOf } from "@/lib/policies";

export const Route = createFileRoute("/_authenticated/politicas/$slug")({
  head: () => ({
    meta: [
      { title: "Ficha de política — Motor de políticas UNISOL" },
      { name: "description", content: "Documentos, reglas, dudas y diseño SIISA de una política de originación." },
      { property: "og:title", content: "Ficha de política — UNISOL" },
      { property: "og:description", content: "Documentos, reglas, dudas y diseño SIISA de una política." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PolicyDetail,
});

function PolicyDetail() {
  const { slug } = Route.useParams();
  const q = useQuery({ queryKey: ["policy", slug], queryFn: () => fetchPolicyBundle(slug) });
  const isAdmin = useIsAdmin();

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Link to="/politicas" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3" /> Políticas
        </Link>
        {q.isLoading ? (
          <Skeleton className="h-64" />
        ) : !q.data ? (
          <p className="text-sm text-muted-foreground">No se encontró la política.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{q.data.policy.name}</h1>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{labelOf(POLICY_STATUSES, q.data.policy.status)}</Badge>
                  {q.data.policy.working_version && <span>Versión {q.data.policy.working_version}</span>}
                </div>
              </div>
              {isAdmin.data && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/politicas" search={{ p: slug }}>
                    <Pencil className="size-4" /> Administrar
                  </Link>
                </Button>
              )}
            </div>
            <PolicyWorkspace bundle={q.data} editable={false} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
