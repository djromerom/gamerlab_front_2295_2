import { useCallback, useEffect, useRef, useState } from "react";
import {
  SUBSTITUTE_NOTICES_POLL_MS,
  fetchUnreadSubstituteNotices,
  type UnreadSubstituteNotices,
} from "@/features/jurors/substitutes/api/substituteNotices";

/**
 * Suplentes con el aviso «Te asignaron grupos» sin leer (HU-22, A1). Se actualiza cada 10 s con
 * el resto del seguimiento; si una consulta falla, conserva la última lista y deja el error.
 */
export function useUnreadSubstituteNotices(pollMs: number = SUBSTITUTE_NOTICES_POLL_MS) {
  const [result, setResult] = useState<UnreadSubstituteNotices | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await fetchUnreadSubstituteNotices();
      if (id !== requestId.current) return;
      setResult(data);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err : new Error("No se pudieron cargar los avisos de los suplentes."));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(interval);
  }, [load, pollMs]);

  return { result, error, loading };
}
