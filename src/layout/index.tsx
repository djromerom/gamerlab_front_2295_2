import { AppSidebar } from "./app-sidebar";

import { SidebarProvider } from "@/components/ui/sidebar";

import type React from "react";

interface Props {
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
};
