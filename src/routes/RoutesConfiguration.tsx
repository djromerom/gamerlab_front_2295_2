import React, { JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@/components/grupo 9/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";

import LoginPage from "@/pages/grupo 9/LoginPage";
import UnauthorizedPage from "@/pages/grupo 9/UnauthorizedPage";
import AuthErrorPage from "@/pages/grupo 9/AuthErrorPage";
import HomePage from "@/pages/grupo 9/HomePage";
import SubjetsPage from "@/pages/grupo 9/SubjetsPage";
import CriteriaPage from "@/pages/grupo 9/CriterionPage";
import NrcsPage from "@/pages/grupo 9/NrcsPage";
import { VerifyEmailPage } from "@/pages/grupo 9/VerificationPage";
import { ProfessorsPage } from "@/pages/grupo 9/professorsPage";
import ForgetPassword from "@/pages/grupo 9/ForgetPassword";
import ResetPassword from "@/pages/grupo 9/ResetPassword";
import TeamsManagementPage from "@/pages/grupo 9/TeamsManagementPage";
import GradeWeightsPage from "@/pages/grupo 9/GradeWeightsPage";
import TiebreakerPage from "@/pages/grupo 9/TiebreakerPage";
import ProfessorRankingTiesPage from "@/pages/grupo 9/ProfessorRankingTiesPage";
import EditionsManagementPage from "@/pages/admin/EditionsManagementPage";
import JurorBadgesPage from "@/pages/admin/JurorBadgesPage";
import EditionJurorsPage from "@/pages/admin/EditionJurorsPage";
import JurorCheckInPage from "@/pages/staff/JurorCheckInPage";
import JurorAttendancePage from "@/pages/staff/JurorAttendancePage";
import StaffAccountsPage from "@/pages/admin/StaffAccountsPage";
import PushNotificationsPage from "@/pages/PushNotificationsPage";
import FinalGradeReleasePage from "@/pages/admin/FinalGradeReleasePage";
import JurorSurveyResultsPage from "@/pages/admin/JurorSurveyResultsPage";
import ExternalPresentersPage from "@/pages/admin/ExternalPresentersPage";
import MyRegistrationPage from "@/pages/external-presenter/MyRegistrationPage";
import PwaInstallGuidePage from "@/pages/PwaInstallGuidePage";

import NotFoundPage from "@/pages/NotFoundPage";

import JuryManagementPage from "@/pages/grupo 12/JuryManagementPage";
import { RealtimeTrackingPanel } from "@/pages/RealtimeTrackingPanel";

import LandingPage from "@/pages/grupo 5/LandingPage";
import RankingPage from "@/pages/grupo 5/RankingPage";
import InformationPage from "@/pages/grupo 5/InformationPage";
import HomeStudentPage from "@/pages/grupo 5/HomeStudentPage";
import MisJuradosPage from "@/pages/grupo 5/MisJuradosPage";
import HomeTeacherPage from "@/pages/grupo 5/HomeTeacherPage";
import FeriasPasadas from "@/pages/grupo 5/FeriasPasadas";
import CreditsPage from "@/pages/grupo 5/CreditsPage";
import EditTeamPage from "@/pages/grupo 5/EditTeamPage";
import HistoricalVideogamesPage from "@/pages/grupo 5/HistoricalVideogamesPage";

import PendingGradesPage from "@/pages/grupo 8/PendingGradesPage";
import RatePage from "@/pages/grupo 8/RatePage";
import GradedPage from "@/pages/grupo 8/GradedPage";
import SchoolRate from "@/pages/grupo 8/SchoolRate";
import PendingSchoolGradesPage from "@/pages/grupo 8/PendingSchoolGradesPage";
import SchoolGradesPage from "@/pages/grupo 8/SchoolGradesPage";
import BatchRatePage from "@/pages/grupo 8/BatchRatePage";

import StatisticsPage from "@/pages/grupo 1/StatisticsPage";

import RegistrationGate from "@/routes/RegistrationGate";
import VideogamesPage from "@/pages/teams/VideogamesPage";

import GamePlayerPage from "@/pages/gameplayer/GamePlayerPage";

import EventConfigurationPage from "@/components/grupo 9/EventConfigurationPage";
import { JuradosAssignment } from "@/pages/JuradosAssignment";
import type { Role } from "@/types/auth";

interface RouteConfig {
  path: string;
  element: JSX.Element;
  roles?: Role[];
}

export const routes: RouteConfig[] = [
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    path: "/notificaciones",
    element: <PushNotificationsPage />,
    roles: ["Administrador", "Jurado", "Profesor"],
  },
  {
    path: "/instalar-app",
    element: <PwaInstallGuidePage />,
    roles: ["Jurado"],
  },
  { path: "/auth-error", element: <AuthErrorPage /> },
  // Pantallas de relleno retiradas: se redirigen al inicio de su rol
  {
    path: "/profesor",
    element: <Navigate to="/inicio" replace />,
    roles: ["Administrador", "Profesor"],
  },
  {
    path: "/jurados-assignment",
    element: <JuradosAssignment />,
    roles: ["Administrador"],
  },
  {
    path: "/realtime-tracking-panel",
    element: <RealtimeTrackingPanel />,
    roles: ["Administrador", "Profesor"],
  },
  { path: "/jurado", element: <Navigate to="/inicio" replace />, roles: ["Jurado"] },
  {
    path: "/consultor",
    element: <Navigate to="/inicio" replace />,
    roles: ["Consultor"],
  },
  {
    path: "/registro-equipo",
    element: <RegistrationGate />,
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
    path: "/ediciones-pasadas/:editionId/juegos",
    element: <HistoricalVideogamesPage />,
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
    roles: [
      "Profesor",
      "Administrador",
      "Estudiante",
      "Consultor",
      "Jurado",
      "Staff",
      // HomePage lo redirige a /mi-registro
      "Presentador externo",
    ],
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
    path: "/jurados-edicion",
    element: <EditionJurorsPage />,
    roles: ["Administrador"],
  },
  {
    path: "/gestionar-ediciones",
    element: <EditionsManagementPage />,
    roles: ["Administrador"],
  },
  {
    path: "/escarapelas",
    element: <JurorBadgesPage />,
    roles: ["Administrador"],
  },
  {
    path: "/check-in-jurados",
    element: <JurorCheckInPage />,
    roles: ["Staff", "Administrador"],
  },
  {
    path: "/asistencia-jurados",
    element: <JurorAttendancePage />,
    roles: ["Staff", "Administrador"],
  },
  {
    path: "/cuentas-staff",
    element: <StaffAccountsPage />,
    roles: ["Administrador"],
  },
  // HU-33 (ARK-195): presentadores externos
  {
    path: "/presentadores-externos",
    element: <ExternalPresentersPage />,
    roles: ["Administrador"],
  },
  {
    path: "/mi-registro",
    element: <MyRegistrationPage />,
    roles: ["Presentador externo"],
  },
  {
    path: "/notas-finales",
    element: <FinalGradeReleasePage />,
    roles: ["Administrador"],
  },
  {
    path: "/encuesta-jurados",
    element: <JurorSurveyResultsPage />,
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

  { path: "/nrcs", element: <NrcsPage />, roles: ["Administrador"] },
  { path: "/criterios", element: <CriteriaPage />, roles: ["Administrador"] },
  {
    path: "/tiebreaker",
    element: <TiebreakerPage />,
    roles: ["Administrador"],
  },
  {
    path: "/ranking/mis-empates",
    element: <ProfessorRankingTiesPage />,
    roles: ["Profesor"],
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
    path: "/mis-jurados",
    element: <MisJuradosPage />,
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
              <Route
                key={route.path}
                element={<ProtectedRoute roles={route.roles} />}
              >
                <Route path={route.path} element={route.element} />
              </Route>
            );
          }
          return (
            <Route key={route.path} path={route.path} element={route.element} />
          );
        })}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RoutesConfiguration;
