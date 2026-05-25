"use client";

import { useState, useEffect } from "react";
import { useFetch } from "@/hooks/useFetch";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { ArrowUpDown, RefreshCcw } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamFinalScore {
  teamId: number;
  teamCode: string;
  teamName: string;
  videogameId: number;
  videogameName: string;
  editionId: number;
  finalScore: number;
  rankingScore: number;
  wasTied: boolean;
  tieBreakerScore: number | null;
  jurorTieBreakerScore: number | null;
  professorTieBreakerScore: number | null;
}

type TiedGroup = [string, TeamFinalScore[]];

// ─── Constants ────────────────────────────────────────────────────────────────

const SEMESTER_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Semestre 1", value: "n1" },
  { label: "Semestre 2", value: "n2" },
  { label: "Semestre 3", value: "n3" },
  { label: "Semestre 4", value: "n4" },
  { label: "Décimo semestre", value: "n10" },
  { label: "Colegios", value: "n0" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatScore = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return value.toFixed(2);
};

const normalizeTeam = (item: Record<string, unknown>): TeamFinalScore => {
  const finalScore = toNumber(item.finalScore ?? item.final_score ?? item.finalscore);

  return {
    teamId: toNumber(item.teamId ?? item.team_id),
    teamCode: String(item.teamCode ?? item.team_code ?? ""),
    teamName: String(item.teamName ?? item.team_name ?? item.teamCode ?? item.team_code ?? "Sin equipo"),
    videogameId: toNumber(item.videogameId ?? item.videogame_id),
    videogameName: String(item.videogameName ?? item.videogame_name ?? "Sin videojuego"),
    editionId: toNumber(item.editionId ?? item.edition_id),
    finalScore,
    rankingScore: toNumber(item.rankingScore ?? item.ranking_score ?? finalScore, finalScore),
    wasTied: Boolean(item.wasTied ?? item.was_tied ?? false),
    tieBreakerScore: toNullableNumber(item.tieBreakerScore ?? item.tie_breaker_score),
    jurorTieBreakerScore: toNullableNumber(item.jurorTieBreakerScore ?? item.juror_tie_breaker_score),
    professorTieBreakerScore: toNullableNumber(item.professorTieBreakerScore ?? item.professor_tie_breaker_score),
  };
};

const groupTiedTeams = (teams: TeamFinalScore[]): TiedGroup[] => {
  const tied = teams.filter((t) => t.wasTied);

  const grouped = tied.reduce<Record<string, TeamFinalScore[]>>((acc, team) => {
    const key = `${team.editionId}-${team.finalScore.toFixed(2)}`;
    (acc[key] ??= []).push(team);
    return acc;
  }, {});

  return Object.entries(grouped).filter(([, group]) => group.length > 1);
};

const sortByTieBreaker = (teams: TeamFinalScore[]): TeamFinalScore[] =>
  [...teams].sort((a, b) => (b.tieBreakerScore ?? -Infinity) - (a.tieBreakerScore ?? -Infinity));

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormulaCard() {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
      <p className="text-muted-foreground">Fórmula de desempate (calculada automáticamente):</p>
      <p className="mt-1 font-medium">70% promedio de jurados + 30% promedio de profesores</p>
    </div>
  );
}

function SemesterFilters({
  active,
  onChange,
}: {
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SEMESTER_FILTERS.map(({ label, value }) => (
        <Button
          key={value}
          size="sm"
          variant={active === value ? "default" : "outline"}
          onClick={() => onChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function TiedGroupTable({ group }: { group: TeamFinalScore[] }) {
  const sorted = sortByTieBreaker(group);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <span className="text-sm font-medium">
          Puntaje base: {formatScore(sorted[0]?.finalScore)}
        </span>
        <span className="text-xs text-muted-foreground">
          {sorted.length} equipos empatados
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Equipo</th>
              <th className="px-4 py-2 font-medium">Videojuego</th>
              <th className="px-4 py-2 font-medium">Puntaje base</th>
              <th className="px-4 py-2 font-medium">Jurados (70%)</th>
              <th className="px-4 py-2 font-medium">Profesores (30%)</th>
              <th className="px-4 py-2 font-medium">Desempate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, index) => (
              <tr
                key={`${team.teamId}-${team.videogameId}`}
                className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{team.teamName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{team.teamCode}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{team.videogameName}</td>
                <td className="px-4 py-3 tabular-nums">{formatScore(team.finalScore)}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatScore(team.jurorTieBreakerScore)}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatScore(team.professorTieBreakerScore)}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">
                  {index === 0 && (
                    <span className="mr-1 text-xs text-emerald-600 font-medium">#1 </span>
                  )}
                  {formatScore(team.tieBreakerScore)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border px-6 py-10 text-center">
      <p className="font-medium">No hay empates activos</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Los grupos aparecerán aquí cuando el sistema detecte equipos con el mismo puntaje base.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TiebreakerPage() {
  const [teams, setTeams] = useState<TeamFinalScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSemester, setActiveSemester] = useState("all");
  const customFetch = useFetch();

  const fetchTeams = async (prefix = activeSemester) => {
    setLoading(true);
    try {
      const res = await customFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/teams/final-score/by-n/${encodeURIComponent(prefix)}`,
        { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } },
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setTeams(data.map(normalizeTeam));
    } catch {
      toast.error("Error al cargar los desempates");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams("all"); }, []);

  const handleFilterChange = (prefix: string) => {
    setActiveSemester(prefix);
    fetchTeams(prefix);
  };

  const tiedGroups = groupTiedTeams(teams);

  return (
    <LayoutAplication breadcrumbs={[{ label: "Desempates", href: "/tiebreaker" }]}>
      <Toaster richColors />

      {loading ? (
        <div className="flex justify-center py-16">
          <p className="text-muted-foreground text-sm">Cargando desempates...</p>
        </div>
      ) : (
        <div className="space-y-5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Gestión de desempates</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Equipos cuyo ranking fue definido por la fórmula automática de desempate.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchTeams()}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>

          <FormulaCard />

          <SemesterFilters active={activeSemester} onChange={handleFilterChange} />

          {tiedGroups.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpDown className="w-4 h-4" />
                <span>
                  {tiedGroups.length} {tiedGroups.length === 1 ? "grupo" : "grupos"} con empate detectado
                </span>
              </div>
              {tiedGroups.map(([key, group]) => (
                <TiedGroupTable key={key} group={group} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      )}
    </LayoutAplication>
  );
}