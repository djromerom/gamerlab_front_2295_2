"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import TeamCode from "@/components/grupo 5/TeamCode.tsx";
import { useAuth } from "@/contexts/AuthContext";
import { fetchStudentFinalGrade, FinalGradeApiError, type StudentFinalGrade } from "@/features/results/api/finalGrade";
import { formatGrade, gradeLabel } from "@/features/results/lib/grades";

export default function Scoreboard() {
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<StudentFinalGrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user || userRole !== "Estudiante") return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchStudentFinalGrade()
      .then((result) => active && setGrade(result))
      .catch((err) => {
        if (!active) return;
        if (err instanceof FinalGradeApiError && err.status === 404) {
          setError("No tienes un equipo asignado en la edición activa.");
        } else {
          setError(err instanceof Error ? err.message : "No se pudo cargar la nota final.");
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, userRole]);

  if (userRole === undefined) return null;
  if (userRole !== "Estudiante") return null;
  if (loading) return <LoadingScreen text="Cargando información de calificaciones..." />;

  const finalGrade = grade?.status === "AVAILABLE" ? formatGrade(grade.finalGrade) : null;
  const finalGradeValue = grade?.status === "AVAILABLE" && typeof grade.finalGrade === "number"
    ? grade.finalGrade
    : null;

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full sm:max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 min-w-0">
      <TeamCode variant="default" />
      <Card className="w-full shadow-sm border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-lg sm:text-xl font-medium text-foreground">Nota final del equipo</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-foreground/50">
            {grade?.team.teamName ?? ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          {error && <p className="text-center text-sm text-destructive py-6">{error}</p>}
          {!error && grade?.status === "REJECTED" && (
            <p className="text-center text-sm sm:text-base text-muted-foreground py-6">
              La inscripción de tu equipo fue rechazada, por eso no tiene nota final
            </p>
          )}
          {!error && grade?.status === "NOT_GRADABLE" && (
            <p className="text-center text-sm sm:text-base text-muted-foreground py-6">
              Tu equipo participa como presentador externo: no recibe calificación
            </p>
          )}
          {!error && grade?.status === "NOT_RELEASED" && (
            <p className="text-center text-sm sm:text-base text-muted-foreground py-6">
              La nota final se publica al terminar la feria
            </p>
          )}
          {!error && grade?.status === "IN_PROCESS" && (
            <p className="text-center text-sm sm:text-base font-medium py-6">Nota en proceso</p>
          )}
          {!error && grade?.status === "AVAILABLE" && finalGrade !== null && (
            <div className="flex flex-col items-center py-4">
              <span className="text-5xl sm:text-6xl font-bold tabular-nums">{finalGrade}</span>
              <span className="mt-2 text-sm text-foreground/70">de 5.0</span>
              {gradeLabel(finalGradeValue) && (
                <span
                  data-testid="grade-label"
                  className="mt-3 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
                >
                  {gradeLabel(finalGradeValue)}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
