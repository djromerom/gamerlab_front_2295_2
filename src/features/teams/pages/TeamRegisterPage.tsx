import React, { useEffect } from "react";
import MultiStepWizard from "@/features/teams/components/registration/MultiStepWizard";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";
import { Toaster } from "sonner"
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { FondoArkad } from "@/components/fondo/FondoArkad";

const TeamRegisterPage: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);
  return (
    <>
    <NavBar />
    <div className="relative min-h-screen dark overflow-hidden">
      <FondoArkad modo="lento" estiloNuevo />
      <div
        className="relative flex flex-col z-10 items-center justify-center min-h-screen pt-18 dark overflow-hidden "
      >
        <Card className="w-full z-10 max-w-2xl shadow-lg rounded-lg p-6 bg-black/50 ">
          <CardContent>
            <MultiStepWizard />
          </CardContent>
        </Card>
        <Toaster />
      </div>
      <TextSizeControls />
    </div>
  </>
  );
};

export default TeamRegisterPage;
