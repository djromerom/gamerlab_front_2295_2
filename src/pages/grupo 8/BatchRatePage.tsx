import { Textarea } from "@/components/grupo 8/textarea";
import { TeamVerificationForm } from "@/components/grupo 8/TeamVerification";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCriteria } from "@/hooks/use-criteria";
import { useTeamVerification } from "@/hooks/useTeamVerification";
import LayoutAplication from "@/layouts/LayoutAplication";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, CheckCircle2, Loader2, Lock, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getBatchBackRoute } from "./batchRoute";
import { toast } from "sonner";

interface BatchGame {
  id: number;
  nombre: string;
  equipo: string;
  teamId?: number; // HU-19: para verificar el grupo antes de calificar
  teamCode?: string; // [MODIFICACIÓN]: Agregado código del equipo
  materia: string;
  nrc: string;
  participantes: string[];
  imagen?: string;
  descripcion: string;
}

interface GameScores {
  [gameId: number]: {
    comments: string;
    details: { criterionId: number; score: string }[];
  };
}

export default function BatchRatePage() {
  const pendingSubmission = useRef<{
    fingerprint: string;
    idempotencyKey: string;
    body: string;
  } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const games = (location.state?.games || []) as BatchGame[];
  const fromPage = (location.state?.from || "jurado") as string;
  const { userRole } = useAuth();
  const backRoute = getBatchBackRoute(fromPage, userRole);

  const { criteria: apiCriteria, isLoading: isLoadingCriteria } = useCriteria();
  // HU-19: cada grupo del lote se verifica con su código antes de calificarlo
  const {
    isLoading: isLoadingVerification,
    isVerified,
    markVerified,
    getLockedUntil,
    isLockEstimated,
    markLocked,
  } = useTeamVerification(games.map((game) => game.teamId));

  const [activeTab, setActiveTab] = useState(0);
  const [gameScores, setGameScores] = useState<GameScores>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    successful: { videogameId: number; evaluationId: number }[];
    failed: { videogameId: number; error: string }[];
  } | null>(null);

  const sanitizeScoreInputValue = (rawValue: string) => {
    const normalized = rawValue.replace(/,/g, ".");
    const digitsOnly = normalized.replace(/[^0-9.]/g, "");
    const parts = digitsOnly.split(".");
    if (parts.length <= 2) {
      return digitsOnly;
    }
    return `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const saveDraft = (
    gameId: number,
    scores: {
      comments: string;
      details: { criterionId: number; score: string }[];
    },
  ) => {
    try {
      localStorage.setItem(
        `batch-rate-draft-${gameId}`,
        JSON.stringify({ scores }),
      );
    } catch (e) {
      // Ignorar
    }
  };

  useEffect(() => {
    if (!games || games.length === 0) {
      toast.error("No hay juegos seleccionados");
      navigate(backRoute);
    }
  }, [games, navigate, backRoute]);

  // Inicializar scores: merge entre localStorage y defaults
  useEffect(() => {
    if (apiCriteria.length === 0 || games.length === 0) return;

    const initial: GameScores = {};
    let hasDraft = false;

    games.forEach((game) => {
      let savedData: {
        comments: string;
        details: { criterionId: number; score: string }[];
      } | null = null;
      try {
        const saved = localStorage.getItem(`batch-rate-draft-${game.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed.scores?.comments !== undefined &&
            Array.isArray(parsed.scores?.details)
          ) {
            savedData = parsed.scores;
            hasDraft = true;
          }
        }
      } catch (e) {
        /* Ignorar */
      }

      if (savedData) {
        initial[game.id] = savedData;
      } else {
        initial[game.id] = {
          comments: "",
          details: apiCriteria.map((c) => ({
            criterionId: c.id,
            score: "",
          })),
        };
      }
    });

    setGameScores(initial);
    if (hasDraft) {
      toast.info("Borradores recuperados", { duration: 2000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCriteria, games.length]);

  const parseScoreValue = (value: string, maxScore: number): number | null => {
    const raw = (value || "").toString().trim();
    if (!raw) return null;
    const normalized = raw.replace(/,/g, ".");
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) return null;
    if (parsed < 0) return 0;
    if (parsed > maxScore) return maxScore;
    return parsed;
  };

  const handleScoreChange = (
    gameId: number,
    criterionId: number,
    rawValue: string,
  ) => {
    setGameScores((prev) => {
      const currentGame = prev[gameId] || {
        comments: "",
        details: apiCriteria.map((c) => ({ criterionId: c.id, score: "" })),
      };
      const sanitized = sanitizeScoreInputValue(rawValue);

      const details = currentGame.details.map((d) => {
        if (d.criterionId !== criterionId) return d;
        if (!sanitized) return { ...d, score: "" };
        const parsed = Number.parseFloat(sanitized);
        if (!Number.isNaN(parsed) && parsed > 5) return { ...d, score: "5" };
        return { ...d, score: sanitized };
      });

      const updated = { ...prev, [gameId]: { ...currentGame, details } };
      saveDraft(gameId, updated[gameId]);
      return updated;
    });
  };

  const handleCommentsChange = (gameId: number, value: string) => {
    setGameScores((prev) => {
      const currentGame = prev[gameId] || {
        comments: "",
        details: apiCriteria.map((c) => ({ criterionId: c.id, score: "" })),
      };
      const updated = {
        ...prev,
        [gameId]: { ...currentGame, comments: value },
      };
      saveDraft(gameId, updated[gameId]);
      return updated;
    });
  };

  const handleSubmitAll = async () => {
    const unverifiedIndex = games.findIndex((game) => !isVerified(game.teamId));
    if (unverifiedIndex !== -1) {
      toast.error(
        `"${games[unverifiedIndex].nombre}": digita el código de verificación del grupo`,
      );
      setActiveTab(unverifiedIndex);
      return;
    }

    setIsSubmitting(true);
    const currentDate = new Date().toISOString();

    // Validar que todos los criterios tengan puntuación
    for (const game of games) {
      const scoreData = gameScores[game.id];
      for (const criterion of apiCriteria) {
        const detail = scoreData?.details?.find(
          (d) => d.criterionId === criterion.id,
        );
        const parsed = parseScoreValue(detail?.score ?? "", 5);
        if (parsed === null) {
          toast.error(
            `"${game.nombre}": Ingrese puntuación para "${criterion.name}"`,
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    const evaluations = games.map((game) => {
      const scoreData = gameScores[game.id];
      return {
        date: currentDate,
        videogameId: game.id,
        comments: scoreData?.comments || "",
        details: apiCriteria.map((criterion) => {
          const detail = scoreData?.details?.find(
            (d) => d.criterionId === criterion.id,
          );
          const parsed = parseScoreValue(detail?.score ?? "", 5);
          return {
            criterionId: criterion.id,
            score: parsed ?? 0,
            createdAt: currentDate,
            updatedAt: currentDate,
            isActive: true,
          };
        }),
      };
    });

    const fingerprint = JSON.stringify(
      evaluations.map(({ videogameId, comments, details }) => ({
        videogameId,
        comments,
        details: details.map(({ criterionId, score }) => ({ criterionId, score })),
      })),
    );
    if (pendingSubmission.current?.fingerprint !== fingerprint) {
      pendingSubmission.current = {
        fingerprint,
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({ evaluations }),
      };
    }
    const submission = pendingSubmission.current;

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation/batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": submission.idempotencyKey,
          },
          body: submission.body,
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Error al guardar evaluaciones");

      setResult(data.results);
      pendingSubmission.current = null;
      data.results.successful.forEach(
        (item: { videogameId: number }) => {
          try {
            localStorage.removeItem(`batch-rate-draft-${item.videogameId}`);
          } catch {
            // Ignore storage failures; the in-memory form remains available.
          }
        },
      );

      toast.success(
        `${data.results.successful.length} evaluaciones guardadas correctamente`,
      );

      if (data.results.failed.length > 0) {
        toast.error(`${data.results.failed.length} evaluaciones fallaron`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al enviar evaluaciones");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentGame = games[activeTab];

  const findGame = (videogameId: number) =>
    games.find((game) => game.id === videogameId);

  const gameLabel = (videogameId: number) =>
    findGame(videogameId)?.nombre ?? `ID ${videogameId}`;

  // Resumen de lo que el jurado acaba de enviar, con la misma ponderación que la calificación individual
  const scoreSummary = (videogameId: number) => {
    const scoreData = gameScores[videogameId];
    const details = apiCriteria.map((criterion) => ({
      name: criterion.name,
      weight: criterion.weight,
      score:
        parseScoreValue(
          scoreData?.details?.find((d) => d.criterionId === criterion.id)
            ?.score ?? "",
          5,
        ) ?? 0,
    }));
    return {
      details,
      total: details.reduce((acc, d) => acc + d.score * d.weight, 0),
      max: details.reduce((acc, d) => acc + 5 * d.weight, 0),
      comments: scoreData?.comments?.trim() ?? "",
    };
  };

  if (!currentGame) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Cargando...</p>
        </div>
      </LayoutAplication>
    );
  }

  const breadcrumbs =
    fromPage === "colegios"
      ? [
          // [MODIFICADO]: Renombrado para ser consistente con el menú lateral "Equipos por Evaluar".
          // [ANTES]: "Pendientes (Colegios)"
          { label: "Equipos por Evaluar", href: "/colegios-calificar" },
          { label: "Calificación en lote", href: "/calificar-lote" },
        ]
      : [
          { label: "Pendientes por calificar", href: "/pendientes-calificar" },
          { label: "Calificación en lote", href: "/calificar-lote" },
        ];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-4 md:py-6 px-3 md:px-5">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2">
          Calificación en Lote
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
          Asigna puntajes a cada videojuego. Usa las pestañas para navegar entre
          ellos.
        </p>

        {result ? (
          <Card className="mb-6 py-6">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl">
                Resultado de la calificación
              </CardTitle>
              <CardDescription>
                {result.successful.length} de{" "}
                {result.successful.length + result.failed.length} evaluaciones
                guardadas
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 space-y-6">
              {result.successful.length > 0 && (
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Guardadas ({result.successful.length})
                  </h3>
                  {result.successful.map((s) => {
                    const game = findGame(s.videogameId);
                    const summary = scoreSummary(s.videogameId);
                    return (
                      <div
                        key={s.videogameId}
                        className="rounded-lg border border-green-600/30 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium">{gameLabel(s.videogameId)}</p>
                            {game && (
                              <p className="text-sm text-muted-foreground">
                                {game.equipo}
                                {game.teamCode && ` · ${game.teamCode}`}
                              </p>
                            )}
                          </div>
                          <div className="sm:text-right flex-shrink-0">
                            <p className="text-xl font-bold text-primary">
                              {summary.total.toFixed(2)}
                              <span className="text-sm font-medium text-muted-foreground">
                                {" "}/ {summary.max.toFixed(2)}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Evaluación #{s.evaluationId}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {summary.details.map((d) => (
                            <span
                              key={d.name}
                              className="rounded-md bg-muted px-2 py-1 text-xs"
                            >
                              {d.name}:{" "}
                              <span className="font-semibold">{d.score.toFixed(1)}</span>
                            </span>
                          ))}
                        </div>

                        {summary.comments && (
                          <p className="text-sm text-muted-foreground italic break-words">
                            “{summary.comments}”
                          </p>
                        )}
                      </div>
                    );
                  })}
                </section>
              )}

              {result.failed.length > 0 && (
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
                    <XCircle className="h-5 w-5" />
                    No guardadas ({result.failed.length})
                  </h3>
                  {result.failed.map((f) => (
                    <div
                      key={f.videogameId}
                      className="rounded-lg border border-red-600/30 bg-red-50/50 dark:bg-red-900/10 p-4"
                    >
                      <p className="font-medium">{gameLabel(f.videogameId)}</p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {f.error}
                      </p>
                    </div>
                  ))}
                </section>
              )}

              <Button
                onClick={() => navigate(backRoute)}
                className="cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a pendientes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs navegación con scroll */}
            <div className="overflow-x-auto mb-4 md:mb-6 -mx-3 md:mx-0 px-3 md:px-0">
              <div className="flex gap-1 md:gap-2 min-w-max">
                {games.map((game, index) => (
                  <button
                    key={game.id}
                    onClick={() => setActiveTab(index)}
                    className={`px-3 md:px-4 py-2 rounded-t-lg text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === index
                        ? "bg-[var(--selected)] text-[var(--selected-foreground)]"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {!isLoadingVerification && !isVerified(game.teamId) && (
                      <Lock
                        className="inline h-3 w-3 mr-1 -mt-0.5"
                        aria-label="Grupo sin verificar"
                      />
                    )}
                    {game.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjeta del juego activo */}
            <Card key={currentGame.id} className="mb-6">
              <CardHeader className="px-4 md:px-6 py-4 md:py-6">
                <CardTitle className="text-lg md:text-xl">
                  {currentGame.nombre}
                </CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Equipo: {currentGame.equipo} | Materia: {currentGame.materia}
                  {/* [MODIFICACIÓN]: Renderizado del código del equipo extraído */}
                  {currentGame.teamCode &&
                    ` | Código: ${currentGame.teamCode.split("-").pop() || currentGame.teamCode}`}
                </p>
              </CardHeader>
              {!isVerified(currentGame.teamId) ? (
                <CardContent className="px-4 md:px-6">
                  {isLoadingVerification ? (
                    <div className="flex justify-center items-center gap-2 py-8">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Verificando grupos...
                      </span>
                    </div>
                  ) : (
                    <TeamVerificationForm
                      key={currentGame.teamId}
                      teamId={currentGame.teamId!}
                      teamName={currentGame.equipo}
                      onVerified={markVerified}
                      lockedUntil={getLockedUntil(currentGame.teamId)}
                      lockEstimated={isLockEstimated(currentGame.teamId)}
                      onLocked={markLocked}
                      className="shadow-none py-4"
                    />
                  )}
                </CardContent>
              ) : (
              <CardContent className="px-4 md:px-6">
                {/* Criterios de evaluación */}
                <div className="space-y-3 md:space-y-4">
                  {apiCriteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-muted/30 rounded-lg gap-2 md:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base">
                          {criterion.name} (
                          {(criterion.weight * 100).toFixed(0)}%)
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {criterion.description || "Sin descripción"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            gameScores[currentGame.id]?.details?.find(
                              (d) => d.criterionId === criterion.id,
                            )?.score ?? ""
                          }
                          onChange={(e) =>
                            handleScoreChange(
                              currentGame.id,
                              criterion.id,
                              e.target.value,
                            )
                          }
                          placeholder="0-5"
                          className="w-full md:w-20 text-center text-sm"
                        />
                        <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                          / 5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comentarios */}
                <div className="mt-4 md:mt-6">
                  <h3 className="font-medium text-sm md:text-base mb-2">
                    Comentarios
                  </h3>
                  <Textarea
                    value={gameScores[currentGame.id]?.comments || ""}
                    onChange={(e) =>
                      handleCommentsChange(currentGame.id, e.target.value)
                    }
                    className="w-full h-20 md:h-24 text-sm"
                    placeholder="Comentarios para este videojuego..."
                  />
                </div>
              </CardContent>
              )}
            </Card>

            {/* Botones */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4 mt-4 md:mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(backRoute)}
                className="cursor-pointer w-full md:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAll}
                disabled={isSubmitting || isLoadingVerification}
                className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] cursor-pointer w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />{" "}
                    Guardando...
                  </>
                ) : (
                  `Guardar todas (${games.length})`
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </LayoutAplication>
  );
}
