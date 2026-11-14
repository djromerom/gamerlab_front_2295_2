import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// Fuente única del progreso de evaluación (GET /evaluation/progress).
// Estadísticas, Estado Eval. y Asignación de jurados usan este mismo dato.
export interface EvaluationProgress {
  completed: number;
  assigned: number;
}

const toCount = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null;

export async function fetchEvaluationProgress(): Promise<EvaluationProgress> {
  const response = await apiFetch(
    `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation/progress`,
    { method: "GET", credentials: "include" },
  );
  if (!response.ok) {
    throw new Error(`Error ${response.status}`);
  }
  const payload = await response.json();
  const completed = toCount(payload?.completed);
  const assigned = toCount(payload?.assigned);
  if (completed === null || assigned === null) {
    throw new Error("Respuesta de progreso inválida");
  }
  return { completed: Math.min(completed, assigned), assigned };
}

export function progressPercentage({ completed, assigned }: EvaluationProgress) {
  if (assigned <= 0) return 0;
  return Math.min(100, Math.max(0, (completed / assigned) * 100));
}

export function useEvaluationProgress() {
  const [progress, setProgress] = useState<EvaluationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setProgress(await fetchEvaluationProgress());
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el progreso de evaluación.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { progress, error, reload };
}
