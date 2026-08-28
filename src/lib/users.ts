import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-auth";

export type RegisteredUser = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_seen_at: string | null;
  roles: AppRole[];
};

export const MANAGED_ROLES: { value: AppRole; label: string; hint: string }[] = [
  { value: "usuario", label: "Usuario", hint: "Lectura del material general" },
  { value: "it", label: "IT", hint: "Acceso a la categoría Sistemas" },
  { value: "admin", label: "Administrador", hint: "Carga de material y gestión de usuarios" },
];

export function roleLabel(role: AppRole): string {
  return MANAGED_ROLES.find((r) => r.value === role)?.label ?? role;
}

export async function fetchRegisteredUsers(): Promise<RegisteredUser[]> {
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, created_at, last_seen_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;

  const byUser = new Map<string, AppRole[]>();
  for (const r of roles ?? []) {
    byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email ?? "",
    full_name: p.full_name ?? "",
    created_at: p.created_at,
    last_seen_at: p.last_seen_at,
    roles: byUser.get(p.id) ?? [],
  }));
}

export async function grantRole(userId: string, role: AppRole) {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function revokeRole(userId: string, role: AppRole) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) throw error;
}

export async function touchLastSeen(userId: string) {
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}
