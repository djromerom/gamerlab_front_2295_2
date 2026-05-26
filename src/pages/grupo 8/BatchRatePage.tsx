import { Input } from "@/components/grupo 8/input";
import { Textarea } from "@/components/grupo 8/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCriteria } from "@/hooks/use-criteria";
import LayoutAplication from "@/layouts/LayoutAplication";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BatchGame {
  id: number;
  nombre: string;
  equipo: string;
  materia: string;
  nrc: string;
  participantes: string[];
  imagen?: string;
  descripcion: string;
}

interface GameScores {
  [gameId: number]: {
    comments: string;
    details: { criterionId: number; score: number }[];
  };
}

export default function BatchRatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const games = (location.state?.games || []) as BatchGame[];
  const fromPage = (location.state?.from || "jurado") as string;
  const backRoute =
    fromPage === "colegios" ? "/colegios-calificar" : "/pendientes-calificar";

  const { criteria: apiCriteria, isLoading: isLoadingCriteria } = useCriteria();

  const [activeTab, setActiveTab] = useState(0);
  const [gameScores, setGameScores] = useState<GameScores>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    successful: { videogameId: number; evaluationId: number }[];
    failed: { videogameId: number; error: string }[];
  } | null>(null);

  // Guardar borrador en localStorage
  const saveDraft = (
    gameId: number,
    scores: {
      comments: string;
      details: { criterionId: number; score: number }[];
    },
  ) => {
    try {
      localStorage.setItem(
        `batch-rate-draft-${gameId}`,
        JSON.stringify({ scores }),
      );
    } catch (e) {
      // Ignorar errores de almacenamiento
    }
  };

  // Limpiar borradores de todos los juegos
  const clearAllDrafts = () => {
    games.forEach((game) => {
      try {
        localStorage.removeItem(`batch-rate-draft-${game.id}`);
      } catch (e) {
        // Ignorar
      }
    });
  };

  // Redirigir si no hay juegos
  useEffect(() => {
    if (!games || games.length === 0) {
      toast.error("No hay juegos seleccionados");
      navigate(backRoute);
    }
  }, [games, navigate, backRoute]);

  // Recuperar borradores de localStorage al montar el componente
  useEffect(() => {
    if (games.length === 0) return;
    const loadedScores: GameScores = {};
    let hasSavedData = false;
    games.forEach((game) => {
      try {
        const saved = localStorage.getItem(`batch-rate-draft-${game.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed.scores &&
            parsed.scores.comments !== undefined &&
            Array.isArray(parsed.scores.details)
          ) {
            loadedScores[game.id] = parsed.scores;
            hasSavedData = true;
          }
        }
      } catch (e) {
        // Ignorar
      }
    });
    if (hasSavedData) {
      setGameScores(loadedScores);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicializar scores cuando cargan los criterios (solo si no se cargaron borradores)
  useEffect(() => {
    if (apiCriteria.length > 0 && games.length > 0) {
      setGameScores((prev) => {
        // Si ya hay datos cargados (de localStorage), no sobrescribir
        if (Object.keys(prev).length > 0) return prev;

        const initial: GameScores = {};
        games.forEach((game) => {
          initial[game.id] = {
            comments: "",
            details: apiCriteria.map((c) => ({
              criterionId: c.id,
              score: 0,
            })),
          };
        });
        return initial;
      });
    }
  }, [apiCriteria, games]);

  const handleScoreChange = (
    gameId: number,
    criterionId: number,
    value: string,
  ) => {
    setGameScores((prev) => {
      const game = { ...prev[gameId] };
      const details = game.details.map((d) =>
        d.criterionId === criterionId
          ? {
              ...d,
              score: value === "" ? 0 : Math.min(5, Math.max(0, Number(value))),
            }
          : d,
      );
      const updated = { ...prev, [gameId]: { ...game, details } };
      saveDraft(gameId, updated[gameId]);
      return updated;
    });
  };

  const handleCommentsChange = (gameId: number, value: string) => {
    setGameScores((prev) => {
      const updated = {
        ...prev,
        [gameId]: { ...prev[gameId], comments: value },
      };
      saveDraft(gameId, updated[gameId]);
      return updated;
    });
  };

  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    const currentDate = new Date().toISOString();

    const evaluations = games.map((game) => {
      const scoreData = gameScores[game.id];
      return {
        date: currentDate,
        videogameId: game.id,
        comments: scoreData?.comments || "",
        details: apiCriteria.map((criterion) => {
          const detail = scoreData?.details.find(
            (d) => d.criterionId === criterion.id,
          );
          return {
            criterionId: criterion.id,
            score: detail?.score ?? 0,
            createdAt: currentDate,
            updatedAt: currentDate,
            isActive: true,
          };
        }),
      };
    });

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evaluations }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al guardar evaluaciones");
      }

      setResult(data.results);
      clearAllDrafts();

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
          {
            label: "Pendientes por calificar (Colegios)",
            href: "/colegios-calificar",
          },
          { label: "Calificación en lote", href: "/calificar-lote" },
        ]
      : [
          { label: "Pendientes por calificar", href: "/pendientes-calificar" },
          { label: "Calificación en lote", href: "/calificar-lote" },
        ];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-5">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Calificación en Lote
        </h1>
        <p className="text-muted-foreground mb-6">
          Asigna puntajes a cada videojuego seleccionado. Usa las pestañas para
          navegar entre ellos.
        </p>

        {result ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resultado de la calificación masiva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    ✅ Exitosas: {result.successful.length}
                  </h3>
                  {result.successful.map((s) => (
                    <p
                      key={s.videogameId}
                      className="text-sm text-green-600 dark:text-green-300"
                    >
                      Videojuego ID {s.videogameId} → Evaluación #
                      {s.evaluationId}
                    </p>
                  ))}
                </div>
                {result.failed.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h3 className="font-semibold text-red-700 dark:text-red-400">
                      ❌ Fallidas: {result.failed.length}
                    </h3>
                    {result.failed.map((f) => (
                      <p
                        key={f.videogameId}
                        className="text-sm text-red-600 dark:text-red-300"
                      >
                        Videojuego ID {f.videogameId}: {f.error}
                      </p>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => navigate(backRoute)}
                  className="cursor-pointer"
                >
                  Volver a pendientes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs de navegación entre juegos */}
            <div className="flex flex-wrap gap-2 mb-6">
              {games.map((game, index) => (
                <button
                  key={game.id}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium cursor-pointer transition-colors ${
                    activeTab === index
                      ? "bg-[var(--selected)] text-[var(--selected-foreground)]"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {game.nombre}
                </button>
              ))}
            </div>

            {/* Tarjeta del juego activo */}
            <Card key={currentGame.id} className="mb-6">
              <CardHeader>
                <CardTitle>{currentGame.nombre}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Equipo: {currentGame.equipo} | Materia: {currentGame.materia}
                </p>
              </CardHeader>
              <CardContent>
                {/* Criterios de evaluación */}
                <div className="space-y-4">
                  {apiCriteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {criterion.name} (
                          {(criterion.weight * 100).toFixed(0)}%)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {criterion.description || "Sin descripción"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step={0.5}
                          value={
                            gameScores[currentGame.id]?.details.find(
                              (d) => d.criterionId === criterion.id,
                            )?.score ?? 0
                          }
                          onChange={(e) =>
                            handleScoreChange(
                              currentGame.id,
                              criterion.id,
                              e.target.value,
                            )
                          }
                          className="w-20 text-center"
                          placeholder="0-5"
                        />
                        <span className="text-sm text-muted-foreground w-8">
                          / 5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comentarios */}
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Comentarios</h3>
                  <Textarea
                    value={gameScores[currentGame.id]?.comments || ""}
                    onChange={(e) =>
                      handleCommentsChange(currentGame.id, e.target.value)
                    }
                    className="w-full h-24"
                    placeholder="Comentarios para este videojuego..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botón de envío masivo */}
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => navigate(backRoute)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
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
