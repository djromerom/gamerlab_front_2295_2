import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRESENCE_LIST_POLL_MS,
  fetchJurorPresence,
  type JurorPresenceList,
  type PresenceFilter,
} from "@/fetchs/jurorPresence";

export type PresenceTab = PresenceFilter | "ALL";

/**
 * Indicadores de presencia de los jurados que llegaron (HU-23). Se actualiza cada 10 s; si una
 * consulta falla, conserva la última lista y deja el error para avisar sin vaciar la tabla.
 */
export function useJurorPresenceList(initialTab: PresenceTab = "ANY", pollMs: number = PRESENCE_LIST_POLL_MS) {
  const [tab, setTab] = useState<PresenceTab>(initialTab);
  const [result, setResult] = useState<JurorPresenceList | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  // Solo vale la respuesta de la última consulta: evita que una lenta pise a una nueva.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await fetchJurorPresence(tab === "ALL" ? undefined : tab);
      if (id !== requestId.current) return;
      setResult(data);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err : new Error("No se pudo cargar la presencia de los jurados."));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    void load();
    const interval = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(interval);
  }, [load, pollMs]);

  return { tab, setTab, result, error, loading, reload: load };
}
