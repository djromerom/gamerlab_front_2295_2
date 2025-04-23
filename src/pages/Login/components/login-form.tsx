import type React from "react";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useAuthContext } from "../../../context/AuthContext";
import { useEffect, useState } from "react";
import { ButtonLoading } from "./ButtonLoading";
import { ForgotPasswwordButton } from "./ForgotPasswword";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { logIn, error, isLoggingIn } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await logIn(email, password);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center max-w-xs mx-auto">
            ¡Hola, que bien que estés de vuelta!
          </CardTitle>
          <CardDescription>
            Introduzca su dirección de correo electronico para acceder a su
            cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogIn}>
            <div className="flex flex-col gap-6 flex justify-center">
              <div className="grid gap-2 flex justify-center">
                <Label htmlFor="email">Email</Label>
                <Input
                  className="w-80"
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="grid gap-2 flex justify-center">
                <div className="flex items-center">
                  <Label htmlFor="password">Constraseña</Label>
                </div>
                <Input
                  className="w-80"
                  id="password"
                  type="password"
                  placeholder="*****"
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="flex flex-col items-center">
                {error && <p className=" text-red-600">{error.message}</p>}
                {isLoggingIn ? (
                  <ButtonLoading className="w-80" />
                ) : (
                  <Button type="submit" className="w-80">
                    Ingresar
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              <ForgotPasswwordButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
