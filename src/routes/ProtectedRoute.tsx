// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import LoadingScreen from "@/components/LoadingScreen"; 

interface ProtectedRouteProps {
  roles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { user, userRole, loading, signedOut } = useAuth();
  const location = useLocation();

  // Mientras carga perfil…
  if (loading)
    return (
      <>
        <LoadingScreen />
      </>
    );

  if (!user) {
    // [MODIFICADO]: Si el usuario cerró sesión con "Salir" va al login sin ruta de origen (BG-08)
    // [ANTES]: Siempre se guardaba la ruta, y otra cuenta con otro rol terminaba en /unauthorized
    if (signedOut) {
      return <Navigate to="/login" replace />;
    }
    // Sesión vencida o enlace directo: se recuerda la ruta (y su state) y los roles que la
    // permiten, para volver a ella después de iniciar sesión (HU-05)
    return <Navigate to="/login" replace state={{ from: location, roles }} />;
  }

  // Si el rol no está permitido…
  if (roles && !roles.includes(userRole!)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo ok, renderizamos la ruta anidada
  return <Outlet />;
};
