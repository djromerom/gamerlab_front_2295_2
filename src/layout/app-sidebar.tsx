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

const MENU: Record<User["rol"], MenuItem[]> = {
  admin: [
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
  jurado: [],
  representante: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  return (
    user && (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground z-10">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <h1 className="text-xl font-bold transition-opacity group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:absolute">
              Arkad
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavContent menu={MENU[user.rol]} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  );
}
