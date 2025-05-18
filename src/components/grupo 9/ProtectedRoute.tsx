// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types/auth";
import LoadingScreen from "@/components/grupo 5/LoadingScreen"; 

interface ProtectedRouteProps {
  roles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { user, userRole, loading } = useAuth();

  // Mientras carga perfil…
  if (loading)
    return (
      <>
        <LoadingScreen />
      </>
    );

  // Si no hay usuario autenticado, vamos a /inicio-sesion
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está permitido…
  if (roles && !roles.includes(userRole!)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo ok, renderizamos la ruta anidada
  return <Outlet />;
};
