import React, { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { CheckCircle, AlertCircle, Loader2, KeyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { Link } from "react-router";

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
    | "loading_token_verification"
    | "awaiting_password"
    | "submitting_password"
    | "success"
    | "error";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<Status>("loading_token_verification");
    const [message, setMessage] = useState<string>("Verificando el enlace...");
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
    const [currentToken, setCurrentToken] = useState<string | null>(null);
    const [show, setShow] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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
            setStatus("error");
            setMessage("El enlace es inválido, ha expirado o ya fue utilizado.");
            toast.error(data.message || "Error en la verificación del enlace.");
            return;
            }
    
            setVerifiedEmail(data.email || "Usuario");
            setStatus("awaiting_password");
            setMessage("¡Enlace verificado! Por favor, restablece tu contraseña.");
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

    useEffect(() => {
        const tokenFromUrl = searchParams.get("token");
    
        if (tokenFromUrl) {
          verifyToken(tokenFromUrl);
        } else {
          setStatus("error");
          setMessage(
            "Enlace de restablecimiento inválido o no proporcionado. Asegúrate de usar el enlace completo de tu correo electrónico."
          );
          toast.error("Token no encontrado en el enlace.");
        }
    }, [searchParams, verifyToken]);

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
            }});
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
            const successMessage = "¡Contraseña establecida con éxito! Serás redirigido a iniciar sesión.";
            setMessage(successMessage);
            toast.success("Contraseña establecida.");

            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error: any) {
            setStatus("error");
            setMessage(error.message || "Ocurrió un error al establecer la contraseña. Inténtalo de nuevo.");
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
                <form onSubmit={handleSetPasswordSubmit}>
                    <div className="flex flex-col gap-4 sm:gap-6 items-center w-full">
                        <div className="relative flex flex-col justify-center h-[40px] w-full items-start">
                            <div className="absolute flex justify-center items-center h-full px-[10px] border-r-2">
                                <KeyIcon size={16} />
                            </div>
                            <Input
                                id="resetPassword"
                                type={show ? "text" : "password"}
                                value={password}
                                onChange={(e) => {setPassword(e.target.value)}}
                                placeholder="Ingresar contraseña"
                                required
                                className="w-full h-full pl-[45px] m-0"
                                disabled={status === "submitting_password"}
                                aria-invalid={!!errors.password}
                                aria-describedby={
                                    errors.password ? "password-error" : undefined
                                }
                            />
                            <button type="button"
                                  onClick={() => setShow(!show)}
                                  className="absolute right-5 top-[25%] text-gray-300 hover:text-gray-700 focus:outline-none">
                                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {errors.password && (
                                <p id="password-error" className="text-xs text-red-500">
                                {errors.password}
                                </p>
                            )}
                        </div>
                        <div className="relative flex flex-col justify-center h-[40px] w-full items-start">
                            <div className="absolute flex justify-center items-center h-full px-[10px] border-r-2">
                                <KeyIcon size={16} />
                            </div>
                            
                            <Input
                                id="confirmResetPassword"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={status === "submitting_password"}
                                placeholder="Confirmar contraseña"
                                required
                                className="w-full h-full pl-[45px] m-0"
                            />
                            <button type="button"
                                  onClick={() => setShowConfirm(!showConfirm)}
                                  className="absolute right-5 top-[25%] text-gray-300 hover:text-gray-700 focus:outline-none">
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {errors.confirmPassword && (
                                <p id="confirmPassword-error" className="text-xs text-red-500">
                                {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-start w-full text-xs text-gray-600 dark:text-gray-300">
                            <p>La contraseña debe contener:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                <li>Al menos 8 caracteres</li>
                                <li>Al menos una letra mayúscula</li>
                                <li>Al menos una letra minúscula</li>
                                <li>Al menos un número</li>
                            </ul>
                        </div>
                        <div className="w-full">
                            <Button type="submit"
                                    className="w-full bg-[#B3C7FF] text-base sm:text-[18px] hover:bg-[#8a70ff] cursor-pointer"
                                    disabled={status === "submitting_password"}>
                                    {status === "submitting_password" ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Estableciendo...
                                    </>
                                    ) : (
                                    "Guardar Contraseña y Continuar"
                                    )}
                            </Button>
                        </div>
                    </div>
                </form>
            );
            default: 
                return null;
        }
    };
    return(
        <div className="relative min-h-screen dark bg-[#060312] overflow-hidden">
            <div
                className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat  animate-float"
                style={{backgroundImage: "url('/background.webp')"}}
            ></div>
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10">
            <Card className="w-full max-w-md p-6 sm:p-8 md:p-12 py-5 flex flex-col mx-auto items-center justify-center gap-4 sm:gap-6 bg-black/50">
            <div className="flex items-center w-full justify-center">
                <Link to="/" className="flex items-center">
                <img
                    src="/Arkad.svg"
                    alt="Logo"
                    className="h-10 w-auto"
                />
                </Link>
            </div>
            <CardHeader className="w-full p-0 text-center">
                <CardTitle className="text-2xl sm:text-3xl md:text-[30px] leading-tight space-y-2">
                <h2 className="font-bold">¡Hola!</h2>
                <p className="text-xl font-medium">{verifiedEmail}</p>
                </CardTitle>
                <CardDescription className="text-[12px] sm:text-[15px]">
                    Rellena los campos para tu nueva contraseña.
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
            <TextSizeControls />
        </div>
    </div>
  );
}