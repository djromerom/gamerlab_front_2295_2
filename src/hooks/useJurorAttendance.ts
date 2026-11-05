import { useCallback, useEffect, useRef, useState } from "react";
import {
  ATTENDANCE_POLL_MS,
  JurorAttendanceError,
  fetchJurorAttendance,
  type AttendanceStatus,
  type JurorAttendanceResult,
} from "@/fetchs/jurorAttendance";

const SEARCH_DELAY_MS = 300;

export type AttendanceTab = AttendanceStatus | "ALL";

/**
 * Lista de asistencia de la edición activa (HU-29). Se actualiza cada 10 s; si una consulta
 * falla, conserva la última tabla y deja el error para mostrar un aviso sin vaciar la pantalla.
 */
export function useJurorAttendance(pollMs: number = ATTENDANCE_POLL_MS) {
  const [tab, setTabState] = useState<AttendanceTab>("ALL");
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<JurorAttendanceResult | null>(null);
  const [error, setError] = useState<JurorAttendanceError | Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  // Solo vale la respuesta de la última consulta: evita que una lenta pise a una nueva.
  const requestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await fetchJurorAttendance({
        status: tab === "ALL" ? undefined : tab,
        search: debouncedSearch,
        page,
      });
      if (id !== requestId.current) return;
      setResult(data);
      setError(null);
      setUpdatedAt(new Date());
      // Si la página quedó fuera de rango (por ejemplo, llegaron jurados y bajó la lista de faltantes)
      if (data.metadata.totalPages > 0 && page > data.metadata.totalPages) setPage(data.metadata.totalPages);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err : new Error("No se pudo cargar la asistencia de los jurados."));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [tab, debouncedSearch, page]);

  useEffect(() => {
    setLoading(true);
    void load();
    const interval = window.setInterval(() => void load(), pollMs);
    return () => window.clearInterval(interval);
  }, [load, pollMs]);

  const setTab = (next: AttendanceTab) => {
    setTabState(next);
    setPage(1);
  };

  const setSearch = (next: string) => {
    setSearchState(next);
    setPage(1);
  };

  return { tab, setTab, search, setSearch, page, setPage, result, error, loading, updatedAt, reload: load };
}
