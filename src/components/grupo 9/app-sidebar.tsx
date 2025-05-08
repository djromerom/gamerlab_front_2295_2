"use client";

import type * as React from "react";
import {
  LibraryBig,
  Binary,
  BookCheck,
  FileUser,
  Gavel,
  ChartLine,
} from "lucide-react";
import { NavUser } from "@/components/grupo 9/nav-user";
import { MenuItem, NavContent } from "@/components/grupo 9/nav-projects";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/logo";
import ThemeToggleSwitch from "@/components/ui/theme-toggle-switch";
import { Role } from "@/types/auth";

const MENU: Record<Role, MenuItem[]> = {
  Administrador: [
    {
      title: "Panel",
      items: [{ name: "Estadísticas", url: "/estadisticas", icon: ChartLine }],
    },
    {
      title: "Gestión General",
      items: [
        { name: "Materias", url: "/materias", icon: LibraryBig },
        { name: "NRC's", url: "/nrcs", icon: Binary },
        {
          name: "Criterios de Calificación",
          url: "/criterios",
          icon: BookCheck,
        },
        { name: "Profesores", url: "/profesores", icon: FileUser },
      ],
    },
    {
      title: "Personal",
      items: [
        { name: "Profesor", url: "/profesor", icon: FileUser },
        { name: "Jurados", url: "/jurados", icon: Gavel },
      ],
    },
  ],
  Jurado: [
    {
      title: "Proyectos",
      items: [
        {
          name: "Pendientes por calificar",
          url: "/pendientes",
          icon: LibraryBig,
        },
        { name: "Calificados", url: "/calificados", icon: Binary },
        { name: "Proyectos", url: "/proyectos", icon: Binary },
      ],
    },
  ],
  Profesor: [],
  Estudiante: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, userRole } = useAuth();

  if (!user || !userRole || !MENU[userRole]) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <NavContent menu={MENU[userRole]} />
      </SidebarContent>
      <ThemeToggleSwitch />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
