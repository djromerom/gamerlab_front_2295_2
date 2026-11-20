import { useCallback, useEffect, useState } from "react";
import {
  fetchFinalGradeRelease,
  setFinalGradeRelease,
  type FinalGradeRelease,
} from "@/features/results/api/finalGrade";
import { fetchShowRanking } from "@/features/editions/api/eventSettings";

interface Options {
  /** Recibe el estado del ranking público después de ocultar las notas (el back también lo apaga, BG-67). */
  onRankingChange?: (showRanking: boolean) => void;
}

/** Estado de la liberación de la nota final para la tarjeta de Configuración del evento (HU-46, ARK-302). */
export function useFinalGradeRelease({ onRankingChange }: Options = {}) {
  const [release, setRelease] = useState<FinalGradeRelease | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRelease(await fetchFinalGradeRelease());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar la publicación de notas.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Guarda el cambio; si el back lo rechaza, lanza el error con su mensaje para que la tarjeta se revierta. */
  const save = useCallback(
    async (show: boolean) => {
      const updated = await setFinalGradeRelease(show);
      setRelease(updated);
      if (!show) {
        // Si no se puede releer, el back igual lo apagó: se deja apagado.
        const showRanking = await fetchShowRanking().catch(() => false);
        onRankingChange?.(showRanking);
      }
    },
    [onRankingChange],
  );

  return { release, loadError, reload: load, save };
}
