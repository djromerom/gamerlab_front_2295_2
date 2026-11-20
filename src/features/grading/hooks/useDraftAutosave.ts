import { useCallback, useEffect, useRef, useState } from "react";
import {
  DraftAutosaver,
  INITIAL_AUTOSAVE_STATE,
  type AutosaveState,
} from "@/features/grading/lib/draftAutosaver";
import {
  clearBackup,
  DraftRequestError,
  fetchDraft,
  fetchDrafts,
  pickInitialDraft,
  readBackup,
  type DraftForm,
  type InitialDraft,
  type ServerDraft,
} from "@/lib/evaluationDrafts";
import { NOT_CHECKED_IN_MESSAGE } from "@/lib/jurorCheckIn";
import { toast } from "sonner";

export interface LoadedDraft extends InitialDraft {
  remote: ServerDraft | null;
}

function resolveInitial(videogameId: number, remote: ServerDraft | null): LoadedDraft {
  const local = readBackup(videogameId);
  const initial = pickInitialDraft(remote, local);
  // El servidor tiene algo más nuevo: la copia local ya no sirve.
  if (initial.source === "server" && local) clearBackup(videogameId);
  return { ...initial, remote };
}

/** Borrador de un juego al abrir el formulario. Sin red, usa la copia local (versión 0). */
export async function loadInitialDraft(videogameId: number): Promise<LoadedDraft> {
  let remote: ServerDraft | null = null;
  try {
    remote = await fetchDraft(videogameId);
  } catch (error) {
    if (!(error instanceof DraftRequestError)) throw error;
    // Sin red o error: se sigue con lo local; si el servidor tenía otro, el 409 lo resuelve.
  }
  return resolveInitial(videogameId, remote);
}

/** Borradores de varios juegos con una sola petición (calificación en lote). */
export async function loadInitialDrafts(videogameIds: number[]): Promise<Map<number, LoadedDraft>> {
  let remotes: ServerDraft[] = [];
  try {
    remotes = await fetchDrafts();
  } catch (error) {
    if (!(error instanceof DraftRequestError)) throw error;
  }
  const byId = new Map(remotes.map((draft) => [draft.videogameId, draft]));
  return new Map(videogameIds.map((id) => [id, resolveInitial(id, byId.get(id) ?? null)]));
}

/** Id fijo del toast «Registra tu llegada…»: si ya está en pantalla, no se apila otro. */
export const NOT_CHECKED_IN_TOAST_ID = "juror-not-checked-in";

/**
 * HU-18: un autoguardador por juego. `start` lo crea con la versión cargada;
 * `schedule` se llama con el formulario completo en cada cambio.
 * BG-71: sin llegada registrada, el autoguardado avisa con un toast una sola vez por pantalla
 * (no uno por cada reintento ni por cada juego del lote). Si después guarda y vuelve a pasar
 * (por ejemplo, anularon la llegada), avisa otra vez.
 */
export function useDraftAutosave() {
  const savers = useRef(new Map<number, DraftAutosaver>());
  const [states, setStates] = useState<Record<number, AutosaveState>>({});
  const warnedNotCheckedIn = useRef(false);

  const start = useCallback((videogameId: number, initial: Pick<LoadedDraft, "version" | "form" | "needsSync">) => {
    savers.current.get(videogameId)?.dispose();
    const saver = new DraftAutosaver({
      videogameId,
      version: initial.version,
      onChange: (state) => {
        setStates((prev) => ({ ...prev, [videogameId]: state }));
        if (state.status === "saved") {
          warnedNotCheckedIn.current = false;
        } else if (state.status === "not-checked-in" && !warnedNotCheckedIn.current) {
          warnedNotCheckedIn.current = true;
          toast.warning(state.message ?? NOT_CHECKED_IN_MESSAGE, {
            id: NOT_CHECKED_IN_TOAST_ID,
            description: "Lo que escribas queda guardado en este dispositivo y se sube cuando registren tu llegada.",
          });
        }
      },
    });
    savers.current.set(videogameId, saver);
    // Lo escrito sin red se sube apenas se abre la pantalla.
    if (initial.needsSync && initial.form) {
      saver.schedule(initial.form);
      void saver.flush();
    }
  }, []);

  const schedule = useCallback((videogameId: number, form: DraftForm) => {
    savers.current.get(videogameId)?.schedule(form);
  }, []);

  const stop = useCallback((videogameId: number) => {
    const saver = savers.current.get(videogameId);
    if (saver) saver.stop();
    else clearBackup(videogameId);
  }, []);

  const resolveConflict = useCallback(
    (videogameId: number, choice: "overwrite" | "load") =>
      savers.current.get(videogameId)?.resolveConflict(choice) ?? null,
    [],
  );

  const stateOf = useCallback(
    (videogameId: number): AutosaveState => states[videogameId] ?? INITIAL_AUTOSAVE_STATE,
    [states],
  );

  useEffect(() => {
    const map = savers.current;
    return () => {
      map.forEach((saver) => saver.dispose());
      map.clear();
    };
  }, []);

  return { start, schedule, stop, resolveConflict, stateOf };
}
