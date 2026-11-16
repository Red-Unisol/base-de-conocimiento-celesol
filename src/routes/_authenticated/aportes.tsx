import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useWebMCP } from "use-webmcp-tool";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchContributions, submitContribution, uploadRecording } from "@/lib/contributions-client";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";

export const Route = createFileRoute("/_authenticated/aportes")({
  head: () => ({ meta: [
    { title: "Aportes de asistentes — Base de Conocimiento Celesol" },
    { name: "description", content: "Propuestas de políticas y procedimientos pendientes de revisión." },
    { property: "og:title", content: "Aportes — Celesol" }, { property: "og:description", content: "Revisión interna de propuestas y grabaciones." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: ContributionsPage,
});
function ContributionsPage() {
  const qc = useQueryClient();
  const admin = useIsAdmin();
  const rows = useQuery({ queryKey: ["agent-contributions"], queryFn: fetchContributions });
  const [kind, setKind] = useState<"policy" | "process">("process");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: submitContribution,
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["agent-contributions"] }); },
  });
  const review = useMutation({ mutationFn: async (id: string) => {
    const row = rows.data?.find(r => r.id === id);
    if (!admin.data || !row || row.status !== "pendiente") throw new Error("No podés revisar este aporte.");
    const { error } = await supabase.from("agent_contributions").update({ status: "revisada" }).eq("id", id);
    if (error) throw error;
  }, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["agent-contributions"] }); }, onError: () => toast.error("No se pudo marcar como revisada") });
  useWebMCP({ name: "list_visible_contributions", description: "Lee los aportes visibles en esta página.", enabled: rows.isSuccess,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("list_visible_contributions", () => rows.data?.map(r => `${r.id}: ${r.title} — ${r.status}`).join("\n") || "No hay aportes visibles."),
  });
  useWebMCP<{ kind: "policy" | "process"; title: string; content_markdown: string; source_notes?: string }>({
    name: "save_contribution", description: "Guarda una propuesta con pasos y fuentes para revisión; no reemplaza contenido vigente.", enabled: !save.isPending,
    annotations: { readOnlyHint: false },
    inputSchema: { type: "object", properties: { kind: { type: "string", enum: ["policy", "process"], description: "Tipo de aporte." }, title: { type: "string", description: "Título del aporte." }, content_markdown: { type: "string", description: "Pasos numerados o corrección propuesta." }, source_notes: { type: "string", description: "Fuentes y pendientes." } }, required: ["kind", "title", "content_markdown"] },
    execute: input => runWebMCPTool("save_contribution", async () => { const row = await save.mutateAsync(input); return `Propuesta ${row.id} guardada para revisión.`; }),
  });
  async function attach(id: string, file: File) {
    if (uploading || !rows.data?.some(r => r.id === id)) return;
    setUploading(id);
    try { await uploadRecording(id, file); await qc.invalidateQueries({ queryKey: ["agent-contributions"] }); toast.success("Grabación guardada"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo cargar la grabación"); }
    finally { setUploading(null); }
  }
  async function openRecording(path: string) {
    setOpening(path);
    try {
      const { data, error } = await supabase.storage.from("agent-recordings").createSignedUrl(path, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch { toast.error("No se pudo abrir la grabación"); } finally { setOpening(null); }
  }
  return <AppLayout><div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
    <header><h1 className="text-2xl font-semibold">Aportes de asistentes</h1><p className="mt-2 text-sm text-muted-foreground">Pendientes de revisión · El contenido vigente se conserva</p></header>
    <form className="space-y-4 border-y border-border py-6" onSubmit={async e => { e.preventDefault(); try { await save.mutateAsync({ kind, title, content_markdown: content, source_notes: source }); setTitle(""); setContent(""); setSource(""); toast.success("Propuesta guardada"); } catch { toast.error("No se pudo guardar la propuesta"); } }}>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]"><div className="space-y-2"><Label>Tipo</Label><Select value={kind} onValueChange={v => { if (v === "policy" || v === "process") setKind(v); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="process">Procedimiento</SelectItem><SelectItem value="policy">Política</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="contribution-title">Título</Label><Input id="contribution-title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></div></div>
      <div className="space-y-2"><Label htmlFor="contribution-content">Pasos o corrección propuesta</Label><Textarea id="contribution-content" required rows={8} value={content} onChange={e => setContent(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="contribution-source">Fuentes y pendientes</Label><Textarea id="contribution-source" value={source} onChange={e => setSource(e.target.value)} /></div>
      <Button disabled={save.isPending}>Guardar propuesta</Button>
    </form>
    {rows.isLoading && <p>Cargando aportes…</p>}{rows.isError && <p role="alert">No se pudieron consultar los aportes.</p>}
    {rows.data?.length === 0 && <p className="text-muted-foreground">Todavía no hay aportes.</p>}
    <div className="space-y-4">{rows.data?.map(row => <article key={row.id} className="space-y-3 rounded-md border border-border p-5">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{row.title}</h2><span className="text-sm text-muted-foreground">{row.status === "pendiente" ? "Pendiente de revisión" : "Revisada"}</span></div>
      <p className="whitespace-pre-wrap break-words text-sm">{row.content_markdown}</p>
      {row.source_notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{row.source_notes}</p>}
      <div className="flex flex-wrap gap-3">{row.agent_recordings.map(file => <Button key={file.id} variant="outline" disabled={opening === file.path} onClick={() => openRecording(file.path)}>{file.name}</Button>)}</div>
      <div className="space-y-2"><Label htmlFor={`recording-${row.id}`}>Adjuntar grabación</Label><Input id={`recording-${row.id}`} type="file" accept="video/*,audio/*" disabled={Boolean(uploading)} onChange={e => { const file = e.target.files?.[0]; if (file) void attach(row.id, file); e.target.value = ""; }} /></div>
      {admin.data && row.status === "pendiente" && <Button variant="outline" disabled={review.isPending} onClick={() => review.mutate(row.id)}>Marcar revisada</Button>}
    </article>)}</div>
  </div></AppLayout>;
}