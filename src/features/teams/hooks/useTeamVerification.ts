import { useCallback, useEffect, useState } from "react";
import {
  fetchTeamVerificationState,
  type TeamVerificationLock,
  type TeamVerificationStatus,
} from "@/features/teams/api/teamVerification";

/**
 * Estado de verificación (HU-19) de los grupos que el jurado va a calificar.
 * Un grupo sin teamId no se bloquea en el front: el backend valida al guardar la evaluación.
 * HU-50 (ARK-311): un grupo con `required: false` (código desactivado por el administrador, para
 * ese equipo o para todos) cuenta como verificado y se califica sin digitar el código.
 */
export function useTeamVerification(teamIds: (number | undefined)[]) {
  const ids = [...new Set(teamIds.filter((id): id is number => id !== undefined))];
  const idsKey = ids.join(",");

  const [status, setStatus] = useState<TeamVerificationStatus>({});
  const [locks, setLocks] = useState<Record<number, TeamVerificationLock>>({});
  const [required, setRequired] = useState<Record<number, boolean>>({});
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
        setRequired(data.required);
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
    (teamId?: number) =>
      teamId === undefined || status[teamId] === true || required[teamId] === false,
    [status, required],
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

  // Bloqueos cuya hora calculó el front (el backend no la informó): se muestran como «Espera 10 minutos».
  const [estimated, setEstimated] = useState<Record<number, boolean>>({});

  const markLocked = useCallback(
    (teamId: number, lockedUntil: string, isEstimated = false) => {
      setLocks((prev) => ({ ...prev, [teamId]: { locked: true, lockedUntil } }));
      setEstimated((prev) => ({ ...prev, [teamId]: isEstimated }));
    },
    [],
  );

  const isLockEstimated = useCallback(
    (teamId?: number) => teamId !== undefined && estimated[teamId] === true,
    [estimated],
  );

  return {
    isLoading,
    isVerified,
    markVerified,
    getLockedUntil,
    isLockEstimated,
    markLocked,
  };
}
