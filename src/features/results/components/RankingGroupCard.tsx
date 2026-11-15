import type { RankingGroup } from "@/features/results/api/ranking";
import { levelFromTeamCode } from "@/features/results/lib/rankingGroups";

const score = (value: number | null | undefined) =>
  value === null || value === undefined ? "Sin nota" : value.toFixed(2);

const missingScoreMessage = (missing?: Array<"PROFESSOR" | "JUROR">) => {
  if (missing?.length === 2) return "Faltan las dos notas";
  if (missing?.includes("PROFESSOR")) return "Falta la nota de profesores";
  if (missing?.includes("JUROR")) return "Falta la nota de jurados";
  return "Nota en proceso";
};

/** Podio de un nivel o del grupo Externos (HU-04, HU-38) en el panel de ranking del administrador. */
export function RankingGroupCard({ group }: { group: RankingGroup }) {
  const originLevel = (teamCode: string) => {
    const level = levelFromTeamCode(teamCode);
    return group.external && level !== null ? ` · nivel ${level}` : "";
  };

  return (
    <div className="overflow-hidden rounded-lg border" aria-label={`Podio ${group.label}`} role="region">
      <div className="border-b bg-muted/40 px-4 py-3">
        <p className="font-medium">{group.label}</p>
        {group.external && (
          <p className="text-xs text-muted-foreground">
            Equipos externos de cualquier nivel. Tienen su propio podio y no compiten en su nivel.
          </p>
        )}
      </div>
      {group.podium.length ? (
        <div className="divide-y">
          {group.podium.map((team) => (
            <div key={team.teamId} className="grid gap-2 px-4 py-3 sm:grid-cols-[60px_1fr_100px]">
              <span className="font-semibold">#{team.position}</span>
              <div>
                <p className="font-medium">{team.teamName || team.teamCode}</p>
                <p className="text-xs text-muted-foreground">
                  {team.teamCode}
                  {originLevel(team.teamCode)} · {team.videogameName || "Sin videojuego"}
                </p>
                {team.lessThanMinEvaluations && (
                  <span className="mt-1 inline-block rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">
                    Menos de 3 evaluaciones
                  </span>
                )}
              </div>
              <span className="text-right text-lg font-semibold">{score(team.finalScore)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">
          {group.external ? "No hay equipos externos con nota." : "No hay grupos con nota en este nivel."}
        </p>
      )}
      {group.withoutScore.length > 0 && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Sin nota: {group.withoutScore.map((team) => `${team.teamCode} (${missingScoreMessage(team.missing)})`).join(", ")}
        </p>
      )}
    </div>
  );
}
