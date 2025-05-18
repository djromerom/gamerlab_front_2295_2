"use client"

import { AppSidebar } from "@/components/grupo 9/app-sidebar"
import Breadcrumbs from "@/components/grupo 9/BreadCrums"
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

import type React from "react"

interface Props {
  children: React.ReactNode
  breadcrumbs: {
    label: string
    href: string
  }[]
}

const LayoutAplication: React.FC<Props> = ({ children, breadcrumbs }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset id="sidebar-insert" className="relative">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 z-20" />
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <TextSizeControls />
        </header>
        {children}
        
        <Toaster
          toastOptions={{
            className: "bg-white text-black dark:bg-blue dark:text-white",
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LayoutAplication;
