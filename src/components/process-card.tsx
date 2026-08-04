import { Link } from "@tanstack/react-router";
import { Clock, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryName, type Process } from "@/data/knowledge";

export function ProcessCard({ process }: { process: Process }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border transition-colors hover:border-brand">
      <Link
        to="/proceso/$slug"
        params={{ slug: process.slug }}
        className="flex h-full flex-col"
      >
        <div className="relative flex aspect-video items-center justify-center bg-secondary">
          <PlayCircle className="size-10 text-muted-foreground transition-colors group-hover:text-brand" />
          <span className="absolute bottom-2 right-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {process.duration}
          </span>
        </div>
        <CardHeader className="gap-1.5 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            {categoryName(process.category)}
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
            {new Date(process.updatedAt).toLocaleDateString("es-AR")}
          </span>
        </CardFooter>
      </Link>
    </Card>
  );
}
