import { useMultiForm } from "@/features/teams/contexts/MultiFormContext";
import GameStep from "@/features/teams/components/registration/GameStep";
import MembersStep from "@/features/teams/components/registration/MembersStep";
import TeamStep from "@/features/teams/components/registration/TeamStep";
import LinksStep from "@/features/teams/components/registration/LinksStep";

export default function StepRenderer() {
    const { step } = useMultiForm();
    
    // Función para renderizar los círculos de progreso
    const renderProgressCircles = () => {
      return (
        <div className="flex max-w-60 w-full items-center">
          {/* Paso 1 */}
          <div className={`flex items-center justify-center rounded-full border-3 w-8 h-8 ${
            step >= 0 ? 'border-violet-500' : 'border-gray-300'
          }`}>
            <span className={`text-sm ${step >= 0 ? 'text-violet-500' : 'text-gray-500'}`}>1</span>
          </div>
          
          {/* Línea 1-2 */}
          <div className={`h-0.5 flex-auto ${
            step >= 1 ? 'bg-violet-500' : 'bg-gray-300'
          }`}></div>
          
          {/* Paso 2 */}
          <div className={`flex items-center justify-center rounded-full border-3 w-8 h-8 ${
            step >= 1 ? 'border-violet-500' : 'border-gray-300'
          }`}>
            <span className={`text-sm ${step >= 1 ? 'text-violet-500' : 'text-gray-500'}`}>2</span>
          </div>
          
          {/* Línea 2-3 */}
          <div className={`h-0.5 flex-auto ${
            step >= 2 ? 'bg-violet-500' : 'bg-gray-300'
          }`}></div>
          
          {/* Paso 3 */}
          <div className={`flex items-center justify-center rounded-full border-3 w-8 h-8 ${
            step >= 2 ? 'border-violet-500' : 'border-gray-300'
          }`}>
            <span className={`text-sm ${step >= 2 ? 'text-violet-500' : 'text-gray-500'}`}>3</span>
          </div>
          
          {/* Línea 3-4 */}
          <div className={`h-0.5 flex-auto ${
            step >= 3 ? 'bg-violet-500' : 'bg-gray-300'
          }`}></div>
          
          {/* Paso 4 */}
          <div className={`flex items-center justify-center rounded-full border-3 w-8 h-8 ${
            step >= 3 ? 'border-violet-500' : 'border-gray-300'
          }`}>
            <span className={`text-sm ${step >= 3 ? 'text-violet-500' : 'text-gray-500'}`}>4</span>
          </div>
        </div>
      );
    };

    switch (step) {
      case 0:
        return (
          <>
            <div className="flex text-2xl font-bold justify-between">
              <span>Inscripción del Equipo</span>
              {renderProgressCircles()}
            </div>
            <TeamStep />
          </>
        );
      
      case 1:
        return (
          <>
            <div className="flex text-2xl font-bold justify-between">
              <span>Inscripción de Miembros</span>
              {renderProgressCircles()}
            </div>
            <MembersStep />
          </>
        );
      
      case 2:
        return (
          <>
            <div className="flex text-2xl font-bold justify-between">
              <span>Inscripción del Videojuego</span>
              {renderProgressCircles()}
            </div>
            <GameStep />
          </>
        );
      
      case 3:
        return (
          <>
            <div className="flex text-2xl font-bold justify-between">
              <span>Enlaces Opcionales</span>
              {renderProgressCircles()}
            </div>
            <LinksStep />
          </>
        );
      
      default:
        return (
          <>
            <div className="flex text-2xl font-bold justify-between">
              <span>Inscripción del Equipo</span>
              {renderProgressCircles()}
            </div>
            <TeamStep />
          </>
        );
    }
  }