import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { useState } from "react";
import { useAuthContext } from "../../../context/AuthContext";

export const ForgotPasswwordButton = () => {
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState("");
  const { resetPassword } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");

  const esCorreoValido = (correo: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const handleSent = () => {
    if (esCorreoValido(email)) {
      setIsSent(true);
      resetPassword(email);
    } else {
      setErrorMessage("Correo invalido");
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <a href="#" className="underline underline-offset-4">
          Olvidé mi contraseña
        </a>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recuperar contraseña</AlertDialogTitle>
          <AlertDialogDescription>
            Introduzca su correo electonico, un mensaje de recuperación de
            constraseña será enviado.
            <Input
              className="mt-3"
              type="email"
              placeholder="m@example.com"
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {errorMessage && <p className=" text-red-600">{errorMessage}</p>}
          {isSent ? (
            <>
              Si la dirección ingresada está registrada, recibirás un correo
              para restablecer la contraseña.
              <AlertDialogAction
                onClick={() => {
                  setIsSent(false);
                  setErrorMessage("");
                }}
              >
                Cerrar
              </AlertDialogAction>
            </>
          ) : (
            <>
              <AlertDialogCancel
                onClick={() => {
                  setErrorMessage("");
                }}
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                onClick={() => {
                  handleSent();
                }}
              >
                Enviar
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
