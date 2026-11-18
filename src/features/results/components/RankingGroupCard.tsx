import type { RankingGroup } from "@/features/results/api/ranking";

const score = (value: number | null | undefined) =>
  value === null || value === undefined ? "Sin nota" : value.toFixed(2);

const missingScoreMessage = (missing?: Array<"PROFESSOR" | "JUROR">) => {
  if (missing?.length === 2) return "Faltan las dos notas";
  if (missing?.includes("PROFESSOR")) return "Falta la nota de profesores";
  if (missing?.includes("JUROR")) return "Falta la nota de jurados";
  return "Nota en proceso";
};

/** Podio de un nivel (HU-04) en el panel de ranking del administrador. */
export function RankingGroupCard({ group }: { group: RankingGroup }) {
  return (
    <div className="overflow-hidden rounded-lg border" aria-label={`Podio ${group.label}`} role="region">
      <div className="border-b bg-muted/40 px-4 py-3">
        <p className="font-medium">{group.label}</p>
      </div>
      {group.podium.length ? (
        <div className="divide-y">
          {group.podium.map((team) => (
            <div key={team.teamId} className="grid gap-2 px-4 py-3 sm:grid-cols-[60px_1fr_100px]">
              <span className="font-semibold">#{team.position}</span>
              <div>
                <p className="font-medium">{team.teamName || team.teamCode}</p>
                <p className="text-xs text-muted-foreground">
                  {team.teamCode} · {team.videogameName || "Sin videojuego"}
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
          No hay grupos con nota en este nivel.
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
