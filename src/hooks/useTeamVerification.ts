import { useCallback, useEffect, useState } from "react";
import {
  fetchTeamVerificationStatus,
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
  const [isLoading, setIsLoading] = useState(ids.length > 0);

  useEffect(() => {
    if (ids.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetchTeamVerificationStatus(ids)
      .then((data) => !cancelled && setStatus(data))
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

  return { isLoading, isVerified, markVerified };
}
