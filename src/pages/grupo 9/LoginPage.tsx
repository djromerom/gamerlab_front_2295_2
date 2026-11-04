import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type Location, useLocation, useNavigate } from "react-router-dom";
import type { Role } from "@/types/auth";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ButtonLoading } from "@/pages/grupo 9/ButtonLoading";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  useEffect(() => {
    document.documentElement.classList.remove("light", "high-contrast");
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, userRole, loading, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Ruta protegida de la que venía el usuario y los roles que la permiten
  // (ProtectedRoute los envía en el state)
  const { from, roles: fromRoles } =
    (location.state as { from?: Location; roles?: Role[] } | null) ?? {};

  // Después de iniciar sesión se vuelve a la ruta de origen con su state,
  // así el jurado retoma la calificación donde iba (HU-05).
  // Si el rol que entra no tiene permiso en esa ruta, se va a /inicio en vez de /unauthorized (BG-08)
  const redirectAfterLogin = () => {
    const allowed = !fromRoles || (!!userRole && fromRoles.includes(userRole));
    if (from && allowed) {
      navigate(`${from.pathname}${from.search}${from.hash}`, {
        replace: true,
        state: from.state,
      });
    } else {
      navigate("/inicio", { replace: true });
    }
  };

  // Redirige cuando hay usuario autenticado (ya tenía sesión o acaba de iniciarla).
  // [MODIFICADO]: Es la única redirección tras el login, para leer el rol del usuario nuevo
  // [ANTES]: handleLogIn también redirigía, con el rol todavía sin actualizar
  useEffect(() => {
    if (!loading && user) {
      redirectAfterLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const handleLogIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido: Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const outlookLogin = () => {
    window.location.href = `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/outlook-login`;
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="relative min-h-screen dark bg-[#060312] overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat animate-float"
          style={{
            backgroundImage: "url('/background.webp')",
          }}
        ></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4">
          <div className="text-white text-xl animate-pulse">
            Verificando autenticación...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen dark bg-[#060312] overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat  animate-float"
        style={{
          backgroundImage: "url('/background.webp')",
        }}
      ></div>
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10">
        <Card className="w-full max-w-md p-6 sm:p-8 md:p-12 py-5 flex flex-col mx-auto items-center justify-center gap-4 sm:gap-6 bg-black/50 relative">
          {/* Botón de flecha para volver */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 text-white hover:bg-white/10 p-2"
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center w-full justify-center">
            <Link to="/" className="flex items-center">
              <img
                src="/Arkad.svg"
                alt="Logo"
                className="h-12 sm:h-16 w-auto"
              />
            </Link>
          </div>
          <CardHeader className="w-full p-0 text-center">
            <CardTitle className="text-2xl sm:text-3xl md:text-[30px] leading-tight">
              ¡Hola, qué bien que estés de vuelta!
            </CardTitle>
            {sessionExpired && (
              <p
                role="alert"
                className="mt-3 rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
              >
                Tu sesión expiró. Lo que estabas escribiendo quedó guardado:
                inicia sesión de nuevo para continuar donde ibas.
              </p>
            )}
            <CardDescription className="text-sm sm:text-[15px] mt-2">
              Si eres usuario Uninorte, puedes:
            </CardDescription>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 cursor-pointer"
              onClick={outlookLogin}
              disabled={isSubmitting}
            >
              <img
                src="/assets/Microsoft_icon.svg"
                alt="Microsoft Icon"
                className="h-5 w-5"
              />
              Iniciar Sesión con Outlook
            </Button>
          </CardHeader>

          <CardContent className="w-full p-0">
            <form onSubmit={handleLogIn}>
              <div className="flex flex-col gap-3 sm:gap-4 items-center w-full">
                <CardDescription className="text-sm sm:text-[15px] mt-2">
                  O inicia sesión con tu correo electrónico
                </CardDescription>
                <div className="flex flex-col w-full items-start gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingresa tu correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col w-full items-start gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative flex w-full">
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <button type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-5 top-[25%] text-gray-300 hover:text-gray-700 focus:outline-none">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                </div>
                {error && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2">
                    {error}
                  </p>
                )}
                <div className="w-full mt-2 sm:mt-4">
                  {isSubmitting ? (
                    <ButtonLoading className="w-full" />
                  ) : (
                    <Button
                      type="submit"
                      className="w-full bg-[#B3C7FF] text-base sm:text-[20px] hover:bg-[#8a70ff] cursor-pointer"
                      disabled={isSubmitting}
                    >
                      Ingresar
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="w-full justify-center p-0 mt-2 sm:mt-4 text-center">
            <Link
              to="/OlvidastePassword"
              className="text-[#B3C7FF] hover:text-[#8a70ff] text-sm sm:text-[15px]"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </CardFooter>
        </Card>
        <TextSizeControls />
      </div>
    </div>
  );
}
