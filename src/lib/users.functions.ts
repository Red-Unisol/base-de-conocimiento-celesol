import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isInstitutionalEmail } from "@/lib/institutional-domains";

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
