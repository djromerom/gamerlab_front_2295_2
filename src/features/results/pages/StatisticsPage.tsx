// StatisticsPage.tsx
"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import LayoutApplication from "@/layouts/LayoutApplication";
import LoadingScreen from "@/components/LoadingScreen";
import { useState, useEffect } from "react";

import GraphicsDisplay from "@/features/results/components/GraphicsDisplay";
import RankingTable from "@/features/results/components/RankingTable";
import ResultsTable from "@/features/results/components/ResultsTable";
import FilterPanel from "@/features/results/components/FilterPanel";
import { useGlobalState } from "@/contexts/GlobalStateContext";
import DownloadReport from "@/features/results/components/DownloadReport";
import JudgesTable from "@/features/results/components/JudgesTable";
import { AVERAGES_HIDDEN_MESSAGE, averageOfGames } from "@/features/results/lib/averages";
import {
  progressPercentage,
  useEvaluationProgress,
} from "@/api/evaluationProgress";

export default function StatisticsPage() {
  const { listaVideojuegos, isLoading, error, fetchGlobalData } =
    useGlobalState();
  const { progress: evaluationProgress } = useEvaluationProgress();

  // Estado local para manejar la carga de la página (igual que ProfessorsPage)
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    // Simular el comportamiento de ProfessorsPage
    // Inicialmente la página está cargando, luego se oculta después de un tiempo
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800); // Pequeño delay para asegurar que se vea la pantalla de carga

    return () => clearTimeout(timer);
  }, []);

  // La página debe mostrar loading si está en carga inicial O si está cargando datos del contexto
  const shouldShowLoading = isPageLoading || isLoading;

  const breadcrumbs = [{ label: "Estadisticas", href: "/estadisticas" }];

  // Lógica para las cards de resumen (basadas en la lista completa)
  const totalVideojuegos = listaVideojuegos.length;
  const promedioGeneral = averageOfGames(listaVideojuegos) ?? (totalVideojuegos > 0 ? null : "0.00");

  // Progreso global: misma fuente que Estado Eval. y Asignación de jurados.
  const totalEvaluaciones = evaluationProgress?.completed ?? 0;
  const totalJuradosAsignadosGeneral = evaluationProgress?.assigned ?? 0;
  const progresoEvaluacionPorcentaje = evaluationProgress
    ? progressPercentage(evaluationProgress)
    : 0;

  const VALUE_Jurados = "tablaJurados";

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      {/* Mostrar LoadingScreen siempre que esté cargando (inicial o actualización) */}
      {shouldShowLoading ? (
        <LoadingScreen text="Cargando estadísticas y datos de videojuegos..." />
      ) : (
        <>
          {/* Mostrar error si existe */}
          {error && (
            <div
              className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 text-center"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error.message}
              <div className="mt-2">
                <Button
                  onClick={fetchGlobalData}
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          <div className="md:bg-background text-foreground min-h-screen p-4 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-4">
              <div>
                <h1 className="text-xl font-medium">
                  Reportes y Analítica
                </h1>
                <p className="text-muted-foreground">
                  Visualización de resultados de evaluaciones
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="sm"
                  onClick={fetchGlobalData}
                  disabled={shouldShowLoading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${shouldShowLoading ? "animate-spin" : ""}`}
                  />
                  {shouldShowLoading ? "Actualizando..." : "Actualizar datos"}
                </Button>
              </div>
            </div>

            {/* Cards de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-1 pt-2">
                  <CardTitle className="text-sm font-medium min-h-[2.5rem]">
                    Total de Videojuegos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-2xl font-bold">{totalVideojuegos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-2">
                  <CardTitle className="text-sm font-medium min-h-[2.5rem]">
                    Promedio General
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {promedioGeneral === null ? (
                    <div className="text-sm text-muted-foreground">{AVERAGES_HIDDEN_MESSAGE}</div>
                  ) : (
                    <div className="text-2xl font-bold">{promedioGeneral}</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-2">
                  <CardTitle className="text-sm font-medium min-h-[2.5rem]">
                    Progreso de Evaluación
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-2xl font-bold">
                    {totalEvaluaciones} / {totalJuradosAsignadosGeneral}
                  </div>
                  <Progress
                    value={progresoEvaluacionPorcentaje}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Cuerpo Principal: Tabs con Filtros en la barra */}
            <div className="mb-6">
              <Tabs defaultValue="tabla" className="w-full">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger
                      className="cursor-pointer hover:bg-accent"
                      value="tabla"
                    >
                      Tabla de Resultados
                    </TabsTrigger>
                    <TabsTrigger
                      className="cursor-pointer hover:bg-accent"
                      value="ranking"
                    >
                      Ranking
                    </TabsTrigger>
                    <TabsTrigger
                      className="cursor-pointer hover:bg-accent"
                      value="graficos"
                    >
                      Gráficos
                    </TabsTrigger>
                    <TabsTrigger
                      className="cursor-pointer hover:bg-accent"
                      value={VALUE_Jurados}
                    >
                      Tabla de Jurados
                    </TabsTrigger>
                  </TabsList>
                  <FilterPanel />
                </div>
                <TabsContent value="tabla">
                  <ResultsTable />
                </TabsContent>
                <TabsContent value="ranking">
                  <RankingTable />
                </TabsContent>
                <TabsContent value="graficos">
                  <GraphicsDisplay />
                </TabsContent>
                <TabsContent value={VALUE_Jurados}>
                  <JudgesTable />
                </TabsContent>
              </Tabs>
            </div>

            <DownloadReport />

            {/* Mensaje cuando no hay videojuegos */}
            {!shouldShowLoading && !error && totalVideojuegos === 0 && (
              <div className="p-4 text-center text-gray-500">
                No se encontraron videojuegos para mostrar estadísticas.
              </div>
            )}
          </div>
        </>
      )}
    </LayoutApplication>
  );
}
