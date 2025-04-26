"use client";

import darkLogo from "@/assets/Arkad Dark.svg";
import lightLogo from "@/assets/Arkad Light.svg";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";


export function Logo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                {/* Light mode logo */}
                <img src={darkLogo} alt="Logo Light" className="size-8 dark:hidden" />
                {/* Dark mode logo */}
                <img src={lightLogo} alt="Logo Dark" className="size-8 hidden dark:block" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-widest">
                  ARKAD
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default Logo;