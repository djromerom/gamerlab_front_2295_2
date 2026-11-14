import React, { JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SubstituteNotices } from "@/features/jurors/substitutes/components/SubstituteNotices";

import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

import LoginPage from "@/features/auth/pages/LoginPage";
import UnauthorizedPage from "@/features/auth/pages/UnauthorizedPage";
import AuthErrorPage from "@/features/auth/pages/AuthErrorPage";
import HomePage from "@/features/home/pages/HomePage";
import SubjectsPage from "@/features/academic/pages/SubjectsPage";
import CriteriaPage from "@/features/academic/pages/CriteriaPage";
import NrcsPage from "@/features/academic/pages/NrcsPage";
import { AccountVerificationPage } from "@/features/auth/pages/AccountVerificationPage";
import { ProfessorsPage } from "@/features/academic/pages/ProfessorsPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import TeamsManagementPage from "@/features/teams/pages/TeamsManagementPage";
import GradeWeightsPage from "@/features/academic/pages/GradeWeightsPage";
import TiebreakerPage from "@/features/results/pages/TiebreakerPage";
import ProfessorRankingTiesPage from "@/features/results/pages/ProfessorRankingTiesPage";
import EditionsManagementPage from "@/features/editions/pages/EditionsManagementPage";
import JurorBadgesPage from "@/features/jurors/badges/pages/JurorBadgesPage";
import EditionJurorsPage from "@/features/jurors/edition/pages/EditionJurorsPage";
import JurorCheckInPage from "@/features/jurors/attendance/pages/JurorCheckInPage";
import JurorAttendancePage from "@/features/jurors/attendance/pages/JurorAttendancePage";
import StaffAccountsPage from "@/features/staff-accounts/pages/StaffAccountsPage";
import PushNotificationsPage from "@/features/notifications/pages/PushNotificationsPage";
import FinalGradeReleasePage from "@/features/results/pages/FinalGradeReleasePage";
import JurorSurveyResultsPage from "@/features/jurors/survey/pages/JurorSurveyResultsPage";
import ExternalPresentersPage from "@/features/external-presenters/pages/ExternalPresentersPage";
import MyRegistrationPage from "@/features/external-presenters/pages/MyRegistrationPage";
import PwaInstallGuidePage from "@/features/pwa/pages/PwaInstallGuidePage";

import NotFoundPage from "@/features/public/pages/NotFoundPage";

import JuryManagementPage from "@/features/jurors/management/pages/JuryManagementPage";
import { RealtimeTrackingPage } from "@/features/grading/pages/RealtimeTrackingPage";

import LandingPage from "@/features/public/pages/LandingPage";
import RankingPage from "@/features/results/pages/RankingPage";
import InformationPage from "@/features/public/pages/InformationPage";
import StudentHomePage from "@/features/teams/pages/StudentHomePage";
import MyJurorsPage from "@/features/teams/pages/MyJurorsPage";
import TeacherHomePage from "@/features/results/pages/TeacherHomePage";
import PastFairsPage from "@/features/public/pages/PastFairsPage";
import CreditsPage from "@/features/public/pages/CreditsPage";
import EditTeamPage from "@/features/teams/pages/EditTeamPage";
import HistoricalVideogamesPage from "@/features/games/pages/HistoricalVideogamesPage";

import PendingGradesPage from "@/features/grading/pages/PendingGradesPage";
import RatePage from "@/features/grading/pages/RatePage";
import GradedPage from "@/features/grading/pages/GradedPage";
import SchoolRatePage from "@/features/grading/pages/SchoolRatePage";
import PendingSchoolGradesPage from "@/features/grading/pages/PendingSchoolGradesPage";
import SchoolGradesPage from "@/features/grading/pages/SchoolGradesPage";
import BatchRatePage from "@/features/grading/pages/BatchRatePage";

import StatisticsPage from "@/features/results/pages/StatisticsPage";

import RegistrationGate from "@/routes/RegistrationGate";
import RestoreInteraction from "@/routes/RestoreInteraction";
import VideogamesPage from "@/features/games/pages/VideogamesPage";

import GamePlayerPage from "@/features/games/pages/GamePlayerPage";

import EventConfigurationPage from "@/features/editions/pages/EventConfigurationPage";
import { JurorAssignmentPage } from "@/features/jurors/assignment/pages/JurorAssignmentPage";
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
    element: <JurorAssignmentPage />,
    roles: ["Administrador"],
  },
  {
    path: "/realtime-tracking-panel",
    element: <RealtimeTrackingPage />,
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
    element: <PastFairsPage />,
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
    element: <ForgotPasswordPage />,
  },
  {
    path: "/establecer-contrasena",
    element: <ResetPasswordPage />,
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
  { path: "/materias", element: <SubjectsPage />, roles: ["Administrador"] },
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
    element: <SchoolRatePage />,
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
    element: <AccountVerificationPage />,
  },
  {
    path: "/mi-equipo",
    element: <StudentHomePage />,
    roles: ["Estudiante", "Profesor"],
  },
  {
    path: "/home-profesor",
    element: <TeacherHomePage />,
    roles: ["Profesor"],
  },
  {
    path: "/editar-equipo",
    element: <EditTeamPage />,
    roles: ["Estudiante"],
  },
  {
    path: "/mis-jurados",
    element: <MyJurorsPage />,
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
      <RestoreInteraction />
      {/* HU-22: dentro del router para que «Ver mis grupos» navegue sin recargar */}
      <SubstituteNotices />
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
