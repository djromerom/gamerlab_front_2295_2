// src/components/Tablas/TablaRanking.tsx
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"; // Adjust path
import { TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For better error display
import { AVERAGES_HIDDEN_MESSAGE, isRankingHidden } from "@/features/results/lib/averages";
import { Loader2, AlertCircle, Trophy } from "lucide-react"; // Icons

const RankingTable = () => {
  const { listaVideojuegosFiltrados, isLoading, error, fetchGlobalData } = useGlobalState();

  // Calculate the ranking safely, handling potentially missing or invalid 'promedio'
  const videojuegosRanking = useMemo(() => {
    if (!listaVideojuegosFiltrados) return [];

    // Filter out entries without a valid numeric average *before* sorting,
    // or assign a default low value if you want them ranked last.
    // Option 1: Filter out invalid entries
    // const validEntries = listaVideojuegosFiltrados.filter(v => typeof v.promedio === 'number' && !isNaN(v.promedio));
    // return [...validEntries].sort((a, b) => b.promedio - a.promedio);

    // Option 2: Sort invalid entries to the bottom (treating non-numbers as -Infinity)
    return [...listaVideojuegosFiltrados].sort((a, b) => {
      const promedioA = typeof a.promedio === 'number' && !isNaN(a.promedio) ? a.promedio : -Infinity;
      const promedioB = typeof b.promedio === 'number' && !isNaN(b.promedio) ? b.promedio : -Infinity;
      return promedioB - promedioA; // Higher average comes first
    });

  }, [listaVideojuegosFiltrados]);

  // Helper function to format numbers or return 'N/A'
  const formatNumber = (value: number | undefined | null, fixedDigits: number): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(fixedDigits);
    }
    return 'N/A';
  };

  // Consistent loading state
  if (isLoading) {
    return (
      <TabsContent value="ranking" className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando ranking...</p>
        </div>
      </TabsContent>
    );
  }

  // Improved error display
  if (error) {
    return (
      <TabsContent value="ranking">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los datos para el ranking. ({error.message})
          </AlertDescription>
          <Button onClick={fetchGlobalData} variant="secondary" size="sm" className="mt-4">
            Reintentar
          </Button>
        </Alert>
      </TabsContent>
    );
  }

  if (isRankingHidden(listaVideojuegosFiltrados ?? [])) {
    return (
      <TabsContent value="ranking">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground pb-6">{AVERAGES_HIDDEN_MESSAGE}</p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  // Clear message when no data is available
  if (!videojuegosRanking || videojuegosRanking.length === 0) {
    return (
      <TabsContent value="ranking">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground pb-6">
              No hay videojuegos con datos suficientes para mostrar en el ranking.
            </p>
            {/* Optional: Add a message if the original list had items but they were filtered out
             {listaVideojuegosFiltrados && listaVideojuegosFiltrados.length > 0 && (
               <p className="text-center text-xs text-muted-foreground mt-1">
                 (Algunos videojuegos pueden no tener un promedio calculado)
               </p>
             )} */}
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="ranking">
      <Card>
        <CardHeader className="pt-4 px-4 md:px-6">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Ranking General
          </CardTitle>
          <CardDescription>Videojuegos ordenados por puntaje promedio descendente.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 md:px-2">
          <div className="overflow-x-auto pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-[80px]">Posición</TableHead> 
                  <TableHead className="whitespace-nowrap">Videojuego</TableHead>
                  <TableHead className="whitespace-nowrap">Materia</TableHead>
                  <TableHead className="whitespace-nowrap">NRC</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Puntaje</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Estado Eval.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videojuegosRanking.map((videojuego, index) => {
                  let badgeVariant: "success" | "warning" | "outline" = "outline";
                  let badgeText = "N/A";

                  // Lógica para el estado de evaluación
                  if (
                    typeof videojuego.evaluacionesCompletadas === 'number' &&
                    typeof videojuego.totalJuradosAsignados === 'number'
                  ) {
                    const completadas = videojuego.evaluacionesCompletadas;
                    const asignados = videojuego.totalJuradosAsignados;

                    if (asignados > 0) {
                      badgeVariant = completadas >= asignados
                        ? "success"
                        : "warning";
                      badgeText = `${completadas}/${asignados}`;
                    } else if (asignados === 0) {
                      badgeText = `${completadas}/0`;
                      badgeVariant = "outline";
                    }
                    // Si asignados < 0 (improbable), se usa el default N/A
                  }

                  // Lógica para el badge de posición
                  const finalPositionBadgeVariant = index < 3 ? "default" : "outline";

                  return (
                    <TableRow key={videojuego.id}>
                      <TableCell className="text-center">
                        <Badge
                          variant={finalPositionBadgeVariant} // Usamos la variable que sí se utiliza
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                        >
                          {index + 1}
                        </Badge>
                      </TableCell>
                      {/* ... resto de las TableCell ... */}
                      <TableCell className="font-medium whitespace-nowrap">{videojuego.nombre || 'Sin Nombre'}</TableCell>
                      <TableCell className="whitespace-nowrap">{videojuego.materia || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{videojuego.nrc || '-'}</TableCell>
                      <TableCell className="text-center font-bold">
                        {formatNumber(videojuego.promedio, 2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={badgeVariant}>
                          {badgeText}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default RankingTable;