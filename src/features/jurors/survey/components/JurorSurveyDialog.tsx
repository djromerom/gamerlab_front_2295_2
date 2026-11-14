import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SURVEY_MAX_COMMENTS,
  SURVEY_QUESTIONS,
  SURVEY_SCORES,
  buildSurveyPayload,
  emptySurveyAnswers,
  missingSurveyAnswers,
  type SurveyAnswers,
  type SurveyFieldKey,
} from "@/lib/jurorSurvey";
import { JurorSurveyApiError, submitJurorSurvey } from "@/features/jurors/survey/api/jurorSurvey";

interface JurorSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La encuesta quedó guardada (201 o 409): ya no hay que ofrecerla. */
  onAnswered: () => void;
  /** El back dijo que ya no está disponible (403): hay que volver a consultar el estado. */
  onUnavailable?: () => void;
}

/**
 * HU-17 (ARK-184): formulario de la encuesta de experiencia del jurado.
 * Lo elegido se conserva al cerrar con «Omitir» y si falla el envío, para reintentar.
 */
export function JurorSurveyDialog({ open, onOpenChange, onAnswered, onUnavailable }: JurorSurveyDialogProps) {
  const [answers, setAnswers] = useState<SurveyAnswers>(emptySurveyAnswers);
  const [comments, setComments] = useState("");
  const [showMissing, setShowMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedOnce, setFailedOnce] = useState(false);
  const [thanks, setThanks] = useState<string | null>(null);

  const missing = missingSurveyAnswers(answers);
  const missingMessage =
    showMissing && missing.length > 0
      ? missing.length === 1
        ? "Falta 1 pregunta por responder."
        : `Faltan ${missing.length} preguntas por responder.`
      : null;
  const shownError = missingMessage ?? error;

  const choose = (key: SurveyFieldKey, score: number) => {
    setAnswers((prev) => ({ ...prev, [key]: score }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const payload = buildSurveyPayload(answers, comments);
    if (!payload) {
      setShowMissing(true);
      setError(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await submitJurorSurvey(payload);
      setThanks(result.message);
      onAnswered();
    } catch (err) {
      const status = err instanceof JurorSurveyApiError ? err.status : 0;
      // Red caída o error del servidor: lo elegido sigue aquí y se puede reintentar.
      setFailedOnce(status === 0 || status >= 500);
      setError(err instanceof Error ? err.message : "No se pudo enviar la encuesta.");
      if (status === 403) onUnavailable?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {thanks ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
            <DialogHeader className="items-center">
              <DialogTitle>Encuesta enviada</DialogTitle>
              <DialogDescription className="text-base text-foreground">{thanks}</DialogDescription>
            </DialogHeader>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <DialogHeader>
              <DialogTitle>Encuesta de experiencia del jurado</DialogTitle>
              <DialogDescription>
                Ya enviaste las evaluaciones de todos tus grupos. Cuéntanos cómo te fue: califica cada aspecto de
                1 (muy malo) a 5 (excelente). Toma menos de un minuto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {SURVEY_QUESTIONS.map(({ key, label }, index) => {
                const isMissing = showMissing && answers[key] === null;
                return (
                  <fieldset
                    key={key}
                    aria-invalid={isMissing || undefined}
                    className={cn(
                      "rounded-lg border p-3",
                      isMissing && "border-red-500/60 bg-red-500/5",
                    )}
                  >
                    <legend className="px-1 text-sm font-medium">
                      {index + 1}. {label}
                    </legend>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {SURVEY_SCORES.map((score) => {
                        const checked = answers[key] === score;
                        return (
                          <label
                            key={score}
                            className={cn(
                              "flex size-10 cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <input
                              type="radio"
                              name={`juror-survey-${key}`}
                              value={score}
                              checked={checked}
                              onChange={() => choose(key, score)}
                              className="sr-only"
                            />
                            {score}
                          </label>
                        );
                      })}
                      {isMissing && <span className="text-xs text-red-600 dark:text-red-400">Elige una opción</span>}
                    </div>
                  </fieldset>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="juror-survey-comments" className="text-sm font-medium">
                Comentarios y sugerencias <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Textarea
                id="juror-survey-comments"
                value={comments}
                maxLength={SURVEY_MAX_COMMENTS}
                onChange={(e) => setComments(e.target.value.slice(0, SURVEY_MAX_COMMENTS))}
                placeholder="¿Qué mejorarías para la próxima feria?"
                rows={3}
              />
              <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                {comments.length}/{SURVEY_MAX_COMMENTS}
              </p>
            </div>

            {shownError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {shownError}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
                Omitir
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 animate-spin" aria-hidden />}
                {submitting ? "Enviando..." : failedOnce ? "Reintentar" : "Enviar encuesta"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default JurorSurveyDialog;
