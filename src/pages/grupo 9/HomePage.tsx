import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useAuth } from "@/contexts/AuthContext";
import darkLogo from "@/assets/Arkad Dark.svg";
import lightLogo from "@/assets/Arkad Light.svg";

const HomePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <LayoutAplication breadcrumbs={[]}>
      <section className="w-full md:py-24 lg:py-24 xl:py-24">
        <div className="container px-4 md:px-6">
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
        </div>
      </section>
    </LayoutAplication>
  );
};

export default HomePage;
