import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ButtonLoading } from "@/pages/grupo 9/ButtonLoading"; // Assuming this component exists and works
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

export default function LoginPage({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // <-- Start loading indicator
    setError(null);
    try {
      await login({ email, password });
      // Navigate only on success
      navigate("/inicio", { replace: true });
      // No need to set loading false here if navigating away
      // If you weren't navigating, you'd let finally handle it.
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido: Intenta de nuevo."); // Provide a user-friendly generic message
      }
      // Let finally handle setting loading state back
    } finally {
      // This runs whether try succeeded or failed.
      // If navigation happens on success, this might run just as the component unmounts,
      // but it ensures loading is false if an error occurred.
      setIsSubmitting(false); // <-- Stop loading indicator
    }
    // Removed the redundant setLoading(false) from here
  };

  return (
    <div className="relative min-h-svh">
      {/* Fondo con z-0 */}
      <div
        className="absolute inset-0 z-0 bg-center bg-no-repeat animate-float"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundSize: "100%",
        }}
      ></div>

      {/* Fondo 2 - Esquina inferior derecha */}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-7 md:p-10">
        <Card className="py-5 w-fit flex flex-col m-auto items-center justify-center gap-6 bg-black/60 border border-[#B3C7FF]/30">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/Arkad.svg" // Path to your logo
                alt="Logo"
                className="h-auto w-auto"
              />
            </Link>
          </div>
          <CardHeader className="w-60 p-0 text-center">
            <CardTitle className="text-2xl">
              ¡Hola, qué bien que estés de vuelta!
            </CardTitle>
            <CardDescription>
              Introduce tu correo electrónico para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogIn}>
              <div className="flex flex-col gap-6 items-center w-80">
                <div className="flex flex-col w-full items-start gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
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
                  />
                </div>
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                <div className="w-full mt-4">
                  {isSubmitting ? (
                    <ButtonLoading className="w-full" />
                  ) : (
                    <Button
                      type="submit"
                      className="w-full bg-[#B3C7FF]"
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
