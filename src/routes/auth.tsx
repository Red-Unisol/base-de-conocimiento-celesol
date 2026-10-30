import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, LogIn, MailCheck } from "lucide-react";
import unisolIcon from "@/assets/unisol-icon.png.asset.json";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { requestPasswordReset } from "@/lib/users.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ingresar — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Acceso para colaboradores de UNISOL Unión Solidaria con correo y contraseña.",
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
  const [mode, setMode] = useState<"password" | "link" | "reset">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("No pudimos ingresar", {
        description: "Revisá el correo y la contraseña. Si es tu primera vez, pedí el enlace de acceso.",
      });
      return;
    }
    navigate({ to: "/" });
  }

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/definir-clave`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error("No pudimos enviar el enlace", { description: error.message });
      return;
    }
    setEmail(clean);
    setSent(true);
    toast.success("Enlace enviado", {
      description: `Revisá la casilla de ${clean} y abrí el enlace para elegir tu contraseña.`,
    });
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset({ data: { email } });
      setSent(true);
    } catch (err) {
      toast.error("No pudimos enviar el pedido", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <img src={unisolIcon.url} alt="UNISOL" className="size-9 rounded-full" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">UNISOL</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Unión Solidaria
            </span>
          </span>
        </div>

        <Card className="shadow-institutional">
          <CardHeader>
            <CardTitle className="text-lg">
              {mode === "password" ? "Acceso interno" : mode === "reset" ? "Restablecer contraseña" : "Primer ingreso"}
            </CardTitle>
            <CardDescription>
              {mode === "password"
                ? "Ingresá con tu correo y contraseña."
                : mode === "reset"
                  ? "Avisamos al administrador para que te asigne una contraseña nueva."
                  : "Te enviamos un enlace de acceso por correo. Al abrirlo vas a poder elegir tu contraseña."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "password" ? (
              <form className="space-y-4" onSubmit={signIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@unisol.com.ar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                  Ingresar
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-medium text-brand transition-opacity hover:opacity-80"
                  onClick={() => {
                    setMode("link");
                    setSent(false);
                  }}
                >
                  ¿Primera vez? Pedí un enlace de acceso
                </button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-medium text-brand transition-opacity hover:opacity-80"
                  onClick={() => {
                    setMode("reset");
                    setSent(false);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </form>
            ) : mode === "reset" ? (
              <form className="space-y-4" onSubmit={sendReset}>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Correo electrónico</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {sent && (
                  <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    Tu pedido fue enviado al administrador. Te va a contactar con una contraseña
                    nueva.
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy || sent}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
                  Pedir restablecimiento
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-medium text-brand transition-opacity hover:opacity-80"
                  onClick={() => setMode("password")}
                >
                  Volver al ingreso con contraseña
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={sendLink}>
                <div className="space-y-2">
                  <Label htmlFor="link-email">Correo electrónico</Label>
                  <Input
                    id="link-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@unisol.com.ar"
                  />
                </div>
                {sent && (
                  <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    Enviamos el enlace a {email}. Abrilo desde este dispositivo para definir tu
                    contraseña.
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
                  {sent ? "Reenviar enlace" : "Enviarme el enlace"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-medium text-brand transition-opacity hover:opacity-80"
                  onClick={() => setMode("password")}
                >
                  Volver al ingreso con contraseña
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Las cuentas nuevas ingresan con el rol «usuario». Los permisos adicionales los asigna un
          administrador.
        </p>
      </div>
    </div>
  );
}

