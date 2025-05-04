import React, { JSX } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/grupo 9/ProtectedRoute";
import LoginPage from "@/pages/grupo 9/LoginPage";
import ProfessorPage from "@/pages/grupo 11/ProfessorPage";
import JuryPage from "@/pages/grupo 11/JuryPage";
import ConsultantPage from "@/pages/grupo 11/ConsultantPage";
import UnauthorizedPage from "@/pages/grupo 9/UnauthorizedPage";
import TeamRegisterPage from "@/pages/grupo 11/TeamRegisterPage";
import TeamsPage from "@/pages/grupo 11/TeamsPage";
import LandingPage from "@/pages/grupo 5/LandingPage";
import RankingPage from "@/pages/grupo 5/RankingPage";
import InformationPage from "@/pages/grupo 5/InformationPage";
import HomePage from "@/pages/grupo 9/HomePage";
import SubjetsPage from "@/pages/grupo 9/SubjetsPage";
import CriteriaPage from "@/pages/grupo 9/CriterionPage";
import StatisticsPage from "@/pages/grupo 1/StatisticsPage";
import NrcsPage from "@/pages/grupo 9/NrcsPage";
import { VerificationPage } from "@/pages/grupo 9/VerificationPage";

type Role = "Profesor" | "Administrador" | "Jurado" | "Consultor";

interface RouteConfig {
  path: string;
  element: JSX.Element;
  roles?: Role[];
}

const routes: RouteConfig[] = [
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/profesor",
    element: <ProfessorPage />,
    roles: ["Profesor", "Administrador"],
  },
  { path: "/jurado", element: <JuryPage />, roles: ["Jurado"] },
  {
    path: "/consultor",
    element: <ConsultantPage />,
    roles: ["Consultor"],
  },
  {
    path: "/registro-equipo",
    element: <TeamRegisterPage />,
  },
  {
    path: "/equipos",
    element: <TeamsPage />,
  },
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/ranking",
    element: <RankingPage />,
  },
  {
    path: "/informacion",
    element: <InformationPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/inicio",
    element: <HomePage />,
    roles: ["Profesor", "Administrador", "Consultor", "Jurado"],
  },
  {
    path: "/estadisticas",
    element: <StatisticsPage />,
    roles: ["Administrador"],
  },
  { path: "/materias", element: <SubjetsPage />, roles: ["Administrador"] },
  { path: "/nrcs", element: <NrcsPage />, roles: ["Administrador"] },
  { path: "/criterios", element: <CriteriaPage />, roles: ["Administrador"] },
  {
    path: "/verificar-cuenta/:id",
    element: <VerificationPage />,
  },
];

const RoutesConfiguration: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route) => {
          if (route.roles) {
            return (
              <Route element={<ProtectedRoute roles={route.roles} />}>
                <Route path={route.path} element={route.element} />
              </Route>
            );
          }
          return (
            <Route key={route.path} path={route.path} element={route.element} />
          );
        })}
      </Routes>
    </BrowserRouter>
  );
};

export default RoutesConfiguration;
