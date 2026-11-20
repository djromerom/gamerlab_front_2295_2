"use client";

import { useCallback, useEffect, useState } from "react";
import { AppSidebar } from "@/layouts/AppSidebar";
import { PanelBackground } from "@/components/background/PanelBackground";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  fetchRanking,
  fetchRankingDecisions,
  fetchRankingTies,
  finalizeRanking,
  type RankingDecision,
  type RankingSnapshot,
  type TieGroup,
} from "@/features/results/api/ranking";
import { formatFinalGradeWeighting } from "@/features/results/lib/finalGradeWeights";
import { finalizeSummary, groupLabel } from "@/features/results/lib/rankingGroups";
import { RankingGroupCard } from "@/features/results/components/RankingGroupCard";
import { ResolvedTieCard } from "@/features/results/components/ResolvedTieCard";
import { decisionMethodLabel, tieReason } from "@/features/results/lib/tieResolution";

export default function TiebreakerPage() {
  const [ranking, setRanking] = useState<RankingSnapshot | null>(null);
  const [ties, setTies] = useState<TieGroup[]>([]);
  const [decisions, setDecisions] = useState<RankingDecision[]>([]);
  const [top, setTop] = useState("3");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const options = {
        level: level === "" ? undefined : Number(level),
        top: Number(top),
      };
      // HU-47 (ARK-305): todos los empates llegan resueltos por inscripción; se muestran todos
      const [snapshot, allTies, history] = await Promise.all([
        fetchRanking(options),
        fetchRankingTies(),
        fetchRankingDecisions(),
      ]);
      setRanking(snapshot);
      setTies(options.level === undefined ? allTies : allTies.filter((tie) => tie.level === options.level));
      setDecisions(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el ranking");
    } finally {
      setLoading(false);
    }
  }, [level, top]);

  useEffect(() => {
    void load();
  }, [load]);

  const finalize = async () => {
    if (!ranking) return;
    if (!window.confirm("Definir el ranking final reemplazará el resultado guardado actualmente. ¿Deseas continuar?")) {
      return;
    }
    try {
      setError("");
      const result = await finalizeRanking(ranking.editionId);
      setNotice(finalizeSummary(result));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo definir el ranking final");
    }
  };

  return (
    <SidebarProvider>
      <PanelBackground />
      <AppSidebar />
      <SidebarInset className="max-md:bg-transparent">
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="font-medium">Ranking oficial y desempates</h1>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select value={level} onChange={(event) => setLevel(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Todos los niveles</option>
              {[0, 1, 2, 3, 4, 10].map((item) => <option key={item} value={item}>N{item}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              Lugares por nivel
              <select value={top} onChange={(event) => setTop(event.target.value)} className="h-9 rounded-md border bg-background px-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void load()} className="h-9 rounded-md border px-4 text-sm hover:bg-accent">Actualizar</button>
            <button type="button" onClick={() => void finalize()} disabled={ranking === null} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Definir ranking final</button>
          </div>

          {ranking && !ranking.weighting.configured && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              La edición no tiene ponderación configurada; no se mostrará la fórmula vigente.
            </div>
          )}
          {ranking?.weighting.configured && (
            <div className="mb-4 text-sm text-muted-foreground">
              {formatFinalGradeWeighting(ranking.weighting.seniorPct, ranking.weighting.juniorPct)}
            </div>
          )}
          {ranking?.finalized && (
            <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-700">
              Ranking final definido {ranking.finalized.matchesCurrent ? "con las notas actuales" : "antes de cambios recientes en las notas"}.
            </div>
          )}
          {error && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
          {notice && <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-700">{notice}</div>}

          {loading ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">Cargando ranking...</div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <section className="space-y-5">
                <h2 className="text-lg font-medium">Ganadores por nivel</h2>
                {ranking?.levels.map((group) => <RankingGroupCard key={group.label} group={group} />)}
              </section>

              <aside className="space-y-5">
                <section>
                  <h2 className="mb-1 text-lg font-medium">Empates ({ties.length})</h2>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Se resuelven solos por fecha de inscripción: primero el grupo inscrito antes y, con la misma fecha, el de id menor.
                  </p>
                  {ties.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hay empates.</p>}
                  {ties.map((tie) => <ResolvedTieCard key={tie.tieKey} tie={tie} />)}
                </section>

                {decisions.length > 0 && (
                  <section>
                    <h2 className="mb-1 text-lg font-medium">Decisiones anteriores</h2>
                    <p className="mb-2 text-xs text-muted-foreground">Quedan como historial: ya no cambian el orden del ranking.</p>
                    {decisions.map((decision) => (
                      <div key={decision.id} className="mb-2 rounded-lg border p-3 text-sm">
                        <p><strong>{groupLabel(decision)}</strong> · {decisionMethodLabel(decision.method)}</p>
                        <p className="text-muted-foreground">{decision.reason ? tieReason(decision.reason) : "Criterio de inscripción"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{decision.decidedBy.name}</p>
                      </div>
                    ))}
                  </section>
                )}
              </aside>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
