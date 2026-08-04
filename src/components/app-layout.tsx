import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
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
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">
                  <LogIn className="size-4" />
                  Ingresar
                </Link>
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
