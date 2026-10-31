import { useCallback, useEffect, useState } from "react";
import {
  fetchTeamVerificationState,
  type TeamVerificationLock,
  type TeamVerificationStatus,
} from "@/fetchs/teamVerification";

/**
 * Estado de verificación (HU-19) de los grupos que el jurado va a calificar.
 * Un grupo sin teamId no se bloquea en el front: el backend valida al guardar la evaluación.
 */
export function useTeamVerification(teamIds: (number | undefined)[]) {
  const ids = [...new Set(teamIds.filter((id): id is number => id !== undefined))];
  const idsKey = ids.join(",");

  const [status, setStatus] = useState<TeamVerificationStatus>({});
  const [locks, setLocks] = useState<Record<number, TeamVerificationLock>>({});
  const [isLoading, setIsLoading] = useState(ids.length > 0);

  useEffect(() => {
    if (ids.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetchTeamVerificationState(ids)
      .then((data) => {
        if (cancelled) return;
        setStatus(data.status);
        setLocks(data.locks);
      })
      // Si falla la consulta se pide el código; verify responde bien si el grupo ya estaba verificado.
      .catch((error) => console.error("Error consultando la verificación de grupos:", error))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const isVerified = useCallback(
    (teamId?: number) => teamId === undefined || status[teamId] === true,
    [status],
  );

  const markVerified = useCallback((teamId: number) => {
    setStatus((prev) => ({ ...prev, [teamId]: true }));
  }, []);

  /** ISO 8601 hasta cuando el grupo está bloqueado por intentos, o null si no lo está / se desconoce. */
  const getLockedUntil = useCallback(
    (teamId?: number): string | null => {
      const lock = teamId === undefined ? undefined : locks[teamId];
      return lock?.locked && lock.lockedUntil ? lock.lockedUntil : null;
    },
    [locks],
  );

  const markLocked = useCallback((teamId: number, lockedUntil: string) => {
    setLocks((prev) => ({ ...prev, [teamId]: { locked: true, lockedUntil } }));
  }, []);

  return { isLoading, isVerified, markVerified, getLockedUntil, markLocked };
}
