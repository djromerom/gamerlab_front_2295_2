import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBogotaTime } from "@/features/jurors/presence/api/jurorPresence";
import { useSubstituteNotices } from "@/features/jurors/substitutes/contexts/SubstituteNoticesContext";
import { PENDING_GRADING_PATH, groupsLabel } from "@/features/jurors/substitutes/lib/substituteGuide";

/**
 * Aviso «Te asignaron grupos» (HU-22, CU-22). Se queda en todas las pantallas del suplente
 * hasta que lo marque como leído; muestra los grupos y su nivel. Se puede minimizar para ver la
 * pantalla de abajo (en el celular ocupa casi todo), pero no desaparece hasta marcarlo leído.
 */
export function SubstituteNoticeCard() {
  const { unread, markingId, markError, markRead, openGuide } = useSubstituteNotices();
  const [minimized, setMinimized] = useState(false);
  const newestId = unread[0]?.id ?? null;
  // Último aviso que ya se mostró: solo uno distinto reabre la tarjeta minimizada.
  const shownId = useRef<number | null>(null);

  useEffect(() => {
    if (newestId === null || newestId === shownId.current) return;
    if (shownId.current !== null) setMinimized(false);
    shownId.current = newestId;
  }, [newestId]);

  if (unread.length === 0) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-violet-500/50 bg-card px-4 py-2 text-sm font-semibold text-card-foreground shadow-xl sm:right-6"
        aria-label={`Te asignaron grupos: ${unread.length} aviso${unread.length === 1 ? "" : "s"} sin leer. Ver aviso`}
      >
        <BellRing className="size-4 text-violet-500" aria-hidden />
        Te asignaron grupos ({unread.length})
      </button>
    );
  }

  return (
    <section
      role="alert"
      aria-labelledby="substitute-notice-title"
      className="fixed inset-x-4 bottom-4 z-40 max-h-[60dvh] overflow-y-auto rounded-lg border border-violet-500/50 bg-card p-4 text-card-foreground shadow-xl sm:left-auto sm:right-6 sm:max-h-[70vh] sm:w-[26rem]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="substitute-notice-title" className="flex items-center gap-2 text-base font-semibold">
          <BellRing className="size-5 text-violet-500" aria-hidden />
          Te asignaron grupos
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setMinimized(true)} aria-label="Minimizar el aviso">
          <ChevronDown className="size-4" aria-hidden />
          Minimizar
        </Button>
      </div>

      <ul className="space-y-3">
        {unread.map((notice) => {
          const marking = markingId === notice.id;
          return (
            <li key={notice.id} className="rounded-md border p-3">
              <p className="mb-2 text-xs text-muted-foreground">
                {groupsLabel(notice.teams.length)} · asignados a las {formatBogotaTime(notice.createdAt)}
              </p>
              <ul className="mb-3 space-y-1 text-sm">
                {notice.teams.map((team) => (
                  <li key={`${notice.id}-${team.teamCode}`} className="flex items-start justify-between gap-2">
                    <span>
                      <span className="font-medium">{team.teamName}</span>
                      <span className="block text-xs text-muted-foreground">
                        <span className="font-mono">{team.teamCode}</span>
                        {team.videogameName ? ` · ${team.videogameName}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs">{team.levelLabel}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void markRead(notice.id)}
                disabled={markingId !== null}
                aria-label={`Marcar como leído el aviso de las ${formatBogotaTime(notice.createdAt)}`}
              >
                {marking && <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />}
                {marking ? "Marcando..." : "Marcar como leído"}
              </Button>
            </li>
          );
        })}
      </ul>

      {markError && (
        <p role="status" className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm">
          {markError}
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Pídele a cada equipo su código de verificación: sin ese código no puedes calificar.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link to={PENDING_GRADING_PATH}>Ver mis grupos</Link>
        </Button>
        <Button type="button" variant="link" size="sm" onClick={openGuide}>
          ¿Qué hace un suplente?
        </Button>
      </div>
    </section>
  );
}
