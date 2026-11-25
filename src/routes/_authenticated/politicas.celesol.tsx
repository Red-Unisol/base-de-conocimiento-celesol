import { createFileRoute, redirect } from "@tanstack/react-router";

// Enlace anterior: redirige al mapa o a la ficha correspondiente de Varios.
export const Route = createFileRoute("/_authenticated/politicas/celesol")({
  validateSearch: (s: Record<string, unknown>) => ({ ficha: typeof s["ficha"] === "string" ? s["ficha"] : undefined }),
  beforeLoad: ({ search }) => {
    if (search.ficha === "sg" || search.ficha === "reba") throw redirect({ to: "/varios/$ficha", params: { ficha: search.ficha }, replace: true });
    throw redirect({ to: "/mapa-celesol", replace: true });
  },
});
