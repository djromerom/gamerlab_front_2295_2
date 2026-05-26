import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import EventConfigurationPage from "@/components/grupo 9/EventConfigurationPage.tsx";
import { ProtectedRoute } from "@/components/grupo 9/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { JuradosAssignment } from "@/pages/JuradosAssignment";
import EditionsManagementPage from "@/pages/admin/EditionsManagementPage";
import GamePlayerPage from "@/pages/gameplayer/GamePlayerPage";
import StatisticsPage from "@/pages/grupo 1/StatisticsPage";
import ConsultantPage from "@/pages/grupo 11/ConsultantPage";
import JuryPage from "@/pages/grupo 11/JuryPage";
import ProfessorPage from "@/pages/grupo 11/ProfessorPage";
import JuryManagementPage from "@/pages/grupo 12/JuryManagementPage";
import CreditsPage from "@/pages/grupo 5/CreditsPage";
import EditTeamPage from "@/pages/grupo 5/EditTeamPage";
import FeriasPasadas from "@/pages/grupo 5/FeriasPasadas";
import HomeStudentPage from "@/pages/grupo 5/HomeStudentPage";
import HomeTeacherPage from "@/pages/grupo 5/HomeTeacherPage";
import InformationPage from "@/pages/grupo 5/InformationPage";
import LandingPage from "@/pages/grupo 5/LandingPage";
import RankingPage from "@/pages/grupo 5/RankingPage";
import BatchRatePage from "@/pages/grupo 8/BatchRatePage";
import GradedPage from "@/pages/grupo 8/GradedPage";
import PendingGradesPage from "@/pages/grupo 8/PendingGradesPage";
import PendingSchoolGradesPage from "@/pages/grupo 8/PendingSchoolGradesPage";
import RatePage from "@/pages/grupo 8/RatePage";
import SchoolGradesPage from "@/pages/grupo 8/SchoolGradesPage";
import SchoolRate from "@/pages/grupo 8/SchoolRate";
import AuthErrorPage from "@/pages/grupo 9/AuthErrorPage";
import CriteriaPage from "@/pages/grupo 9/CriterionPage";
import ForgetPassword from "@/pages/grupo 9/ForgetPassword";
import GradeWeightsPage from "@/pages/grupo 9/GradeWeightsPage";
import HomePage from "@/pages/grupo 9/HomePage";
import LoginPage from "@/pages/grupo 9/LoginPage";
import NrcsPage from "@/pages/grupo 9/NrcsPage";
import ResetPassword from "@/pages/grupo 9/ResetPassword";
import SubjetsPage from "@/pages/grupo 9/SubjetsPage";
import TeamsManagementPage from "@/pages/grupo 9/TeamsManagementPage";
import TiebreakerPage from "@/pages/grupo 9/TiebreakerPage";
import UnauthorizedPage from "@/pages/grupo 9/UnauthorizedPage";
import { VerifyEmailPage } from "@/pages/grupo 9/VerificationPage";
import { ProfessorsPage } from "@/pages/grupo 9/professorsPage";
import TeamRegisterPage from "@/pages/teams/TeamRegisterPage";
import VideogamesPage from "@/pages/teams/VideogamesPage";
import React, { JSX } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

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
  { path: "/auth-error", element: <AuthErrorPage /> },
  {
    path: "/profesor",
    element: <ProfessorPage />,
    roles: ["Administrador", "Profesor"],
  },
  {
    path: "/jurados-assignment",
    element: <JuradosAssignment />,
    roles: ["Administrador"],
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
    element: <VideogamesPage />,
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
    path: "/ediciones-pasadas",
    element: <FeriasPasadas />,
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
    element: <ForgetPassword />,
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
    path: "/gestionar-ediciones",
    element: <EditionsManagementPage />,
    roles: ["Administrador"],
  },
  { path: "/materias", element: <SubjetsPage />, roles: ["Administrador"] },
  {
    path: "/equipos-inscritos",
    element: <TeamsManagementPage />,
    roles: ["Administrador"],
  },

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
  {
    path: "/calificar-lote",
    element: <BatchRatePage />,
    roles: ["Jurado", "Profesor"],
  },

  {
    path: "/colegios-calificar",
    element: <PendingSchoolGradesPage />,
    roles: ["Profesor"],
  },
  {
    path: "/colegios-calificar/:id",
    element: <SchoolRate />,
    roles: ["Profesor"],
  },
  {
    path: "/colegios-evaluados",
    element: <SchoolGradesPage />,
    roles: ["Profesor"],
  },

  { path: "/calificados", element: <GradedPage />, roles: ["Jurado"] },

  { path: "/materias", element: <SubjetsPage />, roles: ["Administrador"] },
  { path: "/nrcs", element: <NrcsPage />, roles: ["Administrador"] },
  { path: "/criterios", element: <CriteriaPage />, roles: ["Administrador"] },
  {
    path: "/tiebreaker",
    element: <TiebreakerPage />,
    roles: ["Administrador"],
  },
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
  {
    path: "/ponderado-calificaciones",
    element: <GradeWeightsPage />,
    roles: ["Administrador"],
  },
  {
    path: "/configuracion-evento",
    element: <EventConfigurationPage />,
    roles: ["Administrador"],
  },
  {
    path: "/play-game/:videogameID",
    element: <GamePlayerPage />,
  },
];

const RoutesConfiguration: React.FC = () => {
  const { loading } = useAuth();

  // 5. Evitar "pantallazos" blancos o componentes a medio cargar:
  // Si el AuthContext aún está verificando la sesión (loading=true),
  // mostramos una pantalla de carga elegante antes de procesar las rutas.
  if (loading) {
    return <LoadingScreen text="Cargando experiencia..." />;
  }

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
