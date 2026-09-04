import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/definir-clave")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Definí tu contraseña — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content:
          "Elegí una contraseña para ingresar a la base de conocimiento de UNISOL Unión Solidaria.",
      },
      { property: "og:title", content: "Definí tu contraseña — UNISOL" },
      { property: "og:description", content: "Configuración de acceso interno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("No pudimos guardar la contraseña", { description: error.message });
      return;
    }
    toast.success("Listo", { description: "Ya podés ingresar con tu correo y contraseña." });
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">UNISOL</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Unión Solidaria
            </span>
          </span>
        </div>

        <Card className="shadow-institutional">
          <CardHeader>
            <CardTitle className="text-lg">Definí tu contraseña</CardTitle>
            <CardDescription>
              {loading
                ? "Verificando tu enlace de acceso…"
                : user
                  ? `Elegí la contraseña con la que vas a ingresar de ahora en más con ${user.email}.`
                  : "El enlace de acceso venció o ya fue usado. Pedí uno nuevo desde la pantalla de ingreso."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña nueva</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Repetir contraseña</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                  Guardar contraseña
                </Button>
              </form>
            ) : (
              <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Ir al ingreso
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
