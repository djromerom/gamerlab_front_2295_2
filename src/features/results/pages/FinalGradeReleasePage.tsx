import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LayoutApplication from "@/layouts/LayoutApplication";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchFinalGradeRelease,
  setFinalGradeRelease,
  type FinalGradeRelease,
  type IncompleteFinalGradeTeam,
} from "@/features/results/api/finalGrade";

const reasonLabels = {
  MISSING_PROFESSOR_SCORE: "Sin nota de los profesores",
  MISSING_JUNIOR_SCORE: "Sin nota de los jurados",
  LESS_THAN_MIN_EVALUATIONS: "Menos de 3 evaluaciones de jurados",
};

function unavailableDate(release: FinalGradeRelease) {
  if (!release.fairDate) return null;
  const [year, month, day] = release.fairDate.split("-");
  return `${day}/${month}/${year}`;
}

function TeamRow({ team }: { team: IncompleteFinalGradeTeam }) {
  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{team.teamCode} · {team.teamName}</p>
          <p className="text-sm text-muted-foreground">{team.videogameName}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {team.juniorEvaluations} junior · {team.seniorEvaluations} senior
        </span>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {team.reasons.map((reason) => (
          <li key={reason} className={team.inProcess ? "text-amber-700 dark:text-amber-400" : ""}>
            {reasonLabels[reason]}
          </li>
        ))}
      </ul>
      {team.inProcess && <p className="mt-2 text-sm font-medium">Nota en proceso</p>}
    </li>
  );
}

const FinalGradeReleasePage = () => {
  const [release, setRelease] = useState<FinalGradeRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRelease(await fetchFinalGradeRelease());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la publicación de notas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (event: FormEvent) => {
    event.preventDefault();
    if (!release) return;
    const show = !release.showFinalGrade;
    if (show && release.summary.inProcess > 0) {
      const confirmed = window.confirm(
        `${release.summary.inProcess} equipos verán "Nota en proceso". ¿Liberar las notas igualmente?`,
      );
      if (!confirmed) return;
    }
    setSaving(true);
    setError(null);
    try {
      setRelease(await setFinalGradeRelease(show));
      toast.success(show ? "Notas finales publicadas" : "Notas finales ocultadas");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la publicación de notas.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutApplication breadcrumbs={[{ label: "Notas finales", href: "/notas-finales" }]}>
      <main className="mx-auto w-full max-w-5xl px-4 pb-10">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">Publicación de notas finales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Controla cuándo los estudiantes pueden ver la nota final de su equipo.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border p-6 text-muted-foreground">
            <Loader2 className="animate-spin" /> Cargando publicación...
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}

        {!loading && release && (
          <div className="space-y-4">
            {!release.scheduleConfigured && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                Esta edición no tiene cronograma configurado. Configure el cierre del evento para definir la hora de publicación.
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{release.editionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {release.showFinalGrade ? "Notas visibles para los estudiantes" : "Notas ocultas para los estudiantes"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Disponible desde las {release.releaseTime}
                      {unavailableDate(release) ? ` del ${unavailableDate(release)}` : ""}.
                    </p>
                  </div>
                  <form onSubmit={update}>
                    <Button type="submit" disabled={saving || (!release.showFinalGrade && !release.canReleaseNow)}>
                      {saving ? <Loader2 className="mr-2 animate-spin" /> : release.showFinalGrade ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
                      {release.showFinalGrade ? "Ocultar notas" : "Liberar notas"}
                    </Button>
                  </form>
                </div>
                {!release.showFinalGrade && !release.canReleaseNow && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    La publicación estará disponible desde las {release.releaseTime} hora de Colombia.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Equipos", release.summary.totalTeams],
                ["Con nota final", release.summary.withFinalGrade],
                ["Nota en proceso", release.summary.inProcess],
                ["Menos de 3 evaluaciones", release.summary.lessThanMinEvaluations],
              ].map(([label, value]) => (
                <Card key={String(label)}>
                  <CardContent className="p-4">
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {release.incompleteTeams.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Equipos con datos incompletos</CardTitle></CardHeader>
                <CardContent>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {release.incompleteTeams.map((team) => <TeamRow key={team.teamId} team={team} />)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </LayoutApplication>
  );
};

export default FinalGradeReleasePage;
