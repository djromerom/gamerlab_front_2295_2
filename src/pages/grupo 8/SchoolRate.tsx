"use client";

import Criteriabutton from "@/components/grupo 8/criteriabutton";
import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/grupo 8/textarea";
import LayoutAplication from "@/layouts/LayoutAplication";
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
import { UiCriterion } from "@/types/criterion";
import { useCriteria } from "@/hooks/use-criteria"; 


interface Game {
  id: number;
  nombre: string;
  imagen?: string;
  equipo?: string;
  materia?: string;
  nrc?: string;
  participantes?: string[];
  descripcion?: string;
}


export default function RatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const game = location.state?.game as Game | undefined;

  const { 
    criteria: apiCriteria, 
    isLoading: isLoadingCriteria, 
    error: criteriaError 
  } = useCriteria();
  
  const [uiCriteria, setUiCriteria] = useState<UiCriterion[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);

  useEffect(() => {
    if (apiCriteria.length > 0) {
      setUiCriteria(
        apiCriteria.map(criterion => ({
          ...criterion,
          score: 1,
          maxScore: 5,
        }))
      );
    }
  }, [apiCriteria]);
  
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

  // Star Rating Component
  const StarRating: React.FC<{
    value: number;
    max: number;
    onChange: (value: number) => void;
  }> = ({ value, max, onChange }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="focus:outline-none"
          aria-label={`Puntuar con ${i + 1} estrellas`}
        >
          <svg
            className={`w-5 h-5 ${i < value ? "text-yellow-400" : "text-gray-300"}`}
            fill={i < value ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon
              strokeWidth="1"
              points="12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27"
            />
          </svg>
        </button>
      ))}
    </div>
  );

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

  const handleScoreChange = (criterionId: number, score: number) => {
    setUiCriteria(
      uiCriteria.map((c) => (c.id === criterionId ? { ...c, score } : c))
    );
  };

  const handleSubmit = async () => {
    if (!game) {
      showErrorToast("Error: Información del juego no disponible.");
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);

    const currentDate = new Date().toISOString();
    const details = uiCriteria.map((c) => ({
      criterionId: c.id,
      score: c.score,
      createdAt: currentDate,
      updatedAt: currentDate,
      isActive: true,
    }));

    const evaluationPayload = {
      date: currentDate,
      videogameId: game.id,
      comments: comments,
      details,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation/with-details`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evaluationPayload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar la evaluación");
      }

      setConfirmDialogOpen(false);
      showSuccessToast(`Evaluación del juego "${game.nombre}" enviada exitosamente`);
    } catch (err: any) {
      showErrorToast(err.message || "Error guardando la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCriterionDescription = (criterionName: string): string => {
    const foundCriterion = uiCriteria.find(c => c.name === criterionName);
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
          {!game && !isLoadingCriteria && <p>Cargando información del juego...</p>}
          {criteriaError && <p className="text-red-500">Error cargando criterios: {criteriaError}</p>}
        </div>
      </LayoutAplication>
    );
  }
  
  if (criteriaError) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="container mx-auto py-6 p-10 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error al Cargar Criterios</h2>
          <p className="text-muted-foreground mb-4">{criteriaError}</p>
          <p className="text-muted-foreground mb-4">Por favor, intente recargar la página o contacte a soporte.</p>
          <Button onClick={() => window.location.reload()}>Recargar Página</Button>
        </div>
      </LayoutAplication>
    );
  }
  
  if (uiCriteria.length === 0 && !isLoadingCriteria) {
     return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="flex justify-center items-center h-screen">
          <p>No se encontraron criterios de evaluación. Por favor, contacte a un administrador.</p>
        </div>
      </LayoutAplication>
    );
  }


  const breadcrumbs = game ? [
    {
      label: `Pendientes por calificar >  ${game.nombre}`,
      href: "/pendientes-calificar",
    },
  ] : [];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight py-1">
              Evaluación del Equipo Escolar
            </h1>
            <p className="text-muted-foreground">
              Complete los criterios de evaluación para {game?.equipo || game?.nombre}
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

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <Card className="h-full py-5">
              <CardHeader>
                {game?.imagen && (
                  <div className="flex justify-center mb-4 p-3">
                    <div className="w-38 h-38 bg-gray-300 rounded-full overflow-hidden shadow-md">
                      <img
                        src={game.imagen}
                        alt={`${game.nombre || game.equipo} logo`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <CardTitle>Información del Equipo</CardTitle>
                <CardDescription>
                  Detalles del equipo de estudiantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre del Equipo</p>
                    <p>{game?.equipo || game?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Materia</p>
                    <p>{game?.materia || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">NRC</p>
                    <p>{game?.nrc || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Participantes</p>
                    {game?.participantes && game.participantes.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {game.participantes.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>N/A</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                    <p className="text-sm">{game?.descripcion || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 md:col-span-8">
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
                <Table>
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
                        <TableCell colSpan={2} className="font-medium text-base px-0 whitespace-normal break-words">
                          {criterion.name} ({ (criterion.weight * 100).toFixed(0) }%)
                          <div className="mt-2 flex items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground">
                              Puntuación:
                            </p>
                            <StarRating
                              value={criterion.score}
                              max={criterion.maxScore}
                              onChange={(val) => handleScoreChange(criterion.id, val)}
                            />
                            <span className="text-sm font-medium px-0">
                              {criterion.score}
                            </span>
                            <div className="ml-auto">
                              <Criteriabutton description={getCriterionDescription(criterion.name)} />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Comentarios Adicionales</h3>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full h-32 bg-sidebar text-foreground border rounded-md"
                    placeholder="Escribe tus comentarios sobre el juego..."
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    className="bg-[var(--selected)] hover:bg-[var(--selected-hover)] text-[var(--selected-foreground)] min-w-[170px] flex justify-center items-center cursor-pointer"
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
          </div>
        </div>

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