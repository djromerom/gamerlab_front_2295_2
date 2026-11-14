import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertTriangle, Server, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArkadBackground } from "@/components/background/ArkadBackground";

interface ErrorConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const errorConfigs: Record<string, ErrorConfig> = {
  unauthorized: {
    title: "Acceso No Autorizado",
    description: "No tienes permisos para acceder a este recurso. Por favor, inicia sesión nuevamente.",
    icon: <Lock className="h-16 w-16" />,
    color: "text-amber-500"
  },
  "server-error": {
    title: "Error del Servidor",
    description: "Ocurrió un error interno en el servidor. Por favor, intenta nuevamente más tarde.",
    icon: <Server className="h-16 w-16" />,
    color: "text-red-500"
  },
  "session-expired": {
    title: "Sesión Expirada",
    description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.",
    icon: <RefreshCw className="h-16 w-16" />,
    color: "text-[#A9C4FF]"
  },
  "access-denied": {
    title: "Acceso Denegado",
    description: "No tienes los permisos necesarios para realizar esta acción.",
    icon: <Lock className="h-16 w-16" />,
    color: "text-orange-500"
  }
};

const defaultError: ErrorConfig = {
  title: "Error de Autenticación",
  description: "Ocurrió un error durante el proceso de autenticación. Por favor, intenta nuevamente.",
  icon: <AlertTriangle className="h-16 w-16" />,
  color: "text-[#A9C4FF]"
};

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Set dark theme
  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const errorType = searchParams.get("error") || "unknown";
  const errorConfig = errorConfigs[errorType] || defaultError;

  const handleRetry = () => {
    // Go back to the previous page or login
    navigate(-1);
  };

  const handleLogin = () => {
    navigate("/login", { replace: true });
  };

  const handleHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="relative min-h-screen dark overflow-hidden">
      <ArkadBackground modo="lento" estiloNuevo />
      
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10">
        <Card className="w-full max-w-lg p-6 sm:p-8 md:p-12 flex flex-col mx-auto items-center justify-center gap-6 bg-black/50 relative">
          
          {/* Logo */}
          <div className="flex items-center w-full justify-center mb-4">
            <Link to="/" className="flex items-center">
              <img
                src="/Arkad.svg"
                alt="Logo"
                className="h-12 sm:h-16 w-auto"
              />
            </Link>
          </div>

          {/* Error Icon */}
          <div className={`${errorConfig.color} mb-4`}>
            {errorConfig.icon}
          </div>

          <CardHeader className="w-full p-0 text-center">
            <CardTitle className="text-2xl sm:text-3xl md:text-[28px] leading-tight text-white">
              {errorConfig.title}
            </CardTitle>
            <CardDescription className="text-sm sm:text-[15px] mt-4 text-gray-300">
              {errorConfig.description}
            </CardDescription>
            
            {/* Show error type for debugging in development */}
            {process.env.NODE_ENV === 'development' && (
              <CardDescription className="text-xs mt-2 text-gray-500 font-mono">
                Error Type: {errorType}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="w-full p-0 mt-6">
            <div className="flex flex-col gap-3 sm:gap-4 items-center w-full">
              
              {/* Primary action based on error type */}
              {(errorType === 'unauthorized' || errorType === 'session-expired') ? (
                <Button
                  onClick={handleLogin}
                  className="w-full bg-[#B3C7FF] text-base sm:text-[18px] hover:bg-[#8a70ff] cursor-pointer"
                >
                  Iniciar Sesión
                </Button>
              ) : (
                <Button
                  onClick={handleRetry}
                  className="w-full bg-[#B3C7FF] text-base sm:text-[18px] hover:bg-[#8a70ff] cursor-pointer"
                >
                  Reintentar
                </Button>
              )}

              {/* Secondary actions */}
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={handleHome}
                  className="flex-1 text-sm cursor-pointer border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Ir al Inicio
                </Button>
                
                {errorType !== 'unauthorized' && errorType !== 'session-expired' && (
                  <Button
                    variant="outline"
                    onClick={handleLogin}
                    className="flex-1 text-sm cursor-pointer border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Iniciar Sesión
                  </Button>
                )}
              </div>

              {/* Help text */}
              <div className="text-center mt-4">
                <p className="text-xs sm:text-sm text-gray-400">
                  Si el problema persiste, contacta al soporte técnico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
