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

      <div
        className="flex flex-col items-center justify-center min-h-screen px-4 py-20 dark bg-black"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundSize: "150%",
          backgroundPosition: "center",
        }}
      >
        <Card className="w-full max-w-2xl shadow-lg rounded-lg p-6">
          <CardContent>
            <MultiStepWizard />
          </CardContent>
        </Card>
        <Toaster />
      </div>
      <TextSizeControls />
    </>
  );
};

export default TeamRegisterPage;
