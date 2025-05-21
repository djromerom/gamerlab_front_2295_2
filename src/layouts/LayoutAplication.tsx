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
          richColors={false}
          toastOptions={{
            unstyled: true,
            classNames: {
              default: 'bg-[var(--background)] border border-[var(--border)] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md w-[356px]',
              success: 'bg-[var(--toast-success)] border border-[var(--toast-success-border)] w-[356px] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md',
              error: 'bg-[var(--toast-error)] border border-[var(--toast-error-border)] w-[356px] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md',
              info: 'bg-[var(--background)] border border-[var(--border)] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md w-[356px]',
              loading: 'bg-[var(--background)] border border-[var(--border)] text-foreground flex flex-justify gap-2 items-center px-3 py-3 rounded-md shadow-md w-[356px]',
              // ...
            },
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LayoutAplication;
