import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import EventSetupCard from "./EventSetupCard";

import { useNavigate } from "react-router-dom";
import { Button } from "../grupo 8/boton";


const EventConfigurationPage: React.FC = () => {
    const navigate = useNavigate();
    const breadcrumbs = [
		{ label: "Configuración", href: "/configuracion-evento" },
	];
    return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
        <div className="w-[100%] max-w-full mx-auto p-6  sm:p-6 md:p-10 dark:font-white rounded-lg">
                
            <div className="flex p-2 sm:p-2 sm:flex-row  sm:justify-between mb-6 gap-2 ">
                
                <h3 className="text-xl font-medium  ">Configuración del evento</h3>
                
            </div>

            <div className="grid gap-4 max-[500px]:gap-4 md:grid:gap-4:grid-cols-[repeat(auto-fill,minmax(370px,1fr))] min-w-[200px] mb-8  max-w-full">
                <EventSetupCard url="/settings/evaluations-status" field="open" title="Evaluación de Jurados" subtitle="Evaluar Participantes"/>
                <EventSetupCard url="/settings/show-evaluations" title="Habilitar Calificaciones" subtitle="Resultados de Evaluación"/>
                <EventSetupCard url="/settings/show-ranking" title="Ranking Público" subtitle="Habilitar Ranking Público"/>
                <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden  md:w-full shadow-sm ">
                <div className="border-b last:border-b-0">
                    <div className="w-full p-4 flex items-center justify-between transition-colors">
                        <div className="flex items-center ">
                            <span className="font-medium ">Apartado de Ponderación</span>
                        </div>
                    </div>
                    <div className="px-4 py-3  border-t">
                        <div className="flex items-center justify-between">   
                            <p className="text-sm ">Asigna pesos porcentuales a los jurados.</p> 
                            <div>
                                <Button
                                    className="bg-card border-2 hover:bg-accent hover:transition-colors  text-foreground cursor-pointer" 
                                    onClick={() => navigate("/ponderado-calificaciones")}
                                    >
                                        Ir a Ponderación
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            </div>
            
            

        </div>
        
    </LayoutAplication>
  );
};

export default EventConfigurationPage;