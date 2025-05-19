import React, { useState, useEffect } from "react";
import { z } from "zod";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import supabase from "@/supabase/client";
import { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe tener al menos una letra mayúscula")
      .regex(/[a-z]/, "La contraseña debe tener al menos una letra minúscula")
      .regex(/[0-9]/, "La contraseña debe tener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type Status =
  | "loading"
  | "awaiting_password"
  | "submitting"
  | "success"
  | "error";

export function VerifyEmailPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Verificando cuenta...");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let processedFragment = false;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const errorDescription = params.get("error_description");
    const errorCode = params.get("error_code");

    if (errorDescription || errorCode) {
      processedFragment = true;
      setStatus("error");
      setMessage(
        `Error: ${decodeURIComponent(
          errorDescription?.replace(/\+/g, " ") || "Error desconocido"
        )}` + (errorCode ? ` (Code: ${errorCode})` : "")
      );

      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
      return;
    }

    if (accessToken) {
      processedFragment = true;

      setStatus("loading");
      setMessage("Procesando verificación...");
    } else {
      setStatus("error");
      setMessage(
        "Enlace de verificación inválido, expirado, ya utilizado o no proporcionado."
      );

      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;

        console.log("Auth Event:", event, "Session:", !!session);

        if (event === "SIGNED_IN" && session?.user && processedFragment) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );

          if (
            session.user.email_confirmed_at ||
            session.user.phone_confirmed_at
          ) {
            setCurrentUser(session.user);
            setCurrentSessionToken(session.access_token);
            setStatus("awaiting_password");
            setMessage(
              "¡Cuenta verificada! Por favor, establece tu contraseña."
            );
          } else {
            setStatus("error");
            setMessage(
              "Error inesperado: La sesión se inició pero la cuenta no aparece como confirmada."
            );
          }
          processedFragment = false;
        } else if (
          event === "INITIAL_SESSION" &&
          !session &&
          processedFragment
        ) {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
          setStatus("error");
          setMessage(
            "El token de verificación en el enlace no pudo ser validado o ha expirado."
          );
          processedFragment = false;
        } else if (event === "SIGNED_OUT") {
          toast.info("Has cerrado sesión.");
          navigate("/login");
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = passwordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!currentSessionToken) {
      setMessage(
        "Error de sesión. Por favor, refresca la página o intenta iniciar sesión."
      );
      setStatus("error");
      toast.error("Error interno: No se pudo obtener el token de sesión.");
      return;
    }

    setStatus("submitting");
    setMessage("Estableciendo tu contraseña...");

    try {
      const response = await fetch(
        `${import.meta.env.ENDPOINT_BACKEND}/auth/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentSessionToken}`,
          },
          body: JSON.stringify({
            password: password,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {}
        if (response.status === 401) {
          errorMessage =
            "Error de autenticación. Verifica la configuración del servidor.";
        }
        throw new Error(errorMessage);
      }

      setStatus("success");
      const successMessage =
        "¡Contraseña establecida con éxito! Serás redirigido a iniciar sesión.";
      setMessage(successMessage);
      toast.success("Contraseña establecida.");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(
        error.message ||
          "Ocurrió un error al establecer la contraseña. Inténtalo de nuevo."
      );
      toast.error(error.message || "Error al establecer contraseña.");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="py-3">
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando...</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        );
      case "error":
        return (
          <div className="py-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
              <div className="mt-4">
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  Ir a Iniciar Sesión
                </Button>
              </div>
            </Alert>
          </div>
        );
      case "success":
        return (
          <div className="py-3">
            <Alert className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>¡Éxito!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        );
      case "awaiting_password":
      case "submitting":
        return (
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4 pb-3">
            <Alert
              variant="default"
              className="bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
            >
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Cuenta Verificada
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                {currentUser?.email}. {message}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-800 dark:text-gray-200"
              >
                Crea tu Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className={errors.password ? "border-red-500" : ""}
                disabled={status === "submitting"}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-gray-800 dark:text-gray-200"
              >
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                className={errors.confirmPassword ? "border-red-500" : ""}
                disabled={status === "submitting"}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300">
              <p>La contraseña debe contener:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Al menos 8 caracteres</li>
                <li>Al menos una letra mayúscula</li>
                <li>Al menos una letra minúscula</li>
                <li>Al menos un número</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#B3C7FF] hover:bg-[#8a70ff] cursor-pointer"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estableciendo...
                </>
              ) : (
                "Guardar Contraseña y Continuar"
              )}
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  const cardTitle = "Confirmación de Cuenta";
  const cardDescription =
    status === "awaiting_password" || status === "submitting"
      ? "Último paso: establece tu contraseña."
      : status === "loading"
      ? "Verificando tu cuenta..."
      : status === "success"
      ? "Proceso completado."
      : status === "error"
      ? "No se pudo completar la verificación."
      : "Confirmando tu cuenta...";

  return (
    <div className="relative min-h-svh flex items-center justify-center overflow-hidden bg-[#060312]">
      {/* Fondo con opacidad reducida */}
      <div
        className="absolute inset-0 z-0 bg-center bg-no-repeat animate-float"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundSize: "100%",
        }}
      ></div>

      {/* Contenido principal */}
      <Card className="w-full max-w-md relative z-10 bg-white/90 dark:bg-black/50 backdrop-blur-sm mt-12">
        <CardHeader className="space-y-3 pt-8 text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {cardTitle}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-gray-800 dark:text-gray-200 px-8">
          {renderContent()}
        </CardContent>
        {(status === "awaiting_password" || status === "error") && (
          <CardFooter className="w-full flex flex-col items-center justify-center pt-4 border-t dark:border-gray-700 px-6 pb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes una cuenta o tienes problemas?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:underline dark:text-blue-400 font-medium cursor-pointer"
                >
                  Iniciar sesión
                </a>
              </p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
