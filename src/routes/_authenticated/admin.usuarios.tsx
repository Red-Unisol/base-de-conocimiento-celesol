import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Loader2, Search, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useIsAdmin, useSession, type AppRole } from "@/hooks/use-auth";
import { deleteRegisteredUser } from "@/lib/users.functions";
import {
  MANAGED_ROLES,
  fetchRegisteredUsers,
  grantRole,
  revokeRole,
  type RegisteredUser,
} from "@/lib/users";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios registrados — Base de Conocimiento UNISOL" },
      {
        name: "description",
        content: "Panel interno de administración de accesos y roles de la base de conocimiento.",
      },
      { property: "og:title", content: "Usuarios registrados — UNISOL" },
      { property: "og:description", content: "Gestión de accesos y roles internos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const isAdmin = useIsAdmin();

  if (isAdmin.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Verificando permisos…
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin.data) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <AlertCircle className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Sección restringida</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El panel de usuarios es exclusivo del administrador.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <UsersPanel />
    </AppLayout>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const { user } = useSession();
  const [term, setTerm] = useState("");

  const users = useQuery({ queryKey: ["registered-users"], queryFn: fetchRegisteredUsers });

  const toggle = useMutation({
    mutationFn: async (v: { userId: string; role: AppRole; enabled: boolean }) =>
      v.enabled ? grantRole(v.userId, v.role) : revokeRole(v.userId, v.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registered-users"] });
      qc.invalidateQueries({ queryKey: ["my-roles"] });
      toast.success("Permisos actualizados");
    },
    onError: (e: Error) => toast.error("No pudimos actualizar", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => deleteRegisteredUser({ data: { userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registered-users"] });
      toast.success("Acceso dado de baja");
    },
    onError: (e: Error) => toast.error("No pudimos dar de baja", { description: e.message }),
  });

  const list = useMemo(() => {
    const q = term.trim().toLowerCase();
    const all = users.data ?? [];
    return q ? all.filter((u) => u.email.toLowerCase().includes(q)) : all;
  }, [users.data, term]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="size-5 text-brand" />
            Usuarios registrados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigná o quitá permisos. El rol «IT» habilita la categoría Sistemas.
          </p>
        </div>
        <Badge variant="secondary">{(users.data ?? []).length} cuentas</Badge>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por correo…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>

      {users.isLoading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando usuarios…
        </div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No hay cuentas que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.id === user?.id}
              busy={toggle.isPending || remove.isPending}
              onToggle={(role, enabled) => toggle.mutate({ userId: u.id, role, enabled })}
              onRemove={() => {
                if (confirm(`¿Dar de baja el acceso de ${u.email}?`)) remove.mutate(u.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  busy,
  onToggle,
  onRemove,
}: {
  user: RegisteredUser;
  isSelf: boolean;
  busy: boolean;
  onToggle: (role: AppRole, enabled: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {user.email || "(sin correo)"}
              {isSelf && (
                <Badge variant="outline" className="ml-2 align-middle text-[10px]">
                  vos
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Alta: {formatDate(user.created_at)}
              {user.last_seen_at ? ` · Último ingreso: ${formatDate(user.last_seen_at)}` : ""}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || isSelf}
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Dar de baja
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-6">
        {MANAGED_ROLES.map((role) => {
          const active = user.roles.includes(role.value);
          const locked = isSelf && role.value === "admin";
          return (
            <label key={role.value} className="flex items-center gap-2.5">
              <Switch
                checked={active}
                disabled={busy || locked}
                onCheckedChange={(v) => onToggle(role.value, v)}
              />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{role.label}</span>
                <span className="text-xs text-muted-foreground">{role.hint}</span>
              </span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
