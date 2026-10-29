// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import LoadingScreen from "@/components/grupo 5/LoadingScreen"; 

interface ProtectedRouteProps {
  roles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Mientras carga perfil…
  if (loading)
    return (
      <>
        <LoadingScreen />
      </>
    );

  // Si no hay usuario autenticado, vamos a /login recordando la ruta (y su state)
  // para volver a ella después de iniciar sesión
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si el rol no está permitido…
  if (roles && !roles.includes(userRole!)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo ok, renderizamos la ruta anidada
  return <Outlet />;
};
