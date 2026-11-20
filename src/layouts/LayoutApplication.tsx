"use client"

import { AppSidebar } from "@/layouts/AppSidebar"
import Breadcrumbs from "@/layouts/Breadcrumbs"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import PwaUpdateNotice from "@/features/pwa/components/PwaUpdateNotice"
import { PanelBackground } from "@/components/background/PanelBackground"

import type React from "react"

interface Props {
  children: React.ReactNode
  breadcrumbs: {
    label: string
    href: string
  }[]
}

const LayoutApplication: React.FC<Props> = ({ children, breadcrumbs }) => {
  return (
    <SidebarProvider>
      <PanelBackground />
      <AppSidebar />
      {/* ARK-222: en celular es transparente para dejar ver el degradado; en PC conserva el fondo liso del tema */}
      <SidebarInset id="sidebar-insert" className="relative min-w-0 overflow-x-hidden max-md:bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 z-20" />
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </header>
        <PwaUpdateNotice />
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

export default LayoutApplication;
