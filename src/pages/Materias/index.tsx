import { Separator } from "@radix-ui/react-dropdown-menu";
import React, { useEffect, useState } from "react";
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

import { supabase } from "../../../supabase/client";

import { Data } from "../../components/Table";

export const Materias: React.FC = () => {
  const [data, setData] = useState<Data>({
    titulo: "",
    nombreColumnas: {},
    filas: [],
  });
  const filas: Data["nombreColumnas"] = {};
  const fetchMaterias = async () => {
    let { data: Materias, error } = await supabase.from("Materias").select("*");
    if (Materias) {
      const titulo = "Materias";
      const nombresColumnas = Object.keys(Materias[0]);
      nombresColumnas.forEach((col: string) => {
        filas[col] = col;
      });
      console.log(Materias);
      setData({
        titulo: "Materias",
        nombreColumnas: filas,
        filas: Materias,
      });
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

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
                  <BreadcrumbLink to="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Materias</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Tabla data={data} />
      </SidebarInset>
    </Layout>
  );
};
