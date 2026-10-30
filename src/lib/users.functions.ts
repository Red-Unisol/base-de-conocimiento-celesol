import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isInstitutionalEmail } from "@/lib/institutional-domains";
import {
  normalizeResetEmail,
  shouldCreateRequest,
  validateNewPassword,
} from "@/lib/password-reset";

export const deleteRegisteredUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("Falta el usuario");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (error) throw error;
    if (!roles?.length) throw new Error("Sólo un administrador puede dar de baja usuarios");
    if (data.userId === context.userId) throw new Error("No podés darte de baja a vos mismo");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delError) throw new Error(delError.message);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    return { ok: true };
  });

export const createInstitutionalUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string; fullName?: string }) => {
    const email = input?.email?.trim().toLowerCase() ?? "";
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new Error("Correo inválido");
    if (!isInstitutionalEmail(email))
      throw new Error("Sólo se pueden dar de alta correos @redunisol.com.ar");
    if (!input.password || input.password.length < 8)
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    return { email, password: input.password, fullName: input.fullName?.trim() ?? "" };
  })
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (error) throw error;
    if (!roles?.length) throw new Error("Sólo un administrador puede dar de alta usuarios");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (cErr) {
      if (/already|registered|exists/i.test(cErr.message))
        throw new Error("Ya existe una cuenta con ese correo");
      throw new Error(cErr.message);
    }
    return { ok: true };
  });

// Public: anyone can ask; always returns the same answer.
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({ email: normalizeResetEmail(input?.email) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pending } = await supabaseAdmin
      .from("password_reset_requests")
      .select("email")
      .eq("status", "pendiente")
      .ilike("email", data.email);
    if (shouldCreateRequest((pending ?? []).map((p) => p.email), data.email)) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", data.email)
        .maybeSingle();
      await supabaseAdmin
        .from("password_reset_requests")
        .insert({ email: data.email, user_id: profile?.id ?? null });
    }
    return { ok: true };
  });

async function assertAdmin(supabase: any, userId: string) {
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw error;
  if (!roles?.length) throw new Error("Sólo un administrador puede hacer esto");
}

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string; password: string }) => {
    if (!input?.requestId) throw new Error("Falta el pedido");
    return { requestId: input.requestId, password: validateNewPassword(input.password) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: req, error } = await context.supabase
      .from("password_reset_requests")
      .select("id, email, user_id, status")
      .eq("id", data.requestId)
      .maybeSingle();
    if (error) throw error;
    if (!req || req.status !== "pendiente") throw new Error("El pedido ya no está pendiente");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId = req.user_id;
    if (!userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", req.email)
        .maybeSingle();
      userId = profile?.id ?? null;
    }
    if (!userId) throw new Error("No existe una cuenta con ese correo");
    const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password,
    });
    if (uErr) throw new Error(uErr.message);
    const by = (context.claims as any)?.email ?? "";
    await context.supabase
      .from("password_reset_requests")
      .update({ status: "resuelto", resolved_at: new Date().toISOString(), resolved_by: by })
      .eq("id", req.id);
    return { ok: true };
  });

export const dismissResetRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string }) => {
    if (!input?.requestId) throw new Error("Falta el pedido");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const by = (context.claims as any)?.email ?? "";
    const { error } = await context.supabase
      .from("password_reset_requests")
      .update({ status: "descartado", resolved_at: new Date().toISOString(), resolved_by: by })
      .eq("id", data.requestId);
    if (error) throw error;
    return { ok: true };
  });
