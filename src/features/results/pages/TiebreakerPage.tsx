"use client";

import { useCallback, useEffect, useState } from "react";
import { AppSidebar } from "@/layouts/AppSidebar";
import { PanelBackground } from "@/components/background/PanelBackground";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  decideTie,
  fetchRanking,
  fetchRankingDecisions,
  fetchRankingTies,
  finalizeRanking,
  type RankingDecision,
  type RankingSnapshot,
  type TieGroup,
} from "@/features/results/api/ranking";
import { formatFinalGradeWeighting } from "@/features/results/lib/finalGradeWeights";
import { finalizeSummary, groupLabel, rankingGroups } from "@/features/results/lib/rankingGroups";
import { RankingGroupCard } from "@/features/results/components/RankingGroupCard";

const score = (value: number | null | undefined) =>
  value === null || value === undefined ? "Sin nota" : value.toFixed(2);

export default function TiebreakerPage() {
  const [ranking, setRanking] = useState<RankingSnapshot | null>(null);
  const [ties, setTies] = useState<TieGroup[]>([]);
  const [decisions, setDecisions] = useState<RankingDecision[]>([]);
  const [top, setTop] = useState("3");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [useRegistration, setUseRegistration] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const options = {
        level: level === "" ? undefined : Number(level),
        top: Number(top),
      };
      const [snapshot, pending, history] = await Promise.all([
        fetchRanking(options),
        fetchRankingTies("PENDING", false),
        fetchRankingDecisions(),
      ]);
      setRanking(snapshot);
      setTies(pending);
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

  const startResolution = (tie: TieGroup) => {
    setResolving(tie.tieKey);
    setOrder(tie.teams.map((team) => team.teamId));
    setReason("");
    setUseRegistration(false);
  };

  const moveTeam = (teamId: number, direction: -1 | 1) => {
    setOrder((current) => {
      const index = current.indexOf(teamId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };

  const submitResolution = async (tie: TieGroup) => {
    setError("");
    setNotice("");
    if (!reason.trim()) {
      setError("El motivo es obligatorio para registrar la decisión.");
      return;
    }
    try {
      await decideTie({
        tieKey: tie.tieKey,
        editionId: tie.editionId,
        reason: reason.trim(),
        useRegistration: useRegistration || undefined,
        orderedTeamIds: useRegistration ? undefined : order,
      });
      setNotice("Decisión registrada correctamente");
      setResolving(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la decisión");
    }
  };

  const finalize = async () => {
    if (!ranking) return;
    if (ranking.pendingTies > 0) {
      setError("Resuelve los empates pendientes antes de definir el ranking final.");
      return;
    }
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
              {[0, 1, 2, 3, 4].map((item) => <option key={item} value={item}>N{item}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm">
              Lugares por nivel
              <select value={top} onChange={(event) => setTop(event.target.value)} className="h-9 rounded-md border bg-background px-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void load()} className="h-9 rounded-md border px-4 text-sm hover:bg-accent">Actualizar</button>
            <button type="button" onClick={() => void finalize()} disabled={ranking !== null && ranking.pendingTies > 0} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Definir ranking final</button>
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
                <h2 className="text-lg font-medium">Ganadores por nivel y externos</h2>
                {level !== "" && (
                  <p className="text-sm text-muted-foreground">Con un nivel elegido no se muestra el grupo Externos, que mezcla niveles.</p>
                )}
                {ranking && rankingGroups(ranking).map((group) => <RankingGroupCard key={group.label} group={group} />)}
              </section>

              <aside className="space-y-5">
                <section>
                  <h2 className="mb-2 text-lg font-medium">Empates pendientes ({ties.length})</h2>
                  {ties.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hay empates pendientes.</p>}
                  {ties.map((tie) => (
                    <div key={tie.tieKey} className="mb-3 rounded-lg border p-4">
                      <p className="font-medium">{groupLabel(tie)} · {score(tie.score)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{tie.explanation}</p>
                      {tie.rule === "REGISTRATION" && <p className="mt-2 text-xs">Se resolverá por inscripción más antigua.</p>}
                      {resolving === tie.tieKey ? (
                        <div className="mt-3 space-y-2">
                          {!useRegistration && tie.teams.map((teamId, index) => {
                            const team = tie.teams.find((item) => item.teamId === order[index]);
                            if (!team) return null;
                            return (
                              <div key={team.teamId} className="flex items-center gap-2 rounded border px-2 py-1 text-sm">
                                <span className="flex-1">{team.teamName || team.teamCode}</span>
                                <button type="button" disabled={index === 0} onClick={() => moveTeam(team.teamId, -1)}>↑</button>
                                <button type="button" disabled={index === tie.teams.length - 1} onClick={() => moveTeam(team.teamId, 1)}>↓</button>
                              </div>
                            );
                          })}
                          {tie.rule === "PROFESSOR" && (
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={useRegistration} onChange={(event) => setUseRegistration(event.target.checked)} />
                              Aplicar criterio de inscripción
                            </label>
                          )}
                          <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} placeholder="Motivo (obligatorio)" className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" />
                          <button type="button" onClick={() => void submitResolution(tie)} className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground">Guardar decisión</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => startResolution(tie)} className="mt-3 h-8 rounded-md border px-3 text-sm">Resolver</button>
                      )}
                    </div>
                  ))}
                </section>

                <section>
                  <h2 className="mb-2 text-lg font-medium">Decisiones registradas</h2>
                  {decisions.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">Todavía no hay decisiones.</p>}
                  {decisions.map((decision) => (
                    <div key={decision.id} className="mb-2 rounded-lg border p-3 text-sm">
                      <p><strong>{groupLabel(decision)}</strong> · {decision.method}</p>
                      <p className="text-muted-foreground">{decision.reason || "Criterio de inscripción"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{decision.decidedBy.name}</p>
                    </div>
                  ))}
                </section>
              </aside>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
