import type { TieGroup } from "@/features/results/api/ranking";
import { groupLabel } from "@/features/results/lib/rankingGroups";
import { formatFinalScore } from "@/features/results/lib/rankingScore";
import {
  formatRegistrationDate,
  orderedTieTeams,
  RESOLVED_BY_REGISTRATION,
  tiePositions,
  tieReason,
} from "@/features/results/lib/tieResolution";

/** Un empate del ranking ya resuelto por fecha de inscripción (HU-47), sin controles para decidir. */
export function ResolvedTieCard({ tie }: { tie: TieGroup }) {
  const teams = orderedTieTeams(tie);
  return (
    <div className="mb-3 rounded-lg border p-4" role="article" aria-label={`Empate ${groupLabel(tie)} ${formatFinalScore(tie.score)}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">
          {groupLabel(tie)} · {formatFinalScore(tie.score)}
        </p>
        <span className="text-xs text-muted-foreground">
          {tiePositions(tie.positions)}
          {tie.affectsPodium ? " · podio" : ""}
        </span>
      </div>
      <span className="mt-2 inline-block rounded bg-green-500/15 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
        {RESOLVED_BY_REGISTRATION}
      </span>
      <ol className="mt-3 space-y-2 text-sm">
        {teams.map((team, index) => {
          const date = formatRegistrationDate(team.registrationDate);
          return (
            <li key={team.teamId} className="flex gap-2">
              <span className="w-5 shrink-0 font-semibold">{tie.positions[0] + index}.</span>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p>{team.teamName || team.teamCode}</p>
                <p className="text-xs text-muted-foreground">
                  {team.teamCode} ·{" "}
                  {date ? (
                    `inscrito el ${date}`
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">Sin fecha de inscripción (va después)</span>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">{tieReason(tie.explanation)}</p>
    </div>
  );
}
