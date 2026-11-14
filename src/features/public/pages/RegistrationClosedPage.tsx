import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArkadBackground } from "@/components/background/ArkadBackground";

export default function RegistrationClosedPage() {
  const navigate = useNavigate();
  return (
    <>
      <ArkadBackground modo="lento" estiloNuevo />
    <div className="dark relative z-10 flex min-h-screen flex-col items-center justify-center p-6 text-center text-white">
      {/* Panel de vidrio desenfocado: el texto no se mezcla con el logo y las líneas del fondo */}
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-[rgba(201,214,255,0.22)] bg-[rgba(5,10,36,0.55)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] [-webkit-backdrop-filter:blur(14px)] [backdrop-filter:blur(14px)] sm:px-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Inscripciones cerradas
        </h1>
        <p className="max-w-md text-gray-300">
          Las inscripciones de equipos por la web no están disponibles por ahora.
        </p>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    </div>
    </>
  );
}
