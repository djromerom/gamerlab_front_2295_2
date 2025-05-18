import { useMultiForm } from "@/contexts/MultiFormContext";
import GameStep from "@/components/grupo 11/GameStep";
import MembersStep from "@/components/grupo 11/MembersStep";
import TeamStep from "@/components/grupo 11/TeamStep";

export default function StepRenderer() {
    const { step } = useMultiForm();
    switch (step) {
      case 1:
        return (
        <>
        
        <div className="flex text-2xl font-bold justify-between">
              <span>Inscripción del equipo</span>
              <div className="flex  max-w-50 w-full items-center">
                <div className="flex items-center justify-center rounded-full border-3 border-violet-500 w-8 h-8 ">
                  <span className="text-sm text-violet-500">1</span>
                </div>
                <div className="h-0.5 flex-auto bg-violet-500"></div>
                <div className="flex items-center justify-center rounded-full border-3 border-violet-500 w-8 h-8 ">
                  <span className="text-sm text-violet-500">2</span>
                </div>
                <div className="h-0.5 flex-auto bg-gradient-to-r from-violet-500 to-gray-100"></div>
                <div className="flex items-center justify-center rounded-full border border-gray-300 w-8 h-8 ">
                  <span className="text-sm text-gray-500">3</span>
                </div>
              </div>
            </div>
            
       <MembersStep />
       </>);
      case 2:
        return (
          <>
          
          <div className="flex text-2xl font-bold justify-between">
            <span>Inscripción de miembros</span>
            <div className="flex  max-w-50 w-full items-center">
              <div className="flex items-center justify-center rounded-full border-3 border-violet-500 w-8 h-8 ">
                <span className="text-sm text-violet-500">1</span>
              </div>
              <div className="h-0.5 flex-auto bg-violet-500"></div>
              <div className="flex items-center justify-center rounded-full border-3 border-violet-500 w-8 h-8 ">
                <span className="text-sm text-violet-500">2</span>
              </div>
              <div className="h-0.5 flex-auto bg-violet-500"></div>
              <div className="flex items-center justify-center rounded-full border-3 border-violet-500 w-8 h-8 ">
                <span className="text-sm text-violet-500">3</span>
              </div>
            </div>
          </div>
          <GameStep /></>);
      default:
        return (
        <>
        <div className="flex text-2xl font-bold justify-between">
          <span>Inscripción del videojuego</span>
          <div className="flex  max-w-50 w-full items-center">
            <div className="flex items-center justify-center rounded-full border-3 border-violet-500 w-8 h-8 ">
              <span className="text-sm text-violet-500">1</span>
            </div>
            <div className="h-0.5 flex-auto bg-gradient-to-r from-violet-500 to-gray-100"></div>
            <div className="flex items-center justify-center rounded-full border border-gray-300 w-8 h-8 ">
              <span className="text-sm text-gray-500">2</span>
            </div>
            <div className="h-0.5 flex-auto bg-gray-100"></div>
            <div className="flex items-center justify-center rounded-full border border-gray-300 w-8 h-8 ">
              <span className="text-sm text-gray-500">3</span>
            </div>
          </div>
        </div><TeamStep /></>);
    }
  }