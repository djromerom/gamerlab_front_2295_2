import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyVerificationCode } from "@/fetchs/teamVerification";

/**
 * Código de verificación del equipo (HU-19). El estudiante se lo dice al jurado en el stand
 * para que pueda calificar su grupo. Los equipos de colegios (N0) no tienen código.
 */
export default function VerificationCode() {
    const { userRole } = useAuth();
    const [code, setCode] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        if (userRole !== "Estudiante") return;

        fetchMyVerificationCode()
            .then((data) => setCode(data.verificationCode))
            .catch((error) => {
                console.error(error);
                setCode(null);
            });
    }, [userRole]);

    if (userRole !== "Estudiante" || code === null) {
        return null;
    }

    return (
        <div className="flex flex-col border-2 rounded-2xl p-4 h-full justify-evenly border-border bg-card max-w-[320px]">
            <div className="flex justify-center text-4xl border-b-2 border-border pb-2">
                <h1 className="font-bold tracking-tighter text-center">Código de verificación</h1>
            </div>
            <div className="flex justify-center">
                <p className="font-bold font-mono in-dark:text-purple-400 tracking-widest text-4xl p-5">
                    {code ?? "Cargando..."}
                </p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
                Díselo al jurado cuando llegue a tu stand para que pueda calificar a tu equipo.
            </p>
        </div>
    );
}
