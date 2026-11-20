import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SUBSTITUTE_NOTICES_POLL_MS,
  SUBSTITUTE_NOTICE_NOT_FOUND,
  SubstituteNoticeError,
  fetchMySubstituteNotices,
  isRetryableNoticeError,
  markSubstituteNoticeRead,
  type MySubstituteNotices,
  type SubstituteNotice,
} from "@/features/jurors/substitutes/api/substituteNotices";
import {
  acknowledgeGuide,
  hasAcknowledgedGuide,
  isSubstituteJuror,
  unreadNotices,
} from "@/features/jurors/substitutes/lib/substituteGuide";

export interface SubstituteNoticesState {
  isSubstitute: boolean;
  /** Avisos «Te asignaron grupos» sin leer, el más reciente primero. */
  unread: SubstituteNotice[];
  /** Aviso que se está marcando como leído. */
  markingId: number | null;
  /** Por qué no se pudo marcar (sin conexión o 5xx): el aviso sigue en pantalla. */
  markError: string | null;
  markRead: (id: number) => Promise<void>;
  /** Mostrar la explicación para suplentes. */
  guideOpen: boolean;
  /** Primer ingreso: solo se cierra con «Entendido». */
  guideRequired: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  acknowledge: () => void;
}

const noop = () => {};

export const disabledSubstituteState: SubstituteNoticesState = {
  isSubstitute: false,
  unread: [],
  markingId: null,
  markError: null,
  markRead: async () => {},
  guideOpen: false,
  guideRequired: false,
  openGuide: noop,
  closeGuide: noop,
  acknowledge: noop,
};

/**
 * HU-22 (ARK-85): el suplente se entera en el momento en que le asignan grupos.
 * Consulta `GET /substitute-notices/me?status=all` al abrir, cada 10 s y al volver a la pestaña.
 * Si una consulta falla (sin conexión o 5xx) conserva lo último que mostró.
 */
export function useSubstituteNoticesState(
  userId: string | null,
  pollMs: number = SUBSTITUTE_NOTICES_POLL_MS,
): SubstituteNoticesState {
  const enabled = userId !== null;
  const [result, setResult] = useState<MySubstituteNotices | null>(null);
  // Un 403 no cambia mientras dure la sesión: se deja de consultar.
  const [forbidden, setForbidden] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  // Solo vale la respuesta de la última consulta: evita que una lenta pise a una nueva.
  const requestId = useRef(0);

  const active = enabled && !forbidden;

  useEffect(() => {
    if (enabled) return;
    setResult(null);
    setForbidden(false);
    setGuideOpen(false);
    setAcknowledged(false);
    setMarkError(null);
  }, [enabled]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await fetchMySubstituteNotices("all");
      if (id === requestId.current) setResult(data);
    } catch (err) {
      if (id !== requestId.current || !(err instanceof SubstituteNoticeError)) return;
      if (err.status === 403) setForbidden(true);
      // Sin feria activa no hay avisos.
      if (err.status === 404) setResult(null);
      // Sin conexión o 5xx: se conserva lo último y se reintenta en la siguiente consulta.
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void load();
    const interval = window.setInterval(() => void load(), pollMs);
    // En el celular los temporizadores se pausan con la pantalla apagada: al volver, se consulta ya.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, load, pollMs]);

  const isSubstitute = isSubstituteJuror(result);
  const editionId = result?.edition.id ?? null;

  // Primer ingreso de la edición: la explicación sale sola hasta que marque «Entendido».
  useEffect(() => {
    if (!active || !isSubstitute || userId === null || editionId === null) return;
    const seen = hasAcknowledgedGuide(userId, editionId);
    setAcknowledged(seen);
    if (!seen) setGuideOpen(true);
  }, [active, isSubstitute, userId, editionId]);

  const markRead = useCallback(
    async (id: number) => {
      setMarkingId(id);
      setMarkError(null);
      try {
        const updated = await markSubstituteNoticeRead(id);
        setResult((current) =>
          current
            ? {
                ...current,
                unreadCount: Math.max(0, current.unreadCount - 1),
                data: current.data.map((notice) => (notice.id === id ? { ...notice, readAt: updated.readAt } : notice)),
              }
            : current,
        );
      } catch (err) {
        if (err instanceof SubstituteNoticeError && err.code === SUBSTITUTE_NOTICE_NOT_FOUND) {
          // Ya no existe o no es suyo: se quita y se vuelve a consultar.
          setResult((current) =>
            current ? { ...current, data: current.data.filter((notice) => notice.id !== id) } : current,
          );
          void load();
        } else if (isRetryableNoticeError(err)) {
          setMarkError("No se pudo marcar como leído. Revisa tu conexión e inténtalo de nuevo.");
        } else {
          setMarkError(err instanceof Error ? err.message : "No se pudo marcar el aviso como leído.");
        }
      } finally {
        setMarkingId(null);
      }
    },
    [load],
  );

  const acknowledge = useCallback(() => {
    if (userId !== null && editionId !== null) acknowledgeGuide(userId, editionId);
    // Aunque el navegador no deje guardarlo, en esta sesión ya no se vuelve a pedir.
    setAcknowledged(true);
    setGuideOpen(false);
  }, [userId, editionId]);

  const openGuide = useCallback(() => setGuideOpen(true), []);
  const closeGuide = useCallback(() => setGuideOpen((open) => (acknowledged ? false : open)), [acknowledged]);

  return useMemo(() => {
    if (!active) return disabledSubstituteState;
    return {
      isSubstitute,
      unread: unreadNotices(result?.data ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      markingId,
      markError,
      markRead,
      guideOpen: guideOpen && isSubstitute,
      guideRequired: !acknowledged,
      openGuide,
      closeGuide,
      acknowledge,
    };
  }, [active, isSubstitute, result, markingId, markError, markRead, guideOpen, acknowledged, openGuide, closeGuide, acknowledge]);
}
