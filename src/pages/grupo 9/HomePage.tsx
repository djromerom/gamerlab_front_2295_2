import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useAuth } from "@/contexts/AuthContext";
import darkLogo from "@/assets/Arkad Dark.svg";
import lightLogo from "@/assets/Arkad Light.svg";

import TeamCode from "@/components/grupo 5/TeamCode";
import VerificationCode from "@/components/grupo 5/VerificationCode";
import CircularProgress from "@/components/CircularProgress";

const HomePage: React.FC = () => {
  const { user } = useAuth();
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
          </div>
        </section>
        <section className="flex flex-col md:flex-row items-center gap-10 space-y-4">
            <TeamCode variant="title" />
            <VerificationCode />

        
            {/* custom size and colors */}
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
        </section>
      </section>
    </LayoutAplication>
  );
};

export default HomePage;
