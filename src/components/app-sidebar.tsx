import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Upload } from "lucide-react";

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
import { categoryIcon, fetchCategories } from "@/lib/kb";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Categorías de procesos</SidebarGroupLabel>
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
