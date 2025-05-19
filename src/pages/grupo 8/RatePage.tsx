"use client";

import Criteriabutton from "@/components/grupo 8/criteriabutton";
import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Importamos toast de sonner
import LoadingScreen from "@/components/grupo 5/LoadingScreen"; // Importamos el componente LoadingScreen
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

// Tipos
interface EvaluationCriteria {
  id: string;
  name: string;
  score: number;
  maxScore: number;
}

export default function RatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const game = location.state?.game;
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);

  // Función para mostrar errores como toast

  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([
    {
      id: "interfaz",
      name: "Interfaz de usuario (10%)",
      score: 1,
      maxScore: 5,
    },
    { id: "interaccion", name: "Interacción (20%)", score: 1, maxScore: 5 },
    { id: "resultados", name: "Resultados (40%)", score: 1, maxScore: 5 },
    {
      id: "presentacion",
      name: "Presentación del proyecto (10%)",
      score: 1,
      maxScore: 5,
    },
    {
      id: "funcionamiento",
      name: "Funcionamiento del programa (10%)",
      score: 1,
      maxScore: 5,
    },
    {
      id: "presentacion_grupo",
      name: "Presentación personal grupo (10%)",
      score: 1,
      maxScore: 5,
    },
  ]);

  useEffect(() => {
    if (game) {
      setLoading(false);
    } else {
      navigate("/pendientes-calificar");
    }
  }, [game, navigate]);

  // Función para mostrar errores como toast
  const showError = (errorMessage: string) => {
    toast.error(errorMessage);
    setError(errorMessage);
  };

  // Función para mostrar mensajes de éxito como toast
  const showSuccess = (message: string) => {
    // Mostrar el toast de éxito
    toast.success(message, {
      duration: 2000, // Duración del toast (2 segundos)
    });

    // Programar la redirección después de que el toast haya tenido tiempo de mostrarse
    setTimeout(() => {
      setShowSuccessLoading(true);
      setTimeout(() => {
        navigate("/pendientes-calificar");
      }, 1000); // Asegurarse que la pantalla de carga se muestre por al menos 1 segundo
    }, 2500); // Esperar un poco más que la duración del toast para asegurarnos que se vio
  };

  const handleScoreChange = (criteriaId: string, score: number) => {
    setCriteria(
      criteria.map((c) => (c.id === criteriaId ? { ...c, score } : c))
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // 1. Calcular el puntaje final basado en los porcentajes
    const porcentajeMap: Record<string, number> = {
      interfaz: 0.1, // 10%
      interaccion: 0.2, // 20%
      resultados: 0.4, // 40%
      presentacion: 0.1, // 10%
      funcionamiento: 0.1, // 10%
      presentacion_grupo: 0.1, // 10%
    };

    const puntajeFinal = criteria.reduce((acc, curr) => {
      const porcentaje = porcentajeMap[curr.id] || 0;
      return acc + curr.score * porcentaje;
    }, 0);

    // 2. Preparar datos para evaluacion
    const fecha_creacion = new Date().toISOString();
    const evaluationPayload = {
      date: fecha_creacion,
      videogameId: game.id,
      totalScore: puntajeFinal,
      comments: comments,
    };

    // 3. Enviar a tabla evaluacion y obtener id_evaluacion
    let evaluationId;
    try {
      const resEval = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evaluationPayload),
        }
      );

      if (!resEval.ok) {
        const errorData = await resEval.json();
        throw new Error(errorData.message || "Error al guardar la evaluación");
      }

      const evalData = await resEval.json();
      evaluationId = evalData.evaluationId;
    } catch (err: any) {
      showError(err.message || "Error guardando la evaluación");
      setIsSubmitting(false);
      return;
    }

    // 4. Mapear criterios a sus ids
    const criterioMap: Record<string, number> = {
      interfaz: 1,
      interaccion: 2,
      resultados: 3,
      presentacion: 4,
      funcionamiento: 5,
      presentacion_grupo: 6,
    };

    // 5. Preparar y enviar detalles_evaluacion
    const details = criteria.map((c) => ({
      evaluationId: evaluationId,
      criterionId: criterioMap[c.id],
      score: c.score,
      createdAt: fecha_creacion,
      updatedAt: fecha_creacion,
      isActive: true,
    }));

    try {
      const resDetails = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/evaluation/details`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ details }),
        }
      );

      if (!resDetails.ok) {
        const errorData = await resDetails.json();
        throw new Error(
          errorData.message || "Error al guardar los detalles de la evaluación"
        );
      }

      // Primero cerrar el diálogo de confirmación
      setConfirmDialogOpen(false);
      // Mostrar mensaje de éxito
      showSuccess(`Evaluación del juego "${game.nombre}" enviada exitosamente`);
      // No se navega aquí - la navegación ocurrirá en la función showSuccess después del toast
    } catch (err: any) {
      showError(err.message || "Error guardando los detalles de la evaluación");
      setIsSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  // Pantalla de carga después de enviar evaluación exitosamente
  if (showSuccessLoading) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <LoadingScreen text="Redirigiendo a pendientes por calificar..." />
      </LayoutAplication>
    );
  }

  // Pantalla de carga inicial
  if (loading) {
    return (
      <LayoutAplication breadcrumbs={[]}>
        <div className="flex justify-center items-center h-screen text-white">
          <p>Cargando información del juego...</p>
        </div>
      </LayoutAplication>
    );
  }

  const breadcrumbs = [
    {
      label: `Pendientes por calificar >  ${game?.nombre}`,
      href: "/pendientes-calificar",
    },
  ];

  const getDescription = (id: string): string => {
    switch (id) {
      case "interfaz":
        return "Diseño, colores, usabilidad";
      case "interaccion":
        return "Controles, guía al usuario, intuitividad";
      case "resultados":
        return "Reacciones, recompensas, retroalimentación visual";
      case "presentacion":
        return "Claridad, coherencia, comunicación del objetivo";
      case "funcionamiento":
        return "Que no tenga errores y cumpla su propósito";
      case "presentacion_grupo":
        return "Lenguaje corporal, presencia, orden y seguridad al exponer";
      default:
        return "Sin descripción";
    }
  };

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-10">
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

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <Card className="h-full py-5">
              <CardHeader>
                {/* Círculo con el logo del juego */}
                {game.imagen && (
                  <div className="flex justify-center mb-4 p-3">
                    <div className="w-38 h-38 bg-gray-300 rounded-full overflow-hidden shadow-md">
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
                    <p>{game.equipo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Materia
                    </p>
                    <p>{game.materia}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      NRC
                    </p>
                    <p>{game.nrc}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Participantes
                    </p>
                    <p>{game.participantes.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Descripción
                    </p>
                    <p className="text-sm">{game.descripcion}</p>
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
                      <TableHead className="text-lg font-bold">
                        Criterio
                      </TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteria.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell
                          colSpan={2}
                          className="font-medium text-base px-0"
                        >
                          {criterion.name}
                          <div className="mt-2 flex items-center gap-4">
                            <p className="text-xs font-medium text-muted-foreground">
                              Puntuación:
                            </p>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={criterion.score}
                              onChange={(e) =>
                                handleScoreChange(
                                  criterion.id,
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer px-0"
                              style={{
                                background: `linear-gradient(to right, var(--selected) ${
                                  ((criterion.score - 1) / 4) * 100
                                }%, #e5e7eb ${
                                  ((criterion.score - 1) / 4) * 100
                                }%)`,
                                accentColor: "var(--selected)", // morado (tailwind purple-500)
                              }}
                            />
                            <span className="text-sm font-medium px-0">
                              {criterion.score}
                            </span>
                            <Criteriabutton
                              description={getDescription(criterion.id)}
                            />
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
                    disabled={isSubmitting}
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

        {/* AlertDialog para confirmar envío de evaluación */}
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
            {error && !isSubmitting && (
              <p className="text-sm text-red-600 dark:text-red-500 p-4 -mt-2 -mb-2">
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setConfirmDialogOpen(false);
                  setError(null);
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
