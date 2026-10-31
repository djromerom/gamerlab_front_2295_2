import { apiFetch } from "@/lib/api";
import { findMyTeam } from "@/lib/opaqueKeys";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Team } from "@/types/Team";

interface TeamCodeProps {
    variant?: "default" | "title";
}

export default function TeamCode({ variant = "default" }: TeamCodeProps) {
    const [team, setTeam] = useState<Team | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const { user, userRole } = useAuth();
    const isStudent = userRole === "Estudiante";

    // [MODIFICADO]: Los hooks van antes de cualquier return condicional (reglas de hooks de React).
    // [ANTES]: Se retornaba null por rol antes de declarar los useEffect.
    // 1. Traer todos los teams
    useEffect(() => {
        if (!isStudent) return;

        const fetchData = async () => {
            try {
                const response = await apiFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/teams`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" }
                });

                if (!response.ok) throw new Error("Error fetching teams");

                const data = await response.json();
                setTeams(data); // guardas todos los equipos
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [isStudent]);

    //   2. Filtrar team cuando user.id YA EXISTE y teams YA ESTÁN CARGADOS
    useEffect(() => {
        if (!user?.id || teams.length === 0) return;

        const userTeam = findMyTeam(teams);
        setTeam(userTeam);

    }, [user?.id, teams]);

    // [MODIFICACIÓN]: Función para extraer y mostrar solo el tercer fragmento (XXX) del código
    // si el usuario pertenece a un equipo "NO colegio" (formato NY-AAA-XXX).
    // [AUTOR]: IA  |  [FECHA]: 2026-05-12
    const formatDisplayTeamCode = (code?: string) => {
        if (!code) return "Cargando...";
        const isUniversityTeam = /^[Nn]\d+-/.test(code);
        if (isUniversityTeam) {
            const parts = code.split("-");
            if (parts.length >= 3) {
                return parts[2];
            }
        }
        return code;
    };

    if (!isStudent) {
        return null;
    }

    if (variant === "default") {
        return (
            <div className="flex justify-start ml-0 m-4 min-w-[350px]">
                <div className="flex justify-between items-center gap-3 rounded-2xl p-0 text-xl border-2 border-border bg-card">
                    {/* [MODIFICACIÓN]: Se muestra el nombre del equipo junto al código (HU-19: el jurado ve ambos). */}
                    {team?.teamName && (
                        <p className="pl-4 p-2 font-semibold text-base text-foreground border-r-2 border-border">{team.teamName}</p>
                    )}
                    <p className={`${team?.teamName ? "" : "pl-4 "}p-2 font-semibold text-base text-foreground`}>Codigo del equipo:</p>
                    {/* [MODIFICADO]: Se usa formatDisplayTeamCode para mostrar solo el tercer fragmento a equipos NO colegio. */}
                    {/* [ANTES]: {team?.teamCode ?? "Cargando..."} */}
                    <p className="leading-tight font-bold p-2 rounded-2xl bg-primary text-primary-foreground">
                        {formatDisplayTeamCode(team?.teamCode)}
                    </p>
                </div>
            </div>
        )
    } else if (variant === "title") {
        return (
            <div className="flex flex-col border-2 rounded-2xl p-4 h-full justify-evenly border-border bg-card">
                <div className="flex justify-center text-4xl border-b-2 border-border pb-2">
                    <h1 className="font-bold tracking-tighter">Equipo</h1>
                </div>
                {/* [MODIFICACIÓN]: Nombre del equipo sobre el código, para que coincida con lo que ve el jurado. */}
                {team?.teamName && (
                    <p className="text-center text-xl font-semibold pt-3 max-w-[320px] break-words">{team.teamName}</p>
                )}
                {/* Etiqueta para no confundirlo con el código de verificación que se muestra al lado */}
                <p className="text-center text-sm text-muted-foreground pt-2">Código del equipo</p>
                <div className="flex justify-center ">
                    {/* [MODIFICADO]: Se usa formatDisplayTeamCode para mostrar solo el tercer fragmento a equipos NO colegio. */}
                    {/* [ANTES]: {team?.teamCode ?? "Cargando..."} */}
                    <p className="font-bold in-dark:text-purple-400 size-20px tracking-tighter text-4xl px-5 pb-5 pt-1 text-shadow-10xl hover:text-purple-600   rounded-lg   hover:scale-105 transition-transform duration-300">
                        {formatDisplayTeamCode(team?.teamCode)}
                    </p>
                </div>
            </div>
        )
    } else {
        return null;
    }
}
