import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTag, type Tag } from "@/lib/kb";

export function TagPicker({
  tags,
  tagIds,
  onToggle,
  onCreated,
}: {
  tags: Tag[];
  tagIds: string[];
  onToggle: (id: string) => void;
  onCreated?: (tag: Tag) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    try {
      const tag = await createTag(value);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      setName("");
      if (!tagIds.includes(tag.id)) onToggle(tag.id);
      onCreated?.(tag);
      toast.success("Etiqueta creada", { description: tag.name });
    } catch (error) {
      toast.error("No pudimos crear la etiqueta", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>Etiquetas</Label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button key={tag.id} type="button" onClick={() => onToggle(tag.id)}>
            <Badge
              variant={tagIds.includes(tag.id) ? "default" : "outline"}
              className="cursor-pointer font-normal"
            >
              {tag.name}
            </Badge>
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Input
          value={name}
          maxLength={40}
          placeholder="Nueva etiqueta"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || !name.trim()}
          onClick={() => void handleCreate()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Agregar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Si no encontrás la etiqueta que necesitás, creala acá y queda disponible para todos los
        procesos.
      </p>
    </div>
  );
}
