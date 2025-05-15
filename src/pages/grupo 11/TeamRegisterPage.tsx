import React from "react";
import MultiStepWizard from "@/components/grupo 11/MultiStepWizard";
import { Card, CardContent } from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";

const TeamRegisterPage: React.FC = () => {
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
      </div>
    </>
  );
};

export default TeamRegisterPage;
