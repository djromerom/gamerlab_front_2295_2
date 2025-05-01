import React from "react";
import MultiStepWizard from "@/components/grupo 11/MultiStepWizard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import NavBar from "@/components/grupo 5/NavBar";

const TeamRegisterPage: React.FC = () => {
  return (
    <>
    <NavBar />
   
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4 py-20"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundSize: "150%",
        backgroundPosition: "center",
      }}
    >
      <Card className="w-full max-w-2xl shadow-lg rounded-lg p-6">
        <CardHeader>
          <CardTitle className="flex text-2xl font-bold justify-between">
            <span>Inscripción al torneo</span>
            <div className="flex  max-w-50 w-full items-center">
              <div className="flex items-center justify-center rounded-full border border-gray-300 w-8 h-8 ">
                <span className="text-sm text-gray-500">1</span>
              </div>
              <div className="h-0.5 flex-auto bg-gray-100"></div>
              <div className="flex items-center justify-center rounded-full border border-gray-300 w-8 h-8 ">
                <span className="text-sm text-gray-500">2</span>
              </div>
              <div className="h-0.5 flex-auto bg-gray-100"></div>
              <div className="flex items-center justify-center rounded-full border border-gray-300 w-8 h-8 ">
                <span className="text-sm text-gray-500">3</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultiStepWizard />
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default TeamRegisterPage;