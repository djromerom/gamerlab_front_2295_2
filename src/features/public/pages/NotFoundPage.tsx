import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FondoArkad } from "@/components/fondo/FondoArkad";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <FondoArkad modo="lento" estiloNuevo />
    <div className="dark relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-white">
      <p className="text-6xl font-bold text-[#AC7CFF]">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Página no encontrada</h1>
      <p className="max-w-md text-gray-300">
        La dirección que buscas no existe o fue movida.
      </p>
      <Button onClick={() => navigate("/")}>Volver al inicio</Button>
    </div>
    </>
  );
}
