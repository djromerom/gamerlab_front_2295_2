"use client";

import type * as React from "react";
import {
  LibraryBig,
  Binary,
  BookCheck,
  FileUser,
  Gavel,
  GalleryVerticalEnd,
  ChartLine,
} from "lucide-react";
import { type MenuItem, NavContent } from "./nav-projects";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "../components/ui/sidebar";
import { useAuthContext, type User } from "../context/AuthContext";
import Logo from "@/components/ui/logo";
import ThemeToggleSwitch from "../components/ui/theme-toggle-switch";

const MENU: Record<User["id_rol"], MenuItem[]> = {
  1: [
    {
      title: "Gestión de Materias y NRC",
      items: [
        {
          name: "Materias",
          url: "/materias",
          icon: LibraryBig,
        },
        {
          name: "NRC's",
          url: "/nrcs",
          icon: Binary,
        },
      ],
    },
    {
      title: "Criterios de Calificación",
      items: [
        {
          name: "Criterios de Calificación",
          url: "/criterios",
          icon: BookCheck,
        },
      ],
    },
    {
      title: "Personal",
      items: [
        {
          name: "Profesores",
          url: "/profesores",
          icon: FileUser,
        },
        {
          name: "Jurados",
          url: "/jurados",
          icon: Gavel,
        },
      ],
    },
    {
      title: "Panel",
      items: [
        {
          name: "Estadisticas",
          url: "/estadisticas",
          icon: ChartLine,
        },
      ],
    },
  ],
  2: [],
  3: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  console.log(user, "app sidebar");
  return (
    user && (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <NavContent menu={MENU[user.id_rol]} />
        </SidebarContent>
        <ThemeToggleSwitch />
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  );
}
