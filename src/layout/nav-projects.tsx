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
import { Link } from "react-router-dom";

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
  return menu.map((menuItem, index) => (
    <SidebarGroup key={index}>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0">
        {menuItem.title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {menuItem.items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild tooltip={item.name}>
              <Link to={item.url}>
                <item.icon />
                <span className="group-data-[collapsible=icon]:opacity-0">
                  {item.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  ));
};
