"use client";

import type * as React from "react";
import {
  LibraryBig,
  Binary,
  BookCheck,
  FileUser,
  Gavel,
  ChartLine,
  Sliders,
  Users,
  Book,
  Settings,
  UniversityIcon,
  Trophy,
  CalendarRange,
  IdCard,
  House,
  QrCode,
  ClipboardCheck,
  UserPlus,
  UserCheck,
  Bell,
  MessageSquareHeart,
  Presentation,
  Smartphone,
  LifeBuoy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { NavUser } from "@/layouts/NavUser";
import { MenuItem, NavContent } from "@/layouts/NavContent";
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
import { WorkingEditionBadge } from "@/components/WorkingEditionBadge";

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
        { name: "Equipos Inscritos", url: "/equipos-inscritos", icon: Users },
        // { name: "Ponderado Calificaciones", url: "/ponderado-calificaciones", icon: Sliders  },
        { name: "Criterios de Calificación", url: "/criterios", icon: BookCheck, },
        { name: "Configuración de Evento", url: "/configuracion-evento", icon: Settings },
        { name: "Ediciones", url: "/gestionar-ediciones", icon: CalendarRange },
        { name: "Tiebreaker", url: "/tiebreaker", icon: Trophy },
      ],
    },
    {
      title: "Personal",
      items: [
        { name: "Profesores", url: "/profesores", icon: FileUser },
        { name: "Jurados", url: "/jurados", icon: Users },
        { name: "Jurados de la Edición", url: "/jurados-edicion", icon: UserCheck },
        { name: "Asignación de Jurados", url: "/jurados-assignment", icon: Gavel },
        { name: "Escarapelas", url: "/escarapelas", icon: IdCard },
        { name: "Check-in de Jurados", url: "/check-in-jurados", icon: QrCode },
        { name: "Asistencia de Jurados", url: "/asistencia-jurados", icon: ClipboardCheck },
        { name: "Cuentas Staff", url: "/cuentas-staff", icon: UserPlus },
        { name: "Presentadores externos", url: "/presentadores-externos", icon: Presentation },
        { name: "Panel de Seguimiento", url: "/realtime-tracking-panel", icon: ChartLine },
        { name: "Contingencia con suplentes", url: "/contingencia-suplentes", icon: LifeBuoy },
        { name: "Notas Finales", url: "/notas-finales", icon: BookCheck },
        { name: "Encuesta de Jurados", url: "/encuesta-jurados", icon: MessageSquareHeart },
      ],
    },
    {
      title: "Cuenta",
      items: [{ name: "Notificaciones", url: "/notificaciones", icon: Bell }],
    },
  ],
  Jurado: [
    {
      title: "Proyectos",
      items: [
        {
          name: "Pendientes por calificar",
          url: "/pendientes-calificar",
          icon: LibraryBig,
        },
        { name: "Calificados", url: "/calificados", icon: Binary },
      ],
    },
    {
      title: "Cuenta",
      items: [
        { name: "Instalar ARKAD", url: "/instalar-app", icon: Smartphone },
        { name: "Notificaciones", url: "/notificaciones", icon: Bell },
      ],
    },
  ],
  Profesor: [
    {
      title: "Proyectos",
      items: [
        {
          name: "Calificaciones Uninorte",
          url: "/home-profesor",
          icon: UniversityIcon
        },
        {
          name: "Equipos por Evaluar",
          url: "/colegios-calificar",
          icon: Book
        },
        {
          // [MODIFICADO]: Renombrado para reflejar que ahora se evalúan también equipos universitarios.
          // [ANTES]: "Colegios Evaluados"
          name: "Equipos Evaluados",
          url: "/colegios-evaluados",
          icon: BookCheck
        },
      ],

    },
    {
      title: "Seguimiento",
      items: [
        { name: "Avance por hora", url: "/realtime-tracking-panel", icon: ChartLine },
      ],
    },
    {
      title: "Cuenta",
      items: [{ name: "Notificaciones", url: "/notificaciones", icon: Bell }],
    },
  ],
  Estudiante: [
    {
      title: "Información",
      items: [
        // HU-19: el inicio muestra el código de verificación que el estudiante le da al jurado
        {
          name: "Inicio",
          url: "/inicio",
          icon: House,
        },
        {
          name: "Mis Calificaciones",
          url: "/mi-equipo",
          icon: LibraryBig,
        },
        {
          name: "Mis Jurados",
          url: "/mis-jurados",
          icon: Gavel,
        },
        {
          name: "Editar equipo",
          url: "/editar-equipo",
          icon: FileUser,
        },
      ],
    },
  ],
  Consultor: [
    {
      title: "Información",
      items: [
        {
          name: "Mi equipo",
          url: "/mi-equipo",
          icon: LibraryBig,
        },
      ],
    },
  ],
  Staff: [
    {
      title: "Mesa de escarapelas",
      items: [
        { name: "Registrar llegada", url: "/check-in-jurados", icon: QrCode },
        { name: "Asistencia de jurados", url: "/asistencia-jurados", icon: ClipboardCheck },
      ],
    },
  ],
  // HU-33: solo su registro; el back le responde 403 en todo lo demás
  "Presentador externo": [
    {
      title: "Feria",
      items: [{ name: "Mi registro", url: "/mi-registro", icon: Presentation }],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, userRole } = useAuth();

  if (!user || !userRole || !MENU[userRole]) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link to="/">
          <Logo />
        </Link>
        {/* ARK-130 (HU-27): la edición sobre la que trabaja el administrador */}
        {userRole === "Administrador" && <WorkingEditionBadge />}
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
