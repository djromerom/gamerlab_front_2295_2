// StatisticsPage.tsx 
"use client"

import { FileSpreadsheet, FileIcon as FilePdf, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import LayoutAplication from "@/layouts/LayoutAplication"
import ReportsZoneTable from "@/components/grupo 1/ReportsZoneTable"

import GraphicDisplay from "@/components/grupo 1/GraphicsDisplay"
import TablaRanking from "@/components/grupo 1/RankingTable"
import TablaResultados from "@/components/grupo 1/ResultsTable"
import FiltrosPanel from "@/components/grupo 1/FilterPanel"

// Ya no necesitas importar GlobalStateProvider aquí
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext" // Ajusta la ruta

// Este es ahora tu componente principal de la página
export default function StatisticsPage() {
  const {
    listaVideojuegos,
    // listaVideojuegosFiltrados, // Para exportar o ReportsZoneTable si se necesita aquí
    isLoading,
    error,
    fetchGlobalData
  } = useGlobalState(); // Se consume el contexto directamente

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

  const handleExportExcel = () => {
    console.warn("Exportar Excel no implementado");
    // Aquí podrías usar `listaVideojuegosFiltrados` si está disponible en el contexto y lo necesitas para exportar
    // const { listaVideojuegosFiltrados } = useGlobalState(); // O pasarlo desde arriba si es necesario
  };
  const handleExportPdf = () => console.warn("Exportar PDF no implementado");

  // Manejo de carga y error a nivel de página (opcional, si los hijos ya lo hacen)
  if (isLoading && totalVideojuegos === 0) {
      return <LayoutAplication breadcrumbs={breadcrumbs}><div className="p-10">Cargando datos maestros...</div></LayoutAplication>;
  }
  if (error) {
      return <LayoutAplication breadcrumbs={breadcrumbs}><div className="p-10 text-red-500">Error: {error.message} <Button onClick={fetchGlobalData}>Reintentar</Button></div></LayoutAplication>;
  }

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-6 p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes y Analítica</h1>
            <p className="text-muted-foreground">Visualización de resultados de evaluaciones</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchGlobalData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Actualizando..." : "Actualizar datos"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />Exportar Excel</Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf}><FilePdf className="mr-2 h-4 w-4" />Exportar PDF</Button>
          </div>
        </div>

        {/* Cards de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card><CardHeader className="pb-2 pt-2"><CardTitle className="text-sm font-medium">Total de Videojuegos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalVideojuegos}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 pt-2"><CardTitle className="text-sm font-medium">Promedio General</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{promedioGeneral}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 pt-2"><CardTitle className="text-sm font-medium">Progreso de Evaluación</CardTitle></CardHeader><CardContent className="pb-2"><div className="text-2xl font-bold">{totalEvaluaciones} / {totalJuradosAsignadosGeneral}</div><Progress value={progresoEvaluacionPorcentaje} className="mt-2" /></CardContent></Card>
        </div>

        {/* Cuerpo Principal: Filtros y Tabs */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          <FiltrosPanel /> {/* No necesita props, toma del contexto */}
          <div className="col-span-12 md:col-span-9">
            <Tabs defaultValue="tabla" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="tabla">Tabla de Resultados</TabsTrigger>
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
                <TabsTrigger value="graficos">Gráficos</TabsTrigger>
              </TabsList>
              <TabsContent value="tabla"><TablaResultados /></TabsContent>
              <TabsContent value="ranking"><TablaRanking /></TabsContent>
              <TabsContent value="graficos"><GraphicDisplay /></TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ReportsZoneTable: Asumir que usa contexto o recibe `listaVideojuegosFiltrados` si es necesario */}
        <ReportsZoneTable /* videojuegos={listaVideojuegosFiltradosSiLoNecesitaDirectamente} */ />
      </div>
    </LayoutAplication>
  );
}