import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase/client"; // Asegúrate de importar bien tu instancia

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMensaje(`❌ Error: ${error.message}`);
    } else {
      setMensaje("✅ Contraseña actualizada. Ya puedes iniciar sesión.");
      await supabase.auth.signOut();

      window.history.replaceState(null, "", window.location.pathname);

      setTimeout(() => {
        navigate("/log-in");
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm" style={{ maxWidth: "500px" }}>
        <div className={cn("flex flex-col gap-6")}>
          <Card className="pt-5 pb-5">
            <CardHeader>
              <CardTitle className="text-2xl text-center max-w-xs mx-auto">
                Recuperación de contraseña
              </CardTitle>
              <CardDescription className="text-center">
                Introduzca su nueva contraseña.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="flex flex-col gap-6">
                <Input
                  type="password"
                  placeholder="*****"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Procesando..." : "Restablecer"}
                </Button>
                {mensaje && (
                  <p className="text-sm text-center text-muted-foreground">
                    {mensaje}
                  </p>
                )}
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
