"use client";

import type React from "react";

import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

export interface MenuItem {
  title: string;
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}

interface Props {
  menu: MenuItem[];
}

export const NavContent: React.FC<Props> = ({ menu }) => {
  const location = useLocation();

  return menu.map((menuItem, index) => (
    <SidebarGroup key={index}>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0">
        {menuItem.title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {menuItem.items.map((item, i) => {
          const isActive = location.pathname === item.url;

          return (
            <SidebarMenuItem key={`${item.name}-${i}`}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                className={`${isActive
                    ? "bg-[var(--selected)] text-[var(--selected-foreground)] hover:bg-[var(--selected-hover)] hover:text-[var(--selected-foreground)] font-semibold"
                    : "hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  } transition-colors`}
              >
                <Link to={item.url}>
                  <item.icon />
                  <span className="group-data-[collapsible=icon]:opacity-0">
                    {item.name}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  ));
};
