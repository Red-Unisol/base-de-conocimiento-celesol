import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-reset";
import { adminResetPassword, dismissResetRequest } from "@/lib/users.functions";
import { formatDate } from "@/lib/utils";

export function ResetRequestsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["reset-requests"],
    queryFn: async () => {
      const { data: reqs, error } = await supabase
        .from("password_reset_requests")
        .select("id, email, user_id, created_at")
        .eq("status", "pendiente")
        .order("created_at");
      if (error) throw error;
      const ids = reqs.map((r) => r.user_id).filter(Boolean) as string[];
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] };
      const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      return reqs.map((r) => ({ ...r, name: r.user_id ? names.get(r.user_id) ?? "" : "" }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4" />
          Pedidos de restablecimiento de contraseña
        </CardTitle>
        <CardDescription>
          Asigná una contraseña nueva y pasásela al colaborador por un canal seguro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">No hay pedidos pendientes.</p>
        ) : (
          data.map((r) => <RequestRow key={r.id} req={r} />)
        )}
      </CardContent>
    </Card>
  );
}

function RequestRow({
  req,
}: {
  req: { id: string; email: string; user_id: string | null; created_at: string; name: string };
}) {
  const qc = useQueryClient();
  const [password, setPassword] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["reset-requests"] });
    qc.invalidateQueries({ queryKey: ["reset-requests-count"] });
  };
  const reset = useMutation({
    mutationFn: () => adminResetPassword({ data: { requestId: req.id, password } }),
    onSuccess: () => {
      toast.success("Contraseña restablecida", { description: req.email });
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo restablecer"),
  });
  const dismiss = useMutation({
    mutationFn: () => dismissResetRequest({ data: { requestId: req.id } }),
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo descartar"),
  });

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{req.email}</p>
        <p className="text-xs text-muted-foreground">
          {req.name || (req.user_id ? "Sin nombre" : "Sin cuenta registrada")} ·{" "}
          {formatDate(req.created_at)}
        </p>
      </div>
      <Input
        type="text"
        placeholder={`Nueva contraseña (mín. ${MIN_PASSWORD_LENGTH})`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="md:w-56"
      />
      <Button
        size="sm"
        disabled={password.length < MIN_PASSWORD_LENGTH || reset.isPending}
        onClick={() => reset.mutate()}
      >
        {reset.isPending && <Loader2 className="size-4 animate-spin" />}
        Restablecer
      </Button>
      <Button size="sm" variant="outline" disabled={dismiss.isPending} onClick={() => dismiss.mutate()}>
        Descartar
      </Button>
    </div>
  );
}
