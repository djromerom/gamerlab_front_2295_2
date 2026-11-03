"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/grupo 9/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { decideTie, fetchMyTies, type TieGroup } from "@/fetchs/ranking";

export default function ProfessorRankingTiesPage() {
  const [ties, setTies] = useState<TieGroup[]>([]);
  const [order, setOrder] = useState<Record<string, number[]>>({});
  const [useRegistration, setUseRegistration] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const result = await fetchMyTies();
      setTies(result);
      setOrder(Object.fromEntries(result.map((tie) => [tie.tieKey, tie.teams.map((team) => team.teamId)])));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los empates");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const moveTeam = (tieKey: string, teamId: number, direction: -1 | 1) => {
    setOrder((current) => {
      const next = [...(current[tieKey] ?? [])];
      const index = next.indexOf(teamId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= next.length) return current;
      [next[index], next[destination]] = [next[destination], next[index]];
      return { ...current, [tieKey]: next };
    });
  };

  const submit = async (tie: TieGroup) => {
    try {
      await decideTie({
        tieKey: tie.tieKey,
        orderedTeamIds: useRegistration[tie.tieKey] ? undefined : order[tie.tieKey],
        useRegistration: useRegistration[tie.tieKey] || undefined,
        reason: reason[tie.tieKey]?.trim() || undefined,
      });
      setNotice("El desempate fue registrado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el desempate");
    }
  };

  const pending = ties.filter((tie) => tie.status === "PENDING");
  const resolved = ties.filter((tie) => tie.status === "RESOLVED");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="font-medium">Empates del ranking</h1>
        </header>
        <main className="mx-auto w-full max-w-4xl p-4">
          {error && <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
          {notice && <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-700">{notice}</div>}
          <section>
            <h2 className="mb-3 text-lg font-medium">Pendientes</h2>
            {pending.length === 0 && <p className="rounded-lg border p-6 text-sm text-muted-foreground">No tienes empates pendientes.</p>}
            {pending.map((tie) => (
              <div key={tie.tieKey} className="mb-4 rounded-lg border p-4">
                <p className="font-medium">N{tie.level} · {tie.score.toFixed(2)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tie.explanation}</p>
                <div className="mt-3 space-y-2">
                  {!useRegistration[tie.tieKey] && (order[tie.tieKey] ?? []).map((teamId, index) => {
                    const team = tie.teams.find((item) => item.teamId === teamId);
                    if (!team) return null;
                    return (
                      <div key={teamId} className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
                        <span className="flex-1">{team.teamName || team.teamCode}</span>
                        <button type="button" disabled={index === 0} onClick={() => moveTeam(tie.tieKey, teamId, -1)}>↑</button>
                        <button type="button" disabled={index === (order[tie.tieKey]?.length ?? 0) - 1} onClick={() => moveTeam(tie.tieKey, teamId, 1)}>↓</button>
                      </div>
                    );
                  })}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={Boolean(useRegistration[tie.tieKey])} onChange={(event) => setUseRegistration((current) => ({ ...current, [tie.tieKey]: event.target.checked }))} />
                    Prefiero aplicar el criterio de inscripción
                  </label>
                  <textarea value={reason[tie.tieKey] ?? ""} onChange={(event) => setReason((current) => ({ ...current, [tie.tieKey]: event.target.value }))} maxLength={300} placeholder="Motivo o explicación opcional" className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" />
                  <button type="button" onClick={() => void submit(tie)} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground">Guardar elección</button>
                </div>
              </div>
            ))}
          </section>
          {resolved.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-lg font-medium">Decididos</h2>
              {resolved.map((tie) => (
                <div key={tie.tieKey} className="mb-2 rounded-lg border p-4 text-sm">
                  <p className="font-medium">N{tie.level} · {tie.score.toFixed(2)} · {tie.decision?.method}</p>
                  <p className="text-muted-foreground">{tie.decision?.reason || tie.explanation}</p>
                </div>
              ))}
            </section>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
