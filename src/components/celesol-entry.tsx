import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

/** Solo presentación: los enlaces viejos a la bandeja apuntan al mapa. */
function present(md: string) {
  return md.replace(/bandeja \[Aportes\]\(\/aportes\)/g, "[ver mapa](/mapa-celesol)");
}

export function CelesolEntry({ group, title, markdown }: { group: string; title: string; markdown: string }) {
  return <article>
    <div className="mb-4 flex flex-wrap items-center gap-2"><Badge variant="secondary">{group}</Badge><Badge variant="outline">En relevamiento / Borrador</Badge></div>
    <h2 className="mb-6 text-xl font-bold">{title}</h2>
    <div className="space-y-3 text-sm leading-relaxed [&_a]:text-brand [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"><ReactMarkdown>{present(markdown)}</ReactMarkdown></div>
  </article>;
}

export const EMPTY = <p className="text-muted-foreground">No hay contenido disponible.</p>;
