import { apiFetch } from "@/lib/api";
import { AVERAGES_HIDDEN_MESSAGE } from "@/lib/averages";
import { findMyTeam } from "@/lib/opaqueKeys";
"use client"



import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import JudgesGrades from "@/components/grupo 5/JudgesGrades"

import TeamCode from "@/components/grupo 5/TeamCode.tsx"
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"
import { useAuth } from "@/contexts/AuthContext"
import { Team } from "@/types/Team";

const SCORE_PENDING_MESSAGE = "Nota en proceso";

export default function Scoreboard() {
  // obtain permission for viewing student grades.
  const ratingsACRef = useRef<AbortController | null>(null)
  const { canViewScores } = useGlobalState()
  const [loading, setLoading] = useState(true)

  // HU-30: el estudiante ve solo la nota final. null = el equipo todavía no tiene nota.
  const [generalGrade, setGeneralGrade] = useState<number | null>(null);
  // true cuando el backend oculta la nota porque el ranking no está publicado (responde 403)
  const [scoresHidden, setScoresHidden] = useState(false);

  const [team, setTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const { user, userRole } = useAuth();

  if (userRole === undefined) {
    return null;
  }

  if (userRole !== "Estudiante") {
    return null;
  }


  // 1. Traer todos los teams
  useEffect(() => {
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
  }, []);

  //   2. Filtrar team cuando user.id YA EXISTE y teams YA ESTÁN CARGADOS
  useEffect(() => {
    if (!user?.id || teams.length === 0) return;

    const userTeam = findMyTeam(teams);
    setTeam(userTeam);

  }, [user?.id, teams]);


  useEffect(() => {
    if (!team || !canViewScores) {
      setGeneralGrade(null);
      setScoresHidden(false);
      setLoading(false);
      return;
    }

    // cancelar petición previa y crear una nueva controller local
    ratingsACRef.current?.abort();
    const controller = new AbortController();
    ratingsACRef.current = controller;
    setLoading(true);

    (async () => {
      try {
        const response = await apiFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/final-score/team/${team.id}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          }
        );

        if (response.status === 403) {
          setScoresHidden(true);
          setGeneralGrade(null);
          return;
        }

        if (!response.ok) {
          console.warn("Error fetching team scores:", response.status);
          setScoresHidden(false);
          setGeneralGrade(null);
          return;
        }

        const data = await response.json().catch(() => null);
        const item = Array.isArray(data) && data.length > 0 ? data[0] : null;

        setScoresHidden(false);
        setGeneralGrade(item?.finalScore ?? null);
      } catch (err: any) {
        if (err.name === "AbortError") {
          // petición abortada intencionalmente — ignorar
          return;
        }
        console.error("Error fetching team scores:", err);
        setScoresHidden(false);
        setGeneralGrade(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [team, canViewScores]);

  const renderStars = (rating: number) => {
    const starSize = "w-5 h-8 sm:w-6 sm:h-10 md:w-7 md:h-12"
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className={`${starSize} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className={`${starSize} text-yellow-400`} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="100%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#halfGradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className={`${starSize} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    return stars
  }

  // Loading / permission states
  if (canViewScores === null) {
    return <LoadingScreen text="Verificando permisos para ver calificaciones..." />
  }


  // Permission denied
  if (canViewScores === false) {
    return (
      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full sm:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <TeamCode variant="default" />
        <Card className="w-full shadow-sm border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-lg sm:text-xl font-medium text-foreground">Calificaciones no disponibles</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-foreground/50">
              Las calificaciones aún no han sido publicadas. ¡Próximamente!
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-foreground/70">Cuando el administrador habilite la publicación, aquí estará disponible tu calificación.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen text="Cargando información de calificaciones..." />
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full sm:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 min-w-[350px]">
      {/* Team code */}
      <TeamCode variant="default" />
      {/* finished teamCode */}
      <Card className="w-full shadow-sm border  ">
        <CardHeader className="p-4 sm:p-6 pb-2">

          <CardTitle className="text-lg sm:text-xl font-medium text-foreground">Nota final del equipo</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-foreground/50">
            Las entregas son evaluadas según las especificaciones del proyecto. Esta es la nota general final de tu grupo, la misma del ranking.
          </CardDescription>
        </CardHeader>
        {/* circulo de calificacion */}
        <CardContent className="p-3 sm:p-6 pt-2 space-y-3 sm:space-y-4">
          {scoresHidden ? (
            <p className="text-center text-sm sm:text-base text-muted-foreground py-6">{AVERAGES_HIDDEN_MESSAGE}</p>
          ) : generalGrade === null ? (
            <p className="text-center text-sm sm:text-base text-muted-foreground py-6">{SCORE_PENDING_MESSAGE}</p>
          ) : (
          <div className="flex flex-col items-center mb-6 sm:mb-10">
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60">
              <svg className="absolute inset-0 w-full h-full border-accent rounded-full border-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="6"
                  strokeDasharray="289.026"
                  strokeDashoffset={289.026 - (289.026 * generalGrade / 5)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              {/* tamaño de estrella */}
              <div className="absolute inset-0 flex flex-col items-center">
                <span className="text-4xl sm:text-5xl md:text-6xl font-bold pt-8 sm:pt-10 md:pt-10">{generalGrade.toFixed(2)}</span>
                <div className="flex mt-1 sm:mt-2">{renderStars(generalGrade)}</div>
                <span className="text-xs sm:text-sm md:text-base text-foreground mt-1">de 5.0</span>
              </div>
            </div>

            <div className="text-sm sm:text-base md:text-lg font-semibold text-foreground mt-3 sm:mt-4 flex items-center flex-wrap justify-center gap-1">
              <span>Nota general final</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1" title="¿Cómo calculamos el promedio?" aria-label="¿Cómo calculamos el promedio?">
                      <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Promedio ponderado de todas las calificaciones</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
      <JudgesGrades />
    </div>
  )
}