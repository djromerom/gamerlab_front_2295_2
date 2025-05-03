import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="py-5 w-fit flex flex-col m-auto items-center justify-center gap-6">
        <CardHeader className="w-80 p-0">
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
              {/* Input fields... */}
              <div className="flex flex-col w-full items-start gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting} // Optional: disable inputs while loading
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
                  disabled={isSubmitting} // Optional: disable inputs while loading
                />
              </div>

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              {/* Use the local isSubmitting state for the button */}
              <div className="w-full mt-4">
                {" "}
                {/* Added container for consistent spacing */}
                {isSubmitting ? (
                  <ButtonLoading className="w-full" /> // Use w-full like the original button
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
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
  );
}
