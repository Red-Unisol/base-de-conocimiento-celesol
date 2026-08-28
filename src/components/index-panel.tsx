import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, CheckCircle2, FileWarning, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { DOC_BUCKET, signedUrl } from "@/lib/kb";
import { extractPdfText } from "@/lib/pdf-text";
import { indexProcess } from "@/lib/rag.functions";
import { formatDate } from "@/lib/utils";

type IndexRow = {
  id: string;
  title: string;
  document_path: string | null;
  document_markdown: string | null;
  document_text: string | null;
  indexed_at: string | null;
};

async function fetchIndexRows(): Promise<IndexRow[]> {
  const { data, error } = await supabase
    .from("processes")
    .select("id, title, document_path, document_markdown, document_text, indexed_at")
    .order("title");
  if (error) throw error;
  return data as IndexRow[];
}

/** Indexa un proceso: extrae el texto del PDF en el navegador y lo manda al servidor. */
async function indexOne(row: IndexRow) {
  let documentText = row.document_markdown ?? "";
  if (row.document_path) {
    try {
      const url = await signedUrl(DOC_BUCKET, row.document_path);
      const isPdf = row.document_path.toLowerCase().endsWith(".pdf");
      if (isPdf) documentText = await extractPdfText(url);
    } catch {
      documentText = documentText || "";
    }
  }
  return indexProcess({ data: { processId: row.id, documentText } });
}

export function IndexPanel() {
  const qc = useQueryClient();
  const rows = useQuery({ queryKey: ["index-rows"], queryFn: fetchIndexRows });
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [noText, setNoText] = useState<string[]>([]);

  const run = useMutation({
    mutationFn: async (list: IndexRow[]) => {
      setNoText([]);
      const sinTexto: string[] = [];
      for (let i = 0; i < list.length; i += 1) {
        setProgress({ done: i, total: list.length });
        const row = list[i]!;
        try {
          const res = await indexOne(row);
          if (!res.hasText) sinTexto.push(row.title);
        } catch (e) {
          toast.error(`No pudimos indexar «${row.title}»`, { description: (e as Error).message });
        }
      }
      setProgress({ done: list.length, total: list.length });
      setNoText(sinTexto);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["index-rows"] });
      setTimeout(() => setProgress(null), 1200);
    },
    onSuccess: () => toast.success("Indexación completada"),
  });

  const list = rows.data ?? [];
  const indexed = list.filter((r) => r.indexed_at);
  const pending = list.filter((r) => !r.indexed_at);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4 text-brand" />
            Índice de búsqueda con IA
          </CardTitle>
          <CardDescription>
            La búsqueda inteligente responde sólo con el material indexado. Los procesos nuevos se
            indexan al guardarlos; usá este panel para reindexar la base completa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {indexed.length} de {list.length} procesos indexados
            </Badge>
            {pending.length > 0 && <Badge variant="outline">{pending.length} pendientes</Badge>}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={run.isPending || pending.length === 0}
                onClick={() => run.mutate(pending)}
              >
                Indexar pendientes
              </Button>
              <Button size="sm" disabled={run.isPending || list.length === 0} onClick={() => run.mutate(list)}>
                {run.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Reindexar base
              </Button>
            </div>
          </div>

          {progress && (
            <div className="space-y-1.5">
              <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} />
              <p className="text-xs text-muted-foreground">
                {progress.done} de {progress.total} procesos procesados
              </p>
            </div>
          )}

          {noText.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileWarning className="size-3.5" />
                Sin texto extraíble
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estos procesos se indexaron sólo con título y resumen (el PDF probablemente sea una
                imagen escaneada): {noText.join(", ")}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando estado del índice…
          </p>
        ) : (
          list.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-2.5"
            >
              <span className="text-sm font-medium">{r.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {r.indexed_at ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-brand-accent" />
                    Indexado el {formatDate(r.indexed_at)}
                  </>
                ) : (
                  "Pendiente de indexar"
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
