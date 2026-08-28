import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ingresar — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Acceso para colaboradores de UNISOL Unión Solidaria con código de verificación.",
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
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      toast.error("No pudimos enviar el código", { description: error.message });
      return;
    }
    setEmail(clean);
    setStep("code");
    toast.success("Código enviado", {
      description: `Revisá la casilla de ${clean}. Llega en menos de un minuto.`,
    });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      toast.error("Código incorrecto o vencido", { description: error.message });
      return;
    }
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
            <CardTitle className="text-lg">
              {step === "email" ? "Acceso interno" : "Ingresá el código"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Escribí tu correo y te enviamos un código de verificación. Si es tu primera vez, la cuenta se crea automáticamente."
                : `Enviamos un código de 6 dígitos a ${email}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form className="space-y-4" onSubmit={sendCode}>
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
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
                  Enviarme el código
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={verify}>
                <div className="space-y-2">
                  <Label htmlFor="code">Código de verificación</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={8}
                    className="text-center text-lg tracking-[0.4em]"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Ingresar
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                    }}
                  >
                    <ArrowLeft className="size-3" />
                    Cambiar correo
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
                    onClick={() => sendCode()}
                  >
                    Reenviar código
                  </button>
                </div>
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
