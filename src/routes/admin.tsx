import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { allTags, categories } from "@/data/knowledge";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Cargar material — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Formulario interno para publicar nuevos videos y guías de procesos de UNISOL.",
      },
      { property: "og:title", content: "Cargar material — UNISOL" },
      {
        property: "og:description",
        content: "Alta de procesos documentados con video Trupeer y guía paso a paso.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [embed, setEmbed] = useState("");
  const [summary, setSummary] = useState("");
  const [doc, setDoc] = useState("");

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category || !embed.trim() || !summary.trim()) {
      toast.error("Completá título, categoría, URL del video y resumen.");
      return;
    }
    toast.success("Material validado", {
      description: "La publicación se habilita al conectar la base de datos.",
    });
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Cargar material</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sección restringida. Alta de un nuevo proceso documentado en Trupeer.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificación</CardTitle>
              <CardDescription>Cómo se va a encontrar este proceso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del proceso</Label>
                <Input
                  id="titulo"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Conciliación bancaria mensual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}>
                      <Badge
                        variant={tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer font-normal"
                      >
                        {tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenido</CardTitle>
              <CardDescription>Video de Trupeer y guía escrita.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embed">URL o código embed de Trupeer</Label>
                <Input
                  id="embed"
                  value={embed}
                  maxLength={2000}
                  onChange={(e) => setEmbed(e.target.value)}
                  placeholder="https://www.trupeer.ai/embed/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc">Documento explicativo (Markdown)</Label>
                <Textarea
                  id="doc"
                  value={doc}
                  rows={10}
                  maxLength={20000}
                  onChange={(e) => setDoc(e.target.value)}
                  placeholder={"## Objetivo\n\n## Pasos\n1. ..."}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  También vas a poder subir un archivo PDF o DOCX cuando se conecte el
                  almacenamiento.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resumen">Resumen breve para el buscador</Label>
                <Textarea
                  id="resumen"
                  value={summary}
                  rows={3}
                  maxLength={400}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Dos o tres líneas que describan el circuito."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <Upload className="size-4" />
              Publicar proceso
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
