import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import {useState} from "react";
import { Switch } from "@/components/ui/switch.tsx"
import { ThemeProvider } from "../grupo 11/theme-provider";
import EventSetupCard from "./EventSetupCard";



const EventConfigurationPage: React.FC = () => {
    
    return (
    <LayoutAplication breadcrumbs={[]}>

        <div className="w-[85%] max-w-3xl mx-auto sm:p-6 md:p-10 dark:font-white rounded-lg">
                
            <div className="flex p-2 sm:p-2 sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
                
                <h3 className="text-lg font-bold  ">Configuracion del evento</h3>
                
            </div>

            <div className="md:grid:gap-4:grid-cols-[repeat(auto-fill,minmax(370px,1fr))] min-w-[300px] gap-4 mb-8 grid">
                <EventSetupCard url="/settings/evaluations-status?open=" title="Evaluacion de Jurados" subtitle="Habilitar notas a los equipos"/>
                <EventSetupCard url="/settings/public-results?open=" title="Resultados Publicos" subtitle="Mostrar resultados a los participantes"/>
                <EventSetupCard url="/settings/team-registration?open=" title="Resultados de Equipos" subtitle="Mostrar Calificaciones a los equipos"/>
            </div>
            

        </div>
        
            
    </LayoutAplication>
  );
};

export default EventConfigurationPage;