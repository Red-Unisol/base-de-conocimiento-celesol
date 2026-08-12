import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { ProcessCard } from "@/components/process-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildAiAnswer, searchProcesses, type Process } from "@/lib/kb";

export function AiSearch({ processes }: { processes: Process[] }) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Process[] | null>(null);

  function run(q: string) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setResults(null);
    window.setTimeout(() => {
      setResults(searchProcesses(term, processes));
      setLoading(false);
    }, 350);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
        }}
        className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-institutional"
      >
        <Search className="ml-2 size-5 shrink-0 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="¿Qué proceso necesitás consultar?"
          aria-label="Buscar en la base de conocimiento"
          className="h-11 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="lg" className="shrink-0">
          <Sparkles className="size-4" />
          Consultar
        </Button>
      </form>

      <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2">
        {["conciliación bancaria", "alta de socio", "mora", "scoring"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              run(s);
            }}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      {(loading || results) && (
        <div className="mx-auto mt-8 max-w-3xl">
          <Tabs defaultValue="ia">
            <TabsList>
              <TabsTrigger value="ia">Respuesta IA</TabsTrigger>
              <TabsTrigger value="directos">
                Resultados directos {results ? `(${results.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ia" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand">
                    <Sparkles className="size-4" />
                    Respuesta generada
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-left">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Analizando la documentación…</p>
                  ) : (
                    <>
                      <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground dark:prose-invert">
                        <ReactMarkdown>{buildAiAnswer(query, results ?? [])}</ReactMarkdown>
                      </div>
                      {results && results.length > 0 && (
                        <div className="mt-5 border-t border-border pt-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Fuentes consultadas
                          </p>
                          <ul className="space-y-1.5">
                            {results.slice(0, 3).map((p) => (
                              <li key={p.id}>
                                <Link
                                  to="/proceso/$slug"
                                  params={{ slug: p.slug }}
                                  className="flex items-center gap-2 text-sm text-foreground hover:text-brand"
                                >
                                  <ArrowRight className="size-3.5 shrink-0" />
                                  <span className="font-medium">{p.title}</span>
                                  <Badge variant="secondary" className="font-normal">
                                    {p.category?.name ?? "Sin categoría"}
                                  </Badge>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="directos" className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Buscando…</p>
              ) : results && results.length > 0 ? (
                <div className="grid gap-4 text-left sm:grid-cols-2">
                  {results.map((p) => (
                    <ProcessCard key={p.id} process={p} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay documentos que coincidan con la búsqueda.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
