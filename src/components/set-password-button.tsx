import { useMutation } from "@tanstack/react-query";
import { KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-reset";
import { adminSetUserPassword } from "@/lib/users.functions";

export function SetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const m = useMutation({
    mutationFn: () => adminSetUserPassword({ data: { userId, password } }),
    onSuccess: () => {
      toast.success("Contraseña cambiada", { description: email });
      setOpen(false);
      setPassword("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo cambiar"),
  });
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <KeyRound className="size-4" />
        Cambiar contraseña
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
            <DialogDescription>{email}</DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            placeholder={`Nueva contraseña (mín. ${MIN_PASSWORD_LENGTH})`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <DialogFooter>
            <Button
              disabled={password.length < MIN_PASSWORD_LENGTH || m.isPending}
              onClick={() => m.mutate()}
            >
              {m.isPending && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
