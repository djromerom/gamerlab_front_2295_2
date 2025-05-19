import React, { useEffect } from "react";
import MultiStepWizard from "@/components/grupo 11/MultiStepWizard";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";
import { Toaster } from "sonner"
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";

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
    <div className="relative min-h-screen dark bg-[#060312] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat animate-float"
        style={{
          backgroundImage: "url('/background.webp')",
        }}
      ></div>
      <div
        className="flex flex-col z-10 items-center justify-center min-h-screen pt-18 dark overflow-hidden "
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
