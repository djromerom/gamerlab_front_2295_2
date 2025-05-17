import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ButtonLoading } from "@/pages/grupo 9/ButtonLoading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate("/inicio", { replace: true });
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

  return (
    <div className="relative min-h-screen dark">
      <div
        className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat animate-float bg-black"
        style={{
          backgroundImage: "url('/background.webp')",
        }}
      ></div>
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 md:p-10">
        <Card className="w-full max-w-md p-6 sm:p-8 md:p-12 py-5 flex flex-col mx-auto items-center justify-center gap-4 sm:gap-6 bg-black/50">
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
            <CardDescription className="text-sm sm:text-[15px] mt-2">
              Introduce tu correo electrónico para acceder a tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent className="w-full p-0">
            <form onSubmit={handleLogIn}>
              <div className="flex flex-col gap-4 sm:gap-6 items-center w-full">
                <div className="flex flex-col w-full items-start gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@uninorte.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col w-full items-start gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="*****"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full"
                  />
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
                      className="w-full bg-[#B3C7FF] text-base sm:text-[20px] hover:bg-[#8a70ff]"
                      disabled={isSubmitting}
                    >
                      Ingresar
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
