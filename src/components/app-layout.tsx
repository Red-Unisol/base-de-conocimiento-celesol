import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { touchLastSeen } from "@/lib/users";

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();

  useEffect(() => {
    if (user?.id) void touchLastSeen(user.id);
  }, [user?.id]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm font-semibold tracking-tight">
              Base de Conocimiento Institucional
            </span>
            <div className="ml-auto flex items-center gap-2">
              {user?.email && (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {user.email}
                </span>
              )}
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="size-4" />
                Salir
              </Button>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
            UNISOL Unión Solidaria · Documentación interna de procesos
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
