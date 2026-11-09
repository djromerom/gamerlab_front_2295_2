"use client";

import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import Criteriabutton from "@/components/grupo 8/criteriabutton";
import { Textarea } from "@/components/grupo 8/textarea";
import { TeamVerificationGate } from "@/components/grupo 8/TeamVerification";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DraftConflictDialog,
  DraftSaveIndicator,
} from "@/components/grupo 8/EvaluationDrafts";
import { useCriteria } from "@/hooks/use-criteria";
import { loadInitialDraft, useDraftAutosave } from "@/hooks/useDraftAutosave";
import LayoutAplication from "@/layouts/LayoutAplication";
import { apiFetch } from "@/lib/api";
import {
  formFromCriteria,
  fromServerDraft,
  type DraftForm,
} from "@/lib/evaluationDrafts";
import { UiCriterion } from "@/types/criterion";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Game {
  id: number;
  nombre: string;
  imagen?: string;
  equipo?: string;
  materia?: string;
  teamId?: number; // HU-19: para verificar el grupo antes de calificar
  teamCode?: string; // [MODIFICACIÓN]: Código de equipo
  nrc?: string;
  participantes?: string[];
  descripcion?: string;
}

export default function RatePage() {
  const pendingSubmission = useRef<{
    fingerprint: string;
    idempotencyKey: string;
    body: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const game = location.state?.game as Game | undefined;

  const {
    criteria: apiCriteria,
    isLoading: isLoadingCriteria,
    error: criteriaError,
  } = useCriteria();

  const [uiCriteria, setUiCriteria] = useState<UiCriterion[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [teamWasReassigned, setTeamWasReassigned] = useState(false);
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);

  // HU-18: borrador en el servidor (con copia local si no hay red)
  const drafts = useDraftAutosave();
  const [draftReady, setDraftReady] = useState(false);
  const lastDraftKey = useRef<string | null>(null);

  const applyDraftForm = (form: DraftForm | null) => {
    const nextCriteria = apiCriteria.map((criterion) => ({
      ...criterion,
      score: form?.scores[criterion.id] ?? "",
      maxScore: 5,
    }));
    const nextComments = form?.comments ?? "";
    lastDraftKey.current = JSON.stringify(formFromCriteria(nextCriteria, nextComments));
    setUiCriteria(nextCriteria);
    setComments(nextComments);
  };

  useEffect(() => {
    if (apiCriteria.length === 0 || !game) return;
    let cancelled = false;
    setDraftReady(false);
    loadInitialDraft(game.id)
      .catch(() => null)
      .then((initial) => {
        if (cancelled) return;
        applyDraftForm(initial?.form ?? null);
        drafts.start(game.id, initial ?? { version: 0, form: null, needsSync: false });
        setDraftReady(true);
        if (initial?.form) {
          toast.info(
            initial.source === "local" ? "Borrador recuperado de este dispositivo" : "Borrador recuperado",
            { duration: 2000 },
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCriteria, game?.id]);

  // Autoguardado: cada cambio del formulario programa un guardado (con espera) en el servidor
  useEffect(() => {
    if (!game || !draftReady) return;
    const form = formFromCriteria(uiCriteria, comments);
    const key = JSON.stringify(form);
    if (key === lastDraftKey.current) return;
    lastDraftKey.current = key;
    drafts.schedule(game.id, form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiCriteria, comments, draftReady]);

  const draftState = game ? drafts.stateOf(game.id) : null;

  const handleConflict = (choice: "overwrite" | "load") => {
    if (!game) return;
    const remote = drafts.resolveConflict(game.id, choice);
    if (choice === "load" && remote) {
      applyDraftForm(fromServerDraft(remote));
      toast.info("Se cargó la versión guardada del borrador", { duration: 2000 });
    }
  };

  useEffect(() => {
    if (!game) {
      toast.error("No se encontró información del juego. Redirigiendo...");
      navigate("/pendientes-calificar");
    }
  }, [game, navigate]);

  if (isLoadingCriteria) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <LoadingScreen text="Cargando criterios de evaluación..." />
      </LayoutAplication>
    );
  }

  if (game && apiCriteria.length > 0 && !draftReady) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <LoadingScreen text="Cargando borrador..." />
      </LayoutAplication>
    );
  }

  const showErrorToast = (errorMessage: string) => {
    toast.error(errorMessage);
    setSubmissionError(errorMessage);
  };

  const showSuccessToast = (message: string) => {
    toast.success(message, { duration: 2000 });
    setTimeout(() => {
      setShowSuccessLoading(true);
      setTimeout(() => {
        navigate("/pendientes-calificar");
      }, 1000);
    }, 2500);
  };

  const sanitizeScoreInputValue = (rawValue: string) => {
    const normalized = rawValue.replace(/,/g, ".");
    const digitsOnly = normalized.replace(/[^0-9.]/g, "");
    const parts = digitsOnly.split(".");
    if (parts.length <= 2) {
      return digitsOnly;
    }
    return `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const handleScoreInputFocus = (criterionId: number) => {
    setUiCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId && c.score ? { ...c, score: "" } : c,
      ),
    );
  };

  const handleScoreInputChange = (criterionId: number, rawValue: string) => {
    setUiCriteria((prev) =>
      prev.map((c) => {
        if (c.id !== criterionId) {
          return c;
        }

        const sanitized = sanitizeScoreInputValue(rawValue);

        if (!sanitized) {
          return { ...c, score: "" };
        }

        const parsed = Number.parseFloat(sanitized);
        if (!Number.isNaN(parsed) && parsed > c.maxScore) {
          return { ...c, score: String(c.maxScore) };
        }

        return { ...c, score: sanitized };
      }),
    );
  };

  const parseScoreValue = (value: string, maxScore: number): number | null => {
    // if (!value.trim()) {
    //   return null;
    // }

    // const normalized = value.replace(/,/g, ".");
    // const parsed = Number.parseFloat(normalized);

    // if (Number.isNaN(parsed)) {
    //   return null;
    // }

    // if (parsed < 0) {
    //   return 0;
    // }

    // if (parsed > maxScore) {
    //   return maxScore;
    // }

    // return parsed;

    const raw =
      typeof value === "number" ? String(value) : (value || "").toString();
    if (!raw.trim()) return null;
    const normalized = raw.replace(/,/g, ".");
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) return null;
    if (parsed < 0) return 0;
    if (parsed > maxScore) return maxScore;
    return parsed;
  };

  const totalScore = uiCriteria.reduce((acc, criterion) => {
    const parsed = parseScoreValue(
      criterion.score.toString(),
      criterion.maxScore,
    );
    if (parsed === null) {
      return acc;
    }
    return acc + parsed * criterion.weight;
  }, 0);

  const totalMaxScore = uiCriteria.reduce(
    (acc, criterion) => acc + criterion.maxScore * criterion.weight,
    0,
  );

  const handleSubmit = async () => {
    if (!game) {
      showErrorToast("Error: Información del juego no disponible.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);
    setTeamWasReassigned(false);

    const parsedDetails: {
      criterionId: number;
      score: number;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
    }[] = [];

    const currentDate = new Date().toISOString();

    for (const criterion of uiCriteria) {
      //   const parsedScore = parseScoreValue(criterion.score.toString(), criterion.maxScore);
      //

      //   if (parsedScore === null) {
      //     setIsSubmitting(false);
      //     showErrorToast(`Ingrese una puntuación válida para "${criterion.name}".`);
      //     return;
      //   }
      //   const parsedScoreRaw = parseScoreValue(criterion.score.toString(), criterion.maxScore);
      //

      //   parsedDetails.push({
      //     criterionId: criterion.id,
      //     score: parsedScore,
      //     createdAt: currentDate,
      //     updatedAt: currentDate,
      //     isActive: true,
      //   });
      // }

      //  debug: inspeccionar el valor real que viene del UI

      // parsear una sola vez (acepta number o string)
      const parsedRaw = parseScoreValue(
        criterion.score.toString() ?? "",
        criterion.maxScore,
      );
      // Opción A (estricto): descomentar para exigir que ingresen un valor
      // if (parsedRaw === null) {
      //   setIsSubmitting(false);
      //   showErrorToast(`Ingrese una puntuación válida para "${criterion.name}".`);
      //   return;
      // }
      const parsedScore = parsedRaw === null ? 0 : parsedRaw;

      parsedDetails.push({
        criterionId: criterion.id,
        score: parsedScore,
        createdAt: currentDate,
        updatedAt: currentDate,
        isActive: true,
      });
    }

    const fingerprint = JSON.stringify({
      videogameId: game.id,
      comments,
      details: parsedDetails.map(({ criterionId, score }) => ({ criterionId, score })),
    });
    if (pendingSubmission.current?.fingerprint !== fingerprint) {
      const evaluationPayload = {
        date: currentDate,
        videogameId: game.id,
        comments,
        details: parsedDetails,
      };
      pendingSubmission.current = {
        fingerprint,
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify(evaluationPayload),
      };
    }
    const submission = pendingSubmission.current;
    // evaluacion exitosa no existe
    // Enviamos la evaluación usando apiFetch para proteger el trabajo del jurado.
    // Si la sesión expiró justo antes de dar 'Confirmar', apiFetch la recuperará automáticamente.
    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation/with-details`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": submission.idempotencyKey,
          },
          body: submission.body,
        },
      );

      // if (!res.ok) {
      //   const errorData = await res.json();
      //   throw new Error(errorData.message || "Error al guardar la evaluación");
      // }

      if (!res.ok) {
        let errorText = `${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorText =
            errorData.message || JSON.stringify(errorData) || errorText;
        } catch (e) {
          // no-op: no JSON body
        }
        if (
          res.status === 403 &&
          typeof errorText === "string" &&
          errorText.includes("Este grupo no está asignado al evaluador")
        ) {
          setTeamWasReassigned(true);
          throw new Error("Este grupo ya no está asignado a ti. Conservamos lo escrito; vuelve a pendientes para continuar.");
        }
        throw new Error(errorText);
      }

      // HU-18: el back cierra el borrador al enviar; aquí se detiene el autoguardado y se borra la copia local
      drafts.stop(game.id);

      setConfirmDialogOpen(false);
      pendingSubmission.current = null;
      showSuccessToast(
        `Evaluación del juego "${game.nombre}" enviada exitosamente`,
      );
    } catch (err: any) {
      showErrorToast(err.message || "Error guardando la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCriterionDescription = (criterionName: string): string => {
    const foundCriterion = uiCriteria.find((c) => c.name === criterionName);
    return foundCriterion?.description || "Sin descripción detallada.";
  };

  if (showSuccessLoading) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <LoadingScreen text="Redirigiendo a pendientes por calificar..." />
      </LayoutAplication>
    );
  }

  if (isLoadingCriteria || !game) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="flex justify-center items-center h-screen">
          {isLoadingCriteria && <p>Cargando criterios de evaluación...</p>}
          {!game && !isLoadingCriteria && (
            <p>Cargando información del juego...</p>
          )}
          {criteriaError && (
            <p className="text-red-500">
              Error cargando criterios: {criteriaError}
            </p>
          )}
        </div>
      </LayoutAplication>
    );
  }

  if (criteriaError) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="container mx-auto py-6 p-10 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Error al Cargar Criterios
          </h2>
          <p className="text-muted-foreground mb-4">{criteriaError}</p>
          <p className="text-muted-foreground mb-4">
            Por favor, intente recargar la página o contacte a soporte.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recargar Página
          </Button>
        </div>
      </LayoutAplication>
    );
  }

  if (uiCriteria.length === 0 && !isLoadingCriteria) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="flex justify-center items-center h-screen">
          <p>
            No se encontraron criterios de evaluación. Por favor, contacte a un
            administrador.
          </p>
        </div>
      </LayoutAplication>
    );
  }

  const breadcrumbs = game
    ? [
        {
          label: `Pendientes por calificar >  ${game.nombre}`,
          href: "/pendientes-calificar",
        },
      ]
    : [];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight py-1">
              Evaluación de Videojuego
            </h1>
            <p className="text-muted-foreground">
              Complete los criterios de evaluación para {game?.nombre}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/pendientes-calificar")}
              className="cursor-pointer"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Volver a pendientes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <Card className="h-full py-5">
              <CardHeader>
                {game?.imagen && (
                  <div className="flex justify-center mb-4 p-3">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-300 rounded-full overflow-hidden shadow-md">
                      <img
                        src={game.imagen}
                        alt={`${game.nombre} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <CardTitle>Información del Juego</CardTitle>
                <CardDescription>
                  Detalles del proyecto a evaluar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Equipo
                    </p>
                    <p>{game?.equipo || "N/A"}</p>
                    {/* [MODIFICACIÓN]: Renderizado del código del equipo extraído */}
                    {game?.teamCode && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Código: {game.teamCode.split('-').pop() || game.teamCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Materia
                    </p>
                    <p>{game?.materia || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      NRC
                    </p>
                    <p>{game?.nrc || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Participantes
                    </p>
                    <p>{game?.participantes?.join(", ") || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Descripción
                    </p>
                    <p className="text-lg">{game?.descripcion || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-8">
            {/* HU-19: el formulario se habilita cuando el jurado digita el código del grupo */}
            <TeamVerificationGate teamId={game.teamId} teamName={game.equipo}>
            <Card className="h-full py-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Criterios de Evaluación
                </CardTitle>
                <CardDescription>
                  Califique cada aspecto del proyecto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="w-full table-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-lg font-bold px-0">
                          Criterio
                        </TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {uiCriteria.map((criterion) => (
                        <TableRow key={criterion.id}>
                          <TableCell
                            colSpan={2}
                            className="font-medium text-base px-0 whitespace-normal break-words "
                          >
                            {criterion.name} (
                            {(criterion.weight * 100).toFixed(0)}%)
                            <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                              <p className="text-xs font-medium text-muted-foreground">
                                Puntuación:
                              </p>

                              <div className="flex items-center gap-2 w-full md:w-auto">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={criterion.score ?? ""}
                                  onFocus={() =>
                                    handleScoreInputFocus(criterion.id)
                                  }
                                  onChange={(e) =>
                                    handleScoreInputChange(
                                      criterion.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`0 - ${criterion.maxScore}`}
                                  className="border rounded px-2 py-1 w-full md:w-24 bg-transparent text-sm"
                                />

                                <span className="text-sm font-medium whitespace-nowrap">
                                  {Number(criterion.score).toFixed(2) || "—"}
                                </span>
                                <Criteriabutton
                                  description={getCriterionDescription(
                                    criterion.name,
                                  )}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 rounded-lg border bg-muted-foreground/20 px-4 py-4 flex items-center justify-between">
                  <p className="text-2xl font-medium text-bold from-neutral-700">
                    Nota Final
                  </p>
                  <span className="text-2xl font-bold text-primary">
                    {totalMaxScore > 0
                      ? `${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}`
                      : "—"}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Comentarios Adicionales</h3>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full h-32 bg-sidebar text-foreground border rounded-md"
                    placeholder="Escribe tus comentarios sobre el juego..."
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
                  <div className="min-h-4">
                    {draftState && <DraftSaveIndicator state={draftState} />}
                  </div>
                  <Button
                    className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] min-w-[170px] flex justify-center items-center cursor-pointer outline md:outline-offset-2 "
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={isSubmitting || uiCriteria.length === 0}
                  >
                    {isSubmitting ? (
                      <span className="flex justify-center items-center w-full">
                        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                      </span>
                    ) : (
                      "Enviar Evaluación"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </TeamVerificationGate>
          </div>
        </div>

        <DraftConflictDialog
          open={draftState?.status === "conflict"}
          remote={draftState?.conflictDraft ?? null}
          onLoad={() => handleConflict("load")}
          onOverwrite={() => handleConflict("overwrite")}
        />

        <AlertDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción enviará su evaluación del juego {game?.nombre}. Una
                vez enviada, no podrá ser modificada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {submissionError && !isSubmitting && (
              <p className="text-sm text-red-600 dark:text-red-500 p-4 -mt-2 -mb-2">
                {submissionError}
              </p>
            )}
            <AlertDialogFooter>
              {teamWasReassigned && (
                <Button type="button" variant="outline" onClick={() => navigate("/pendientes-calificar")}>
                  Volver a pendientes
                </Button>
              )}
              <AlertDialogCancel
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setSubmissionError(null);
                }}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmit}
                className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Confirmar Envío"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutAplication>
  );
}
