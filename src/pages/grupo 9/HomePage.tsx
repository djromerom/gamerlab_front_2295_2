import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { useAuth } from "@/contexts/AuthContext";
import HomeStudentPage from "../grupo 5/HomeStudentPage";
import HomeTeacherPage from "../grupo 5/HomeTeacherPage";
import darkLogo from "@/assets/Arkad Dark.svg";
import lightLogo from "@/assets/Arkad Light.svg";

const HomePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <LayoutAplication breadcrumbs={[]}>
      {user?.role?.name === "Estudiante" && <HomeStudentPage />}
      {user?.role?.name === "Profesor" && <HomeTeacherPage />}
      {user?.role?.name !== "Estudiante" && user?.role?.name !== "Profesor" && (
        <section className="w-full flex items-center justify-center md:py-24 lg:py-24 xl:py-24">
          <div className="w-full max-w-4xl px-4 md:px-6 mx-auto text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
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
                Estamos encantados de tenerte, {user?.username}
              </p>
            </div>
          </div>
        </section>
      )}
    </LayoutAplication>
  );
};

export default HomePage;