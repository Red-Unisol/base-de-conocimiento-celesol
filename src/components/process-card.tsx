import { Link } from "@tanstack/react-router";
import { Clock, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Process } from "@/lib/kb";
import { formatDate } from "@/lib/utils";

const GRADIENTS = [
  "from-primary via-primary to-brand",
  "from-brand via-primary to-primary",
  "from-primary via-brand to-primary",
  "from-primary to-brand",
  "from-brand to-primary",
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProcessCard({ process }: { process: Process }) {
  const seed = hash(process.slug);
  const gradient = GRADIENTS[seed % GRADIENTS.length];
  const angle = ["bg-gradient-to-br", "bg-gradient-to-tr", "bg-gradient-to-r"][seed % 3];

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border transition-colors hover:border-brand">
      <Link
        to="/proceso/$slug"
        params={{ slug: process.slug }}
        className="flex h-full flex-col"
      >
        <div
          className={`relative flex aspect-video items-center justify-center overflow-hidden ${angle} ${gradient}`}
        >
          <span
            aria-hidden
            className="absolute -left-4 -top-6 text-[7rem] font-bold leading-none text-primary-foreground/10"
          >
            {initials(process.title) || "UN"}
          </span>
          <span className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
            {process.category?.name ?? "UNISOL"}
          </span>
          <span className="relative line-clamp-2 max-w-[85%] px-4 text-center text-sm font-semibold text-primary-foreground">
            {process.title}
          </span>
          <PlayCircle className="absolute bottom-2 left-3 size-6 text-primary-foreground/70 transition-colors group-hover:text-primary-foreground" />
          {process.duration_label && (
            <span className="absolute bottom-2 right-2 rounded bg-primary/60 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground backdrop-blur-sm">
              {process.duration_label}
            </span>
          )}
        </div>
        <CardHeader className="gap-1.5 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            {process.category?.name ?? "Sin categoría"}
          </span>
          <CardTitle className="text-base leading-snug">{process.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-3">
          <p className="line-clamp-3 text-sm text-muted-foreground">{process.summary}</p>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-1.5 pt-0">
          {process.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            {formatDate(process.updated_at)}
          </span>
        </CardFooter>
      </Link>
    </Card>
  );
}
