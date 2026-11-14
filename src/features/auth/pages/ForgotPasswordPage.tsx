import { apiFetch } from "@/lib/api";
import { TextSizeControls } from "@/components/grupo 5/TextSizeControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ButtonLoading } from "@/features/auth/components/ButtonLoading";
import { FondoArkad } from "@/components/fondo/FondoArkad";

export default function ForgotPasswordPage() {


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleRequestResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email: email}),
            });
            if (!response.ok) {
                setError('No se pudo enviar el correo de restablecimiento de contraseña. Por favor, verifica el correo ingresado.');
                throw new Error('Error al enviar el correo de restablecimiento de contraseña.');
            }
            setSuccess('Correo de restablecimiento de contraseña enviado exitosamente. Por favor, revisa tu bandeja de entrada. Redireccionando al login... 😎');

            setTimeout(() => {
                navigate("/login")
            }, 4000)

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

    return(
        <div className="relative min-h-screen dark overflow-hidden">
            <FondoArkad modo="lento" estiloNuevo />
        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10">
            <Card className="w-full max-w-md p-6 sm:p-8 md:p-12 py-5 flex flex-col mx-auto items-center justify-center gap-4 sm:gap-6 bg-black/50">
            <Link to={'/login'} className="w-full justify-end">Regresar</Link>
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
                <CardTitle className="text-2xl sm:text-3xl md:text-[30px] leading-tight space-y-2">
                <h2 className="font-bold">¡Oops!</h2>
                <p className="text-xl font-medium">¿Olvidaste tu contraseña?</p>
                </CardTitle>
                <CardDescription className="text-[12px] sm:text-[15px]">
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                </CardDescription>
            </CardHeader>

            <CardContent className="w-full p-0">
                <form onSubmit={handleRequestResetPassword}>
                <div className="flex flex-col gap-4 sm:gap-6 items-center w-full">
                    <div className="relative flex flex-col justify-center h-[45px] w-full items-start">
                        <div className="absolute flex justify-center items-center h-full px-[10px] border-r-2">
                            <Mail size={16} />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="w-full h-full pl-[45px] m-0"
                        />
                    </div>
                    {error && (
                        <p className="text-red-600 text-xs sm:text-sm mt-1 sm:mt-2">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p className="text-green-600 text-xs sm:text-sm mt-1 sm:mt-2">
                            {success}
                        </p>
                    )}
                    <div className="w-full mt-2 sm:mt-4">
                        {isSubmitting ? (
                            <ButtonLoading className="w-full" />
                        ) : (
                            <Button
                            type="submit"
                            className="w-full bg-[#B3C7FF] text-base sm:text-[18px] hover:bg-[#8a70ff] cursor-pointer"
                            disabled={isSubmitting}
                            >
                            Enviar
                            </Button>
                        )}
                    </div>
                </div>
                </form>
            </CardContent>
            <CardFooter className="w-full justify-center p-0 mt-2 sm:mt-4 text-center">
            </CardFooter>
            </Card>
            <TextSizeControls />
        </div>
    </div>
  );
}