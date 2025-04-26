"use client";

import type React from "react";

import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../components/ui/sidebar";
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
  const location = useLocation(); // <= Aquí

  return menu.map((menuItem, index) => (
    <SidebarGroup key={index}>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0">
        {menuItem.title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {menuItem.items.map((item) => {
          const isActive = location.pathname === item.url;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                className={isActive
                  ? "bg-[#6644FF] text-[#FAFAFA] dark:bg-[#B3C7FF] dark:text-[#110D20] hover:bg-[#5A3BE5] hover:text-[#FAFAFA] dark:hover:bg-[#A6BCFF] hover:dark:text-[[#110D20]]"
                  : "hover:bg-muted hover:dark:bg-muted/10"} 
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

