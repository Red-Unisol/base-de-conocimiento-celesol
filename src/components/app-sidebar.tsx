import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Gavel, Home, Scale, Upload, Users, Bot, FileText } from "lucide-react";
import unisolIcon from "@/assets/unisol-icon.png.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { categoryIcon, fetchCategories } from "@/lib/kb";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const isAdmin = useIsAdmin();



  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2.5">
          <img src={unisolIcon.url} alt="UNISOL" className="size-8 shrink-0 rounded-full" />
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight">UNISOL</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Unión Solidaria
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Inicio">
                  <Link to="/">
                    <Home />
                    <span>Inicio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === "/aportes"} tooltip="Aportes de asistentes"><Link to="/aportes"><Bot /><span>Aportes de asistentes</span></Link></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Políticas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/politicas") && !pathname.startsWith("/politicas/legales") && !pathname.startsWith("/politicas/cancelacion")} tooltip="Políticas de riesgo">
                  <Link to="/politicas">
                    <Scale />
                    <span>Políticas de riesgo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/politicas/legales")} tooltip="Políticas de legales">
                  <Link to="/politicas/legales">
                    <Gavel />
                    <span>Políticas de legales</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/politicas/cancelacion")} tooltip="Políticas de cancelación">
                  <Link to="/politicas/cancelacion"><FileText /><span>Políticas de cancelación</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Procesos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(categories.data ?? []).map((cat) => {
                const Icon = categoryIcon(cat.icon);
                return (
                  <SidebarMenuItem key={cat.slug}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/categoria/${cat.slug}`}
                      tooltip={cat.name}
                    >
                      <Link to="/categoria/$slug" params={{ slug: cat.slug }}>
                        <Icon />
                        <span>{cat.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {isAdmin.data && (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/admin"}
                tooltip="Cargar material"
              >
                <Link to="/admin">
                  <Upload />
                  <span>Cargar material</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/admin/politicas"}
                tooltip="Administrar políticas"
              >
                <Link to="/admin/politicas">
                  <Scale />
                  <span>Administrar políticas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/admin/usuarios"}
                tooltip="Usuarios"
              >
                <Link to="/admin/usuarios">
                  <Users />
                  <span>Usuarios</span>
                  <PendingResetBadge />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

    </Sidebar>
  );
}

function PendingResetBadge() {
  const { data } = useQuery({
    queryKey: ["reset-requests-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("password_reset_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendiente");
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
  if (!data) return null;
  return (
    <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
      {data}
    </span>
  );
}
