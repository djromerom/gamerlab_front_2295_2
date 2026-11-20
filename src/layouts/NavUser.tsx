"use client";

import { ChevronsUpDown, LogOut, Home } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "@/types/auth";
import { useNavigate } from "react-router-dom";

interface Props {
  user: UserProfile;
}

export const NavUser: React.FC<Props> = ({ user }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // [MODIFICADO]: "Salir" lleva al login limpio, también desde pantallas no protegidas (BG-08)
  // [ANTES]: Solo cerraba la sesión y dejaba al usuario en la misma página
  const handleLogout = async () => {
    setOpenMobile(false);
    await logout();
    navigate("/login", { replace: true });
  };

  // ARK-222: en celular el menú vive dentro del panel lateral (Sheet). Si se navega con los dos abiertos, Radix deja
  // el <body> con pointer-events: none y la página queda bloqueada. Se cierra el panel y se navega en el siguiente ciclo.
  const irAPaginaPrincipal = () => {
    setOpenMobile(false);
    window.setTimeout(() => navigate("/"), 0);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={""}
                  alt={user.firstName + " " + user.lastName}
                />
                <AvatarFallback className="rounded-lg">
                  {user.firstName.slice(0, 1).toUpperCase() +
                    user.lastName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.firstName + " " + user.lastName}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={""}
                    alt={user.firstName + " " + user.lastName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.firstName.slice(0, 1).toUpperCase() +
                      user.lastName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.firstName + " " + user.lastName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer" 
              onClick={irAPaginaPrincipal}
            >
              <Home />
              Página Principal
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              <LogOut />
              Salir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
