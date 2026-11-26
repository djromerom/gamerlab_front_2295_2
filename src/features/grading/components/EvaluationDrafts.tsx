import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AutosaveState } from "@/features/grading/lib/draftAutosaver";
import {
  clearBackup,
  discardDraft,
  fetchDrafts,
  formatSavedAgo,
  type ServerDraft,
} from "@/lib/evaluationDrafts";
import { AlertTriangle, Check, CloudOff, FileText, Loader2, MapPin } from "lucide-react";
import { NOT_CHECKED_IN_MESSAGE } from "@/lib/jurorCheckIn";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/** Vuelve a pintar cada minuto para que "hace X min" no se quede quieto. */
function useMinuteTick() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** HU-18: "Guardando… / Guardado hace X" junto al formulario. */
export function DraftSaveIndicator({ state }: { state: AutosaveState }) {
  const now = useMinuteTick();
  const base = "flex items-center gap-1.5 text-xs";

  switch (state.status) {
    case "pending":
    case "saving":
      return (
        <p className={`${base} text-muted-foreground`} role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando borrador…
        </p>
      );
    case "saved":
      return (
        <p className={`${base} text-muted-foreground`} role="status">
          <Check className="h-3.5 w-3.5 text-green-600" /> Borrador guardado{" "}
          {formatSavedAgo(state.savedAt, now)}
        </p>
      );
    case "offline":
      return (
        <p className={`${base} text-amber-700 dark:text-amber-400`} role="status">
          <CloudOff className="h-3.5 w-3.5" /> Sin conexión: el borrador quedó en este dispositivo y se
          sincroniza al volver la red
        </p>
      );
    case "conflict":
      return (
        <p className={`${base} text-amber-700 dark:text-amber-400`} role="status">
          <AlertTriangle className="h-3.5 w-3.5" /> El borrador cambió en otra pestaña o dispositivo
        </p>
      );
    case "not-checked-in":
      // BG-71: no es un error del jurado ni se pierde nada; se resuelve en la mesa de ARKAD.
      return (
        <p className={`${base} text-amber-700 dark:text-amber-400`} role="status">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> {state.message ?? NOT_CHECKED_IN_MESSAGE} El borrador
          quedó en este dispositivo.
        </p>
      );
    case "error":
    case "blocked":
      return (
        <p className={`${base} text-red-600 dark:text-red-400`} role="status">
          <AlertTriangle className="h-3.5 w-3.5" /> {state.message ?? "No se pudo guardar el borrador"}
        </p>
      );
    default:
      return null;
  }
}

/** HU-18: 409 por versión. Cargar lo guardado o sobrescribirlo con lo de esta pantalla. */
export function DraftConflictDialog({
  open,
  remote,
  gameName,
  onLoad,
  onOverwrite,
}: {
  open: boolean;
  remote: ServerDraft | null;
  gameName?: string;
  onLoad: () => void;
  onOverwrite: () => void;
}) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {gameName ? `El borrador de "${gameName}" cambió en otro lugar` : "El borrador cambió en otro lugar"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {remote
              ? `Se guardó otra versión de este borrador ${formatSavedAgo(remote.updatedAt)} desde otra pestaña o dispositivo. ¿Quieres cargar la versión guardada o sobrescribirla con lo que tienes en esta pantalla?`
              : "El borrador se descartó desde otra pestaña o dispositivo. ¿Quieres volver a guardarlo con lo que tienes en esta pantalla?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {remote && (
            <Button variant="outline" className="cursor-pointer" onClick={onLoad}>
              Cargar la versión guardada
            </Button>
          )}
          <Button
            className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] cursor-pointer"
            onClick={onOverwrite}
          >
            {remote ? "Sobrescribir con esta pantalla" : "Guardar de nuevo"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * HU-18: etiqueta "Borrador" en la tarjeta de un juego pendiente.
 * whitespace-normal: en celular el texto baja de línea en vez de ensanchar la tarjeta y sacar el logo.
 */
export function DraftBadge({ updatedAt }: { updatedAt?: string | null }) {
  const ago = formatSavedAgo(updatedAt);
  return (
    <Badge
      variant="warning"
      className="max-w-full whitespace-normal text-left [&>svg]:shrink-0"
      title={ago ? `Borrador guardado ${ago}` : "Tienes un borrador guardado"}>
      <FileText />
      Borrador{ago && ` · guardado ${ago}`}
    </Badge>
  );
}

interface DraftGame {
  id: number;
  nombre: string;
  equipo?: string;
  teamId?: number;
  teamCode?: string;
}

/**
 * HU-18: "Mis borradores" (GET /evaluation/drafts). Funciona aunque las evaluaciones estén cerradas.
 * `ratePath` es la ruta de calificación individual de la pantalla que lo muestra.
 */
export function MyDraftsPanel({
  ratePath,
  games = [],
  onDiscarded,
}: {
  ratePath: string;
  games?: DraftGame[];
  onDiscarded?: (videogameId: number) => void;
}) {
  const navigate = useNavigate();
  const now = useMinuteTick();
  const [drafts, setDrafts] = useState<ServerDraft[] | null>(null);
  const [discarding, setDiscarding] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDrafts()
      .then((list) => !cancelled && setDrafts(list))
      .catch(() => !cancelled && setDrafts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!drafts || drafts.length === 0) return null;

  const handleContinue = (draft: ServerDraft) => {
    const known = games.find((game) => game.id === draft.videogameId);
    const game = known ?? {
      id: draft.videogameId,
      nombre: draft.videogameName,
      equipo: draft.teamName,
      teamId: draft.teamId,
      teamCode: draft.teamCode,
    };
    navigate(`${ratePath}/${draft.videogameId}`, { state: { game } });
  };

  const handleDiscard = async (draft: ServerDraft) => {
    setDiscarding(draft.videogameId);
    try {
      await discardDraft(draft.videogameId);
      clearBackup(draft.videogameId);
      setDrafts((prev) => prev?.filter((d) => d.videogameId !== draft.videogameId) ?? null);
      onDiscarded?.(draft.videogameId);
      toast.success(`Borrador de "${draft.videogameName}" descartado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descartar el borrador");
    } finally {
      setDiscarding(null);
    }
  };

  return (
    <Card className="mx-5 mb-4 py-4">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-lg">Mis borradores ({drafts.length})</CardTitle>
        <CardDescription>
          Calificaciones que empezaste y no has enviado. Se guardan en el servidor, así que puedes
          continuarlas desde cualquier dispositivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <ul className="divide-y">
          {drafts.map((draft) => (
            <li
              key={draft.videogameId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{draft.videogameName}</p>
                <p className="text-sm text-muted-foreground">
                  {draft.teamName} · guardado {formatSavedAgo(draft.updatedAt, now)}
                </p>
                {draft.status === "ALREADY_SUBMITTED" && (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Ya enviaste la evaluación de este juego; este borrador ya no se usa.
                  </p>
                )}
                {draft.status === "NOT_ASSIGNED" && (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {draft.blockedReason || "Ya no puedes calificar este juego."}
                  </p>
                )}
              </div>
              {draft.status === "PENDING" ? (
                <Button
                  size="sm"
                  className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] cursor-pointer"
                  onClick={() => handleContinue(draft)}
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={discarding === draft.videogameId}
                  onClick={() => handleDiscard(draft)}
                >
                  {discarding === draft.videogameId && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Descartar borrador
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
