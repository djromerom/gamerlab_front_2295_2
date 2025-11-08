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
import JuryManagementPage from "@/pages/grupo 12/JuryManagementPage";
import PendingGradesPage from "@/pages/grupo 8/PendingGradesPage";
import RatePage from "@/pages/grupo 8/RatePage";
import GradedPage from "@/pages/grupo 8/GradedPage";
import NrcsPage from "@/pages/grupo 9/NrcsPage";
import { VerifyEmailPage } from "@/pages/grupo 9/VerificationPage";
import { ProfessorsPage } from "@/pages/grupo 9/professorsPage";
import HomeStudentPage from "@/pages/grupo 5/HomeStudentPage";
import HomeTeacherPage from "@/pages/grupo 5/HomeTeacherPage";
import CreditsPage from "@/pages/grupo 5/CreditsPage";
import EditTeamPage from "@/pages/grupo 5/EditTeamPage";
import ForgetPassword from "@/pages/grupo 9/ForgetPassword";
import ResetPassword from "@/pages/grupo 9/ResetPassword";
import { ManualAssignmentPage } from "@/pages/grupo 12/ManualAssignment";

type Role =
  | "Profesor"
  | "Administrador"
  | "Jurado"
  | "Consultor"
  | "Estudiante";

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
    roles: ["Administrador", "Profesor"],
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
    path: "/contribuidores",
    element: <CreditsPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/OlvidastePassword",
    element: <ForgetPassword />
  },
  {
    path: "/establecer-contrasena",
    element: <ResetPassword />,
  },
  {
    path: "/inicio",
    element: <HomePage />,
    roles: ["Profesor", "Administrador", "Estudiante", "Consultor", "Jurado"],
  },
  {
    path: "/estadisticas",
    element: <StatisticsPage />,
    roles: ["Administrador"],
  },
  {
    path: "/jurados",
    element: <JuryManagementPage />,
    roles: ["Administrador"],
  },
  {
    path: "/asignacion-jurados",
    element: <ManualAssignmentPage />,
    roles: ["Administrador"],
  },
  { path: "/materias", element: <SubjetsPage />, roles: ["Administrador"] },
  {
    path: "/pendientes-calificar",
    element: <PendingGradesPage />,
    roles: ["Jurado"],
  },
  {
    path: "/pendientes-calificar/:id",
    element: <RatePage />,
    roles: ["Jurado"],
  },
  { path: "/calificados", element: <GradedPage />, roles: ["Jurado"] },

  { path: "/nrcs", element: <NrcsPage />, roles: ["Administrador"] },
  { path: "/criterios", element: <CriteriaPage />, roles: ["Administrador"] },
  {
    path: "/profesores",
    element: <ProfessorsPage />,
    roles: ["Administrador"],
  },
  {
    path: "/verificar-cuenta",
    element: <VerifyEmailPage />,
  },
  {
    path: "/mi-equipo",
    element: <HomeStudentPage />,
    roles: ["Estudiante", "Profesor"],
  },
  {
    path: "/home-profesor",
    element: <HomeTeacherPage />, 
    roles: ["Profesor"],
  },
  {
    path: "/editar-equipo",
    element: <EditTeamPage />,
    roles: ["Estudiante"],
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
