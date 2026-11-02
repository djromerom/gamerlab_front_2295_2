import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function RegistrationClosedPage() {
  const navigate = useNavigate();
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center gap-4 bg-[#060312] p-6 text-center text-white">
      <h1 className="text-3xl font-bold tracking-tight">
        Inscripciones cerradas
      </h1>
      <p className="max-w-md text-gray-300">
        Las inscripciones de equipos por la web no están disponibles por ahora.
      </p>
      <Button onClick={() => navigate("/")}>Volver al inicio</Button>
    </div>
  );
}
