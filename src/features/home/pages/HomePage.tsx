import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useAuth } from "@/contexts/AuthContext";
import darkLogo from "@/assets/Arkad Dark.svg";
import lightLogo from "@/assets/Arkad Light.svg";

import TeamCode from "@/components/grupo 5/TeamCode";
import VerificationCode from "@/features/teams/components/VerificationCode";
import CircularProgress from "@/components/CircularProgress";
import { JurorPresenceNotice } from "@/components/juror-presence/JurorPresenceNotice";
import { JurorSurveyAccess } from "@/components/juror-survey/JurorSurveyAccess";
import { PwaInstallNotice } from "@/features/pwa/components/PwaInstallNotice";
import { Navigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const { user, userRole } = useAuth();
  if (userRole === "Staff") {
    return <Navigate to="/check-in-jurados" replace />;
  }
  // HU-33: el presentador externo solo tiene su panel (el back le niega todo lo demás)
  if (userRole === "Presentador externo") {
    return <Navigate to="/mi-registro" replace />;
  }
  return (
    <LayoutAplication breadcrumbs={[]}>
      <section className="flex flex-col justify-evenly items-center w-full h-full min-w-[250px]">
        <section className=" flex flex-col gap-[8rem] container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex items-center justify-center">
              <img
                src={darkLogo}
                alt="Logo Light"
                className="w-64 h-64 dark:hidden"
              />
              <img
                src={lightLogo}
                alt="Logo Dark"
                className="w-64 h-64 hidden dark:block"
              />

            </div>
            <h1 className="text-3xl text-foreground font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              ¡Bienvenido a Arkad!
            </h1>
            
            <p className="mx-auto max-w-[700px] text-foreground md:text-xl">
              Estamos encantados de tenerte, {user?.firstName}
            </p>
            <JurorPresenceNotice className="mx-auto max-w-[700px] text-left" />
            {/* ARK-198: invitar al jurado a instalar ARKAD en el celular */}
            {userRole === "Jurado" && (
              <PwaInstallNotice className="mx-auto w-full max-w-[700px] text-left" />
            )}
            {/* HU-17: acceso a la encuesta mientras el jurado no la haya respondido */}
            {(userRole === "Jurado" || userRole === "Profesor") && (
              <JurorSurveyAccess className="mx-auto w-full max-w-[700px] text-left" />
            )}
          </div>
        </section>
        <section className="flex flex-col md:flex-row items-center gap-10 space-y-4">
            <TeamCode variant="title" />
            <VerificationCode />

        
            {/* custom size and colors */}
            {userRole === "Estudiante" && (
            <CircularProgress
            size={140}
            strokeWidth={14}
            trackClass="text-gray-200"
            progressClass="text-emerald-500"
            labelFormatter={(r, t) => (
            <div>
            <div className="text-sm font-bold">{r}/{t}</div>
            <div className="text-xs text-gray-500">Recibidas</div>
            </div>
            )}
            />
            )}
        </section>
      </section>
    </LayoutAplication>
  );
};

export default HomePage;
