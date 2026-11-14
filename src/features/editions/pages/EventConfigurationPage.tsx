import type React from "react";
import LayoutApplication from "@/layouts/LayoutApplication";
import EventSetupCard from "@/features/editions/components/EventSetupCard";
import RegistrationsToggleCard from "@/features/editions/components/RegistrationsToggleCard";

import { useNavigate } from "react-router-dom";
import { GradingButton } from "@/features/grading/components/GradingButton";
import { useGlobalState } from "@/contexts/GlobalStateContext";


const EventConfigurationPage: React.FC = () => {
    const {canViewScores, canViewJudges, canViewRanking } = useGlobalState() // Placeholder for actual permission logic

    const navigate = useNavigate();
    const breadcrumbs = [
		{ label: "Configuración", href: "/configuracion-evento" },
	];
    return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
        <div className="md:bg-background text-foreground min-h-screen p-4 w-full">
                
            <div className="flex justify-between items-center mb-6 px-4">
                
                <h3 className="text-xl font-medium">Configuración del Evento</h3>
                
            </div>

            <div className="grid gap-4 max-[500px]:gap-4 md:grid:gap-4:grid-cols-[repeat(auto-fill,minmax(370px,1fr))] min-w-[200px] mb-8  max-w-full">
                <EventSetupCard value={canViewJudges} url="/settings/evaluations-status" field="open" title="Evaluación de Jurados" subtitle="Permite que los jurados califiquen a los equipos del evento."/>
                <EventSetupCard value={canViewScores} url="/settings/show-evaluations" title="Resultados de Evaluación" subtitle="Permite que los equipos vean las calificaciones que recibieron."/>
                <EventSetupCard value={canViewRanking} url="/settings/show-ranking" title="Ranking Público" subtitle="Hace visible el ranking general de los equipos para el público."/>
                <RegistrationsToggleCard />
                <div className="sm:flex-[0_1_10%] md:mb-6 space-y-2 border-2 rounded-lg overflow-hidden  md:w-full shadow-sm ">
                <div className="border-b last:border-b-0">
                    <div className="w-full p-4 flex items-center justify-between transition-colors">
                        <div className="flex items-center ">
                            <span className="font-medium ">Ponderación de Jurados</span>
                        </div>
                    </div>
                    <div className="px-4 py-3  border-t">
                        <div className="flex items-center justify-between">   
                            <p className="text-sm ">Define los pesos porcentuales asignados a cada jurado.</p> 
                            <div>
                                <GradingButton
                                    className="bg-card border-2 hover:bg-accent hover:transition-colors  text-foreground cursor-pointer" 
                                    onClick={() => navigate("/ponderado-calificaciones")}
                                    >
                                        Configurar Ponderación
                                </GradingButton>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            </div>
            
            

        </div>
        
    </LayoutApplication>
  );
};

export default EventConfigurationPage;