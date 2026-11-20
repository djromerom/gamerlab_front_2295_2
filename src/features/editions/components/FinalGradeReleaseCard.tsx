import type React from "react";
import EventSetupCard from "@/features/editions/components/EventSetupCard";
import { useFinalGradeRelease } from "@/features/editions/hooks/useFinalGradeRelease";
import {
  inProcessConfirmMessage,
  inProcessTeams,
  isReleaseLocked,
  releasedAtMessage,
  releaseLockedMessage,
} from "@/features/results/lib/finalGradeRelease";

export const FINAL_GRADE_CARD_TITLE = "Notas finales para los estudiantes";
export const FINAL_GRADE_HIDE_HINT = "Ocultar las notas también oculta el ranking público.";

interface FinalGradeReleaseCardProps {
  /** Estado de «Ranking público» después de ocultar las notas */
  onRankingChange?: (showRanking: boolean) => void;
}

/** HU-46 (ARK-302): interruptor de la nota final, junto a los demás de Configuración del evento. */
const FinalGradeReleaseCard: React.FC<FinalGradeReleaseCardProps> = ({ onRankingChange }) => {
  const { release, loadError, reload, save } = useFinalGradeRelease({ onRankingChange });
  const subtitle = "Permite que cada estudiante vea la nota final de su equipo en «Mis Calificaciones».";

  if (!release) {
    return (
      <EventSetupCard value={false} title={FINAL_GRADE_CARD_TITLE} subtitle={subtitle} disabled>
        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}{" "}
            <button type="button" className="underline cursor-pointer" onClick={() => void reload()}>
              Reintentar
            </button>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        )}
      </EventSetupCard>
    );
  }

  const locked = isReleaseLocked(release);
  const releasedAt = release.showFinalGrade ? releasedAtMessage(release.releasedAt) : null;

  return (
    <EventSetupCard
      value={release.showFinalGrade}
      title={FINAL_GRADE_CARD_TITLE}
      subtitle={subtitle}
      save={save}
      disabled={locked}
      hint={locked ? releaseLockedMessage(release) : FINAL_GRADE_HIDE_HINT}
      confirm={(show) => {
        const message = show ? inProcessConfirmMessage(release) : null;
        if (!message) return null;
        const teams = inProcessTeams(release);
        return {
          title: "Hay notas en proceso",
          action: "Liberar de todos modos",
          description: (
            <>
              <p>{message}</p>
              {teams.length > 0 && (
                <ul className="mt-3 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-left">
                  {teams.map((team) => (
                    <li key={team.teamId}>
                      {team.teamCode} · {team.teamName}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ),
        };
      }}
    >
      {!release.scheduleConfigured && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          La edición no tiene cronograma: se toma las {release.releaseTime} del día de inicio de la feria.
        </p>
      )}
      {releasedAt && <p className="text-xs text-muted-foreground">{releasedAt}</p>}
    </EventSetupCard>
  );
};

export default FinalGradeReleaseCard;
