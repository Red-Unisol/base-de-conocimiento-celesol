import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "" }),
  head: () => ({ meta: [
    { title: "Autorizar asistente — Base de Conocimiento Celesol" },
    { name: "description", content: "Autorización privada de asistentes con los permisos de tu cuenta." },
    { property: "og:title", content: "Autorizar asistente — Celesol" },
    { property: "og:description", content: "Conexión privada a la base de conocimiento." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Falta la solicitud de autorización. Volvé a iniciar la conexión desde tu asistente.");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error("No pudimos verificar tu sesión.");
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
    return { email: data.session.user.email };
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id");
    if (!id) throw new Error("Falta la solicitud de autorización.");
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error) throw new Error("La autorización no está disponible o venció. Iniciá una conexión nueva desde el asistente.");
    if (data && "redirect_url" in data) throw redirect({ href: data.redirect_url });
    if (!data) throw new Error("La solicitud no está disponible.");
    return data;
  },
  pendingComponent: () => <main className="p-8">Cargando autorización…</main>,
  errorComponent: ({ error }) => <main className="mx-auto max-w-lg space-y-4 p-8"><h1 className="text-xl font-semibold">No pudimos autorizar el asistente</h1><p role="alert">{error instanceof Error ? error.message : "La autorización no está disponible."}</p><Button onClick={() => window.location.assign("/")}>Volver al inicio</Button></main>,
  component: Consent,
});
function Consent() {
  const details = Route.useLoaderData();
  const { email } = Route.useRouteContext();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if ("redirect_url" in details) return null;
  async function decide(approve: boolean) {
    setBusy(true); setError("");
    try {
      const result = approve ? await supabase.auth.oauth.approveAuthorization(authorization_id) : await supabase.auth.oauth.denyAuthorization(authorization_id);
      if (result.error || !result.data?.redirect_url) throw new Error(approve ? "No se pudo aprobar la conexión. Podés volver a intentar." : "No se pudo cancelar la conexión. Podés volver a intentar.");
      window.location.assign(result.data.redirect_url);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la autorización."); setBusy(false); }
  }
  return <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
    <h1 className="text-2xl font-semibold">Conectar {details.client.name} a Base de Conocimiento Celesol</h1>
    <p className="text-sm text-muted-foreground">Cuenta: {email}</p>
    <p className="break-all text-sm">Destino: {details.redirect_uri}</p>
    <p>El asistente podrá consultar contenido permitido y guardar propuestas para revisión, usando tu cuenta.</p>
    <ul className="list-disc space-y-2 pl-5 text-sm">{details.scope.split(" ").filter(Boolean).map(scope => <li key={scope}>{scope === "openid" || scope === "profile" ? "Compartir tu perfil básico" : scope === "email" ? "Compartir tu dirección de correo" : `Permiso adicional solicitado: ${scope}`}</li>)}</ul>
    <p className="text-sm text-muted-foreground">La conexión no amplía tus permisos ni reemplaza políticas o procedimientos vigentes.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => decide(true)}>Permitir conexión</Button><Button disabled={busy} variant="outline" onClick={() => decide(false)}>Cancelar conexión</Button></div>
  </main>;
}