import { Separator } from "@radix-ui/react-dropdown-menu";
import React from "react";
import { Tabla } from "../../components/Table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../../components/ui/breadcrumb";
import { SidebarInset, SidebarTrigger } from "../../components/ui/sidebar";
import { Layout } from "../../layout";

export const NRCS: React.FC = () => {
  return (
    <Layout>
      <SidebarInset id="sidebar-insert" className="relative">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 z-20" />
            <Separator className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink to="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>NRC's</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Tabla
          data={{
            titulo: "NRC's",
            nombreColumnas: {
              materia: "Materia",
              codigo: "Código",
              curso: "Curso",
            },
            filas: [
              { materia: "POO", codigo: "SIST1234", curso: "mañana" },
              {
                materia: "Estructura de Datos",
                codigo: "SIST2345",
                curso: "mañana",
              },
            ],
          }}
        />
      </SidebarInset>
    </Layout>
  );
};
