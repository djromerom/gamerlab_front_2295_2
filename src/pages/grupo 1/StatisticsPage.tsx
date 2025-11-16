// StatisticsPage.tsx 
"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import LayoutAplication from "@/layouts/LayoutAplication"
import LoadingScreen from "@/components/grupo 5/LoadingScreen"
import { useState, useEffect } from "react"

import GraphicDisplay from "@/components/grupo 1/GraphicsDisplay"
import TablaRanking from "@/components/grupo 1/RankingTable"
import TablaResultados from "@/components/grupo 1/ResultsTable"
import FiltrosPanel from "@/components/grupo 1/FilterPanel"
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"
import DownloadReport from "@/components/grupo 1/DownloadReport"
import TablaPorJurado from "@/components/grupo 1/JudgesTable"

export default function StatisticsPage() {
  const {
    listaVideojuegos,
    isLoading,
    error,
    fetchGlobalData
  } = useGlobalState();

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
  const promedioGeneral = totalVideojuegos > 0
    ? (listaVideojuegos.reduce((acc, game) => acc + game.promedio, 0) / totalVideojuegos).toFixed(2)
    : "0.00";

  const totalEvaluaciones = listaVideojuegos.reduce((acc, game) => acc + (game.evaluacionesCompletadas || 0), 0);
  const totalJuradosAsignadosGeneral = listaVideojuegos.reduce((acc, game) => acc + (game.totalJuradosAsignados || 0), 0);
  const progresoEvaluacionPorcentaje = totalJuradosAsignadosGeneral > 0
    ? (totalEvaluaciones / totalJuradosAsignadosGeneral) * 100
    : 0;

  const VALUE_Jurados = "tablaJurados";

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
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
                <Button onClick={fetchGlobalData} size="sm" variant="outline" className="cursor-pointer">
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          <div className="container mx-auto py-6 p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reportes y Analítica</h1>
                <p className="text-muted-foreground">Visualización de resultados de evaluaciones</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={fetchGlobalData} disabled={shouldShowLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${shouldShowLoading ? 'animate-spin' : ''}`} />
                  {shouldShowLoading ? "Actualizando..." : "Actualizar datos"}
                </Button>
              </div>
            </div>

            {/* Cards de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2 pt-2">
                  <CardTitle className="text-sm font-medium">Total de Videojuegos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVideojuegos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 pt-2">
                  <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{promedioGeneral}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 pt-2">
                  <CardTitle className="text-sm font-medium">Progreso de Evaluación</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-2xl font-bold">{totalEvaluaciones} / {totalJuradosAsignadosGeneral}</div>
                  <Progress value={progresoEvaluacionPorcentaje} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Cuerpo Principal: Filtros y Tabs */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              <FiltrosPanel /> 
              <div className="col-span-12 md:col-span-9">
                <Tabs defaultValue="tabla" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger className="cursor-pointer hover:bg-accent" value="tabla">Tabla de Resultados</TabsTrigger>
                    <TabsTrigger className="cursor-pointer hover:bg-accent" value="ranking">Ranking</TabsTrigger>
                    <TabsTrigger className="cursor-pointer hover:bg-accent" value="graficos">Gráficos</TabsTrigger>
                    <TabsTrigger className="cursor-pointer hover:bg-accent" value={VALUE_Jurados}>Tabla de Jurados</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tabla"><TablaResultados /></TabsContent>
                  <TabsContent value="ranking"><TablaRanking /></TabsContent>
                  <TabsContent value="graficos"><GraphicDisplay /></TabsContent>
                  <TabsContent value={VALUE_Jurados}><TablaPorJurado /></TabsContent>
                </Tabs>
              </div>
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
    </LayoutAplication>
  );
}