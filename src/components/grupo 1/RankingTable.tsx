// src/components/Tablas/TablaRanking.tsx (o la ruta que prefieras)
import { useMemo } from 'react'; // useMemo para el ranking
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta
import { TabsContent } from '@/components/ui/tabs';

const TablaRanking = () => {
  const { listaVideojuegosFiltrados, isLoading, error, fetchGlobalData } = useGlobalState();

  // Calcula el ranking solo cuando listaVideojuegos cambia
  const videojuegosRanking = useMemo(() => {
    if (!listaVideojuegosFiltrados) return [];
    return [...listaVideojuegosFiltrados].sort((a, b) => b.promedio - a.promedio);
  }, [listaVideojuegosFiltrados]);

  if (isLoading) {
    return <TabsContent value="ranking"><p>Cargando ranking...</p></TabsContent>;
  }

  if (error) {
    return (
      <TabsContent value="ranking">
        <p className="text-red-500">Error al cargar datos: {error.message}</p>
        <button onClick={fetchGlobalData} className="mt-2 p-2 bg-blue-500 text-white rounded">
          Reintentar
        </button>
      </TabsContent>
    );
  }

  if (!videojuegosRanking || videojuegosRanking.length === 0) {
    return <TabsContent value="ranking"><p>No hay videojuegos para mostrar en el ranking.</p></TabsContent>;
  }

  return (
    <TabsContent value="ranking">
      <Card>
        <CardHeader className="pt-4">
          <CardTitle>Ranking General</CardTitle>
          <CardDescription>Videojuegos ordenados por puntaje promedio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Videojuego</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>NRC</TableHead>
                  <TableHead>Promedio</TableHead>
                  <TableHead>Estado Eval.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videojuegosRanking.map((videojuego, index) => (
                  <TableRow key={videojuego.id}>
                    <TableCell>
                      <Badge
                        variant={index < 3 ? "default" : "outline"}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                      >
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{videojuego.nombre}</TableCell>
                    <TableCell>{videojuego.materia || '-'}</TableCell>
                    <TableCell>{videojuego.nrc || '-'}</TableCell>
                    <TableCell className="font-bold">{videojuego.promedio.toFixed(2)}</TableCell>
                    <TableCell>
                      {typeof videojuego.evaluacionesCompletadas === 'number' &&
                      typeof videojuego.totalJuradosAsignados === 'number' &&
                      videojuego.totalJuradosAsignados > 0 ? (
                        <Badge
                          variant={
                            videojuego.evaluacionesCompletadas >= videojuego.totalJuradosAsignados
                              ? "success"
                              : "warning"
                          }
                        >
                          {videojuego.evaluacionesCompletadas}/{videojuego.totalJuradosAsignados}
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default TablaRanking;