import React from "react";
import MultiStepWizard from "@/components/grupo 11/MultiStepWizard";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";
import { Toaster } from "sonner"
const TeamRegisterPage: React.FC = () => {
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
        <Toaster/>
      </div>
    </div>
    </>
  );
};

export default TeamRegisterPage;
