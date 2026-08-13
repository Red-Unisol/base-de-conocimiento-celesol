import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ingresar — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Acceso para colaboradores de UNISOL Unión Solidaria.",
      },
      { property: "og:title", content: "Ingresar — UNISOL" },
      { property: "og:description", content: "Acceso interno a la base de conocimiento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("No pudimos ingresar", { description: error.message });
      return;
    }
    navigate({ to: "/" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      toast.error("No pudimos crear la cuenta", { description: error.message });
      return;
    }
    toast.success("Cuenta creada", {
      description: "Tu cuenta queda activa al instante, sin confirmación por correo.",
    });
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
            <CardTitle className="text-lg">Acceso interno</CardTitle>
            <CardDescription>
              Exclusivo para colaboradores de la mutual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ingresar">
              <TabsList className="w-full">
                <TabsTrigger value="ingresar" className="flex-1">
                  Ingresar
                </TabsTrigger>
                <TabsTrigger value="crear" className="flex-1">
                  Crear cuenta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ingresar" className="mt-4">
                <form className="space-y-4" onSubmit={signIn}>
                  <Fields
                    email={email}
                    password={password}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    autoComplete="current-password"
                  />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    Ingresar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="crear" className="mt-4">
                <form className="space-y-4" onSubmit={signUp}>
                  <Fields
                    email={email}
                    password={password}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    autoComplete="new-password"
                  />
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    Crear cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Los permisos de carga los asigna un administrador.
        </p>
      </div>
    </div>
  );
}

function Fields({
  email,
  password,
  setEmail,
  setPassword,
  autoComplete,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`email-${autoComplete}`}>Correo institucional</Label>
        <Input
          id={`email-${autoComplete}`}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@unisol.com.ar"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`pass-${autoComplete}`}>Contraseña</Label>
        <Input
          id={`pass-${autoComplete}`}
          type="password"
          required
          minLength={6}
          autoComplete={autoComplete}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </>
  );
}
