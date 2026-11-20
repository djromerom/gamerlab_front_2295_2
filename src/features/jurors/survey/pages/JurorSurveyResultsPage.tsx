import { editionSemesterLabel } from "@/lib/semesterLabel";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import LayoutApplication from "@/layouts/LayoutApplication";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchEditions, type Edition } from "@/api/editions";
import {
  downloadJurorSurveyExport,
  fetchJurorSurveySummary,
  type JurorSurveyFieldSummary,
  type JurorSurveySummary,
} from "@/features/jurors/survey/api/jurorSurvey";
import { EDITION_TIME_ZONE } from "@/lib/editionDate";
import { SURVEY_SCORES, distributionPercent, formatSurveyAverage } from "@/lib/jurorSurvey";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: EDITION_TIME_ZONE,
});

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

function FieldCard({ field }: { field: JurorSurveyFieldSummary }) {
  const total = SURVEY_SCORES.reduce((sum, score) => sum + (field.distribution[String(score) as "1"] ?? 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium leading-snug">{field.label}</CardTitle>
        <CardDescription>
          {field.average === null ? (
            "Sin respuestas"
          ) : (
            <>
              Promedio{" "}
              <span className="text-2xl font-semibold text-foreground">{formatSurveyAverage(field.average)}</span>{" "}
              / 5
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5" aria-label={`Distribución: ${field.label}`}>
          {[...SURVEY_SCORES].reverse().map((score) => {
            const count = field.distribution[String(score) as "1"] ?? 0;
            const percent = distributionPercent(count, total);
            return (
              <li key={score} className="grid grid-cols-[1.5rem_1fr_4.5rem] items-center gap-2 text-sm">
                <span className="text-right font-medium">{score}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <span className="tabular-nums text-muted-foreground">
                  {count} ({percent}%)
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** HU-17 (ARK-184): resultados de la encuesta de experiencia del jurado (solo Administrador). */
const JurorSurveyResultsPage = () => {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState<number | null>(null);
  const [summary, setSummary] = useState<JurorSurveySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (id: number | null) => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchJurorSurveySummary(id));
    } catch (err) {
      setSummary(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar el resumen de la encuesta.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(editionId);
  }, [load, editionId]);

  useEffect(() => {
    // El selector es opcional: si no cargan las ediciones queda solo la activa.
    fetchEditions()
      .then((list) => setEditions([...list].sort((a, b) => b.year - a.year || b.semester - a.semester)))
      .catch(() => setEditions([]));
  }, []);

  const exportExcel = async () => {
    setExporting(true);
    try {
      const fileName = await downloadJurorSurveyExport(editionId ?? summary?.edition.id);
      toast.success(`Descargado ${fileName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar la encuesta.");
    } finally {
      setExporting(false);
    }
  };

  const totals = summary?.totals;

  return (
    <LayoutApplication breadcrumbs={[{ label: "Encuesta de jurados", href: "/encuesta-jurados" }]}>
      <main className="mx-auto w-full max-w-5xl px-4 pb-10">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Encuesta de experiencia del jurado</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lo que respondieron los jurados al terminar de evaluar sus grupos.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="survey-edition" className="text-sm font-medium">
                Edición
              </label>
              <select
                id="survey-edition"
                value={editionId ?? ""}
                onChange={(e) => setEditionId(e.target.value ? Number(e.target.value) : null)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64"
              >
                <option value="">Edición activa</option>
                {editions.map((edition) => (
                  <option key={edition.id} value={edition.id}>
                    {edition.title} ({editionSemesterLabel(edition)})
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={exportExcel} disabled={exporting || loading || !summary}>
              {exporting ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
              Exportar a Excel
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border p-6 text-muted-foreground">
            <Loader2 className="animate-spin" /> Cargando resultados...
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}

        {!loading && summary && totals && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {summary.edition.title} · {editionSemesterLabel(summary.edition)}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-2xl font-semibold">
                    Respondieron {totals.responses} de {totals.jurorsFinished}
                  </p>
                  <p className="text-sm text-muted-foreground">jurados que ya terminaron de evaluar</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-2xl font-semibold">
                    {totals.jurorsFinished} de {totals.editionJurors}
                  </p>
                  <p className="text-sm text-muted-foreground">jurados de la edición terminaron de evaluar</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-2xl font-semibold">
                    {distributionPercent(totals.responses, totals.jurorsFinished)}%
                  </p>
                  <p className="text-sm text-muted-foreground">de participación en la encuesta</p>
                </CardContent>
              </Card>
            </div>

            {totals.responses === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Todavía nadie ha respondido la encuesta en esta edición.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {summary.fields.map((field) => (
                <FieldCard key={field.key} field={field} />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="size-5" aria-hidden /> Comentarios y sugerencias
                </CardTitle>
                <CardDescription>
                  {summary.comments.length === 1
                    ? "1 jurado dejó un comentario."
                    : `${summary.comments.length} jurados dejaron un comentario.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay comentarios.</p>
                ) : (
                  <ul className="space-y-3">
                    {summary.comments.map((comment) => (
                      <li key={`${comment.email}-${comment.createdAt}`} className="rounded-lg border p-4 sm:px-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <p className="font-medium">
                            {comment.jurorName}{" "}
                            <span className="text-xs font-normal text-muted-foreground">· {comment.role}</span>
                          </p>
                          <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </time>
                        </div>
                        <p className="break-all text-xs text-muted-foreground">{comment.email}</p>
                        <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed">{comment.comments}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </LayoutApplication>
  );
};

export default JurorSurveyResultsPage;
