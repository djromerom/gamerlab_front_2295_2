import React, { useState, useEffect, useCallback } from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
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

const emailSchema = z
  .object({
    email: z
      .string()
      .email("El correo electrónico no es válido"),
  });

type Status =
  | "loading_token_verification"
  | "awaiting_password"
  | "submitting_password"
  | "success"
  | "expired_error"
  | "resend_email"
  | "submitting_email"
  | "error";

export function VerifyEmailPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("loading_token_verification");
  const [message, setMessage] = useState<string>("Verificando el enlace...");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const verifyToken = useCallback(async (token: string) => {
    setStatus("loading_token_verification");
    setMessage("Verificando el enlace...");
    setCurrentToken(token);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/verify-token?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.isValid) {
        if (data.message.includes("expired")) {
          setStatus("expired_error");
          setMessage("El enlace de verificación ha expirado. Solicita uno nuevo.");
          toast.error("El enlace de verificación ha expirado.");
          return;
        }
        setStatus("error");
        setMessage("El enlace de verificación es inválido, ha expirado o ya fue utilizado.");
        toast.error(data.message || "Error en la verificación del enlace.");
        return;
      }

      setVerifiedEmail(data.email || "Usuario");
      setStatus("awaiting_password");
      setMessage("¡Enlace verificado! Por favor, establece tu contraseña.");
      toast.success("Enlace verificado correctamente.");

    } catch (error: any) {
      setStatus("error");
      setMessage(
        error.message ||
        "Ocurrió un error al verificar el enlace. Inténtalo de nuevo o contacta a soporte."
      );
      toast.error("Error al verificar el enlace.");
    }
  }, []);


  const outlookLogin = () => {
    window.location.href = `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/outlook-login`;
  }

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");

    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    } else {
      setStatus("error");
      setMessage(
        "Enlace de verificación inválido o no proporcionado. Asegúrate de usar el enlace completo de tu correo electrónico."
      );
      toast.error("Token no encontrado en el enlace.");
    }
  }, [searchParams, verifyToken]);

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const validationResult = emailSchema.safeParse({email});

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

    try {
      setStatus("submitting_email");
      setMessage("Reenviando correo de verificación...");
      
      const response = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/resend-confirmation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }),
        }
      );
      
      if (response.status !== 200) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al reenviar el correo");
      }
      
      setStatus("success");
      const successMessage =
        "Correo reenviado correctamente. Serás redirigido a nuestra página principal.";
      setMessage(successMessage);
      toast.success("Correo reenviado correctamente.");

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Error al reenviar el correo de confirmación");
      toast.error(err.message || "Error al reenviar el correo de confirmación");
    }
  };

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

    if (!currentToken) {
      setMessage(
        "Error: No se encontró el token de verificación. Por favor, vuelve a usar el enlace de tu correo."
      );
      setStatus("error");
      toast.error("Error interno: Token de verificación no disponible.");
      return;
    }

    setStatus("submitting_password");
    setMessage("Estableciendo tu contraseña...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/set-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: currentToken,
            password: password,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Error del servidor: ${response.status}`);
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
      case "loading_token_verification":
        return (
          <div className="py-3">
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando Enlace...</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        );
      case "expired_error":
          return (
          <div className="py-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de Verificación</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
              <div className="mt-4 space-y-1">
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  Ir a Iniciar Sesión
                </Button>
                <Button
                  onClick={() => setStatus("resend_email")}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  Reenviar Enlace de Verificación
                </Button>
              </div>
            </Alert>
          </div>
        );
      case "error":
        return (
          <div className="py-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de Verificación</AlertTitle>
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
      case "resend_email":
      case "submitting_email":
        return (
          <form onSubmit={handleResendEmail} className="space-y-4 pb-3">  
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-gray-800 dark:text-gray-200"
              >
                Email de confirmación
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo"
                className={errors.confirmEmail ? "border-red-500" : ""}
                disabled={status === "submitting_email"}
                aria-invalid={!!errors.confirmEmail}
                aria-describedby={
                  errors.confirmEmail ? "confirmEmail-error" : undefined
                }
              />
              {errors.confirmEmail && (
                <p id="confirmEmail-error" className="text-xs text-red-500">
                  {errors.confirmEmail}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#B3C7FF] hover:bg-[#8a70ff] cursor-pointer"
              disabled={status === "submitting_email"}
            >
              {status === "submitting_email" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estableciendo...
                </>
              ) : (
                "Reenviar correo de confirmación"
              )}
            </Button>
          </form>
        )
      case "success":
        return (
          <div className="py-3">
            <Alert className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>¡Proceso Completado!</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        );
      case "awaiting_password":
      case "submitting_password":
        return (
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4 pb-3">
            <Alert
              variant="default"
              className="bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
            >
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Enlace Verificado
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                {verifiedEmail}. {message}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-800 dark:text-gray-200"
              >
                Crea tu Contraseñaa
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className={errors.password ? "border-red-500" : ""}
                disabled={status === "submitting_password"}
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
                disabled={status === "submitting_password"}
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
              disabled={status === "submitting_password"}
            >
              {status === "submitting_password" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estableciendo...
                </>
              ) : (
                "Guardar Contraseña y Continuar"
              )}
            </Button>
            <CardDescription className="text-sm sm:text-[15px] mt-2">
                Si eres usuario Uninorte, puedes:
            </CardDescription>
                           
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2 cursor-pointer"
              onClick={outlookLogin}
              disabled={status === "submitting_password"}
            >
               <img
                    src="/assets/Microsoft_icon.svg"
                    alt="Microsoft Icon"
                    className="h-5 w-5"
                  />
              Iniciar Sesión con Outlook
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  const cardTitle = "Confirmación de Cuenta";
  const cardDescription =
    status === "awaiting_password" || status === "submitting_password"
      ? "Último paso: establece tu contraseña."
      : status === "loading_token_verification"
        ? "Verificando tu enlace..."
        : status === "success"
          ? "Proceso completado."
          : status === "error" || status === "expired_error"
            ? "No se pudo completar la verificación."
            : status === "resend_email"
              ? "Escribe tu correo para reenviar el correo de confirmación."
              : "Confirmando tu cuenta...";


  return (
    <div className="relative min-h-svh flex items-center justify-center overflow-hidden bg-[#060312]">
      <div
        className="absolute inset-0 z-0 bg-center bg-no-repeat animate-float"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundSize: "100%",
        }}
      ></div>
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
                  Iniciar Sesión
                </a>
              </p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
