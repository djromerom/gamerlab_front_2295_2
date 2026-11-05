// src/components/Tablas/TablaResultados.tsx (o la ruta que prefieras)

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGlobalState, VideojuegoData } from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta
import { TabsContent } from '@/components/ui/tabs'; // Asumiendo que lo usas dentro de Tabs
import { Loader2 } from "lucide-react"; // Icono de carga
import { Button } from "@/components/ui/button";
import { useCriteria } from "@/hooks/use-criteria";
import { buildCriteriaColumns, getCriterionValue } from "@/lib/criteria-columns";

const TablaResultados = () => {
  const { listaVideojuegosFiltrados, isLoading, error, fetchGlobalData } = useGlobalState();

  const { criteria } = useCriteria();

  const videojuegosOrdenados = useMemo(() => {
    if (!listaVideojuegosFiltrados) {
      return []; // Retornar array vacío si la lista original no está definida
    }
    // Crear una copia del array para no mutar el original del contexto
    return [...listaVideojuegosFiltrados].sort((a, b) => {
      // Manejar casos donde materia pueda ser null, undefined o no string
      const materiaA = typeof a.materia === 'string' ? a.materia.toLowerCase() : '';
      const materiaB = typeof b.materia === 'string' ? b.materia.toLowerCase() : '';

      if (materiaA < materiaB) {
        return -1; // a viene antes que b
      }
      if (materiaA > materiaB) {
        return 1; // b viene antes que a
      }
      return 0; // son iguales en términos de materia, podrías añadir un segundo criterio de orden
    });
  }, [listaVideojuegosFiltrados]); // Se recalculará si listaVideojuegosFiltrados cambia

  const columnasCriterios = useMemo(
    () => buildCriteriaColumns(criteria, listaVideojuegosFiltrados ?? []),
    [criteria, listaVideojuegosFiltrados],
  );

  if (isLoading) {
    return (
      <TabsContent value="tabla" className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Cargando tabla de resultados...</p>
        </div>
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="tabla">
        <p className="text-red-500">Error al cargar datos: {error.message}</p>
        <Button onClick={fetchGlobalData} className="mt-2 p-2 bg-blue-500 text-white rounded">
          Reintentar
        </Button>
        </TabsContent>
    );
  }

  if (!videojuegosOrdenados || videojuegosOrdenados.length === 0) {
    return <TabsContent value="tabla"><p>No hay videojuegos para mostrar en la tabla.</p></TabsContent>;
  }

  return (
    <TabsContent value="tabla">
      <Card>
        <CardHeader className="pt-4">
          <CardTitle>Tabla de Resultados</CardTitle>
          <CardDescription>Evaluaciones por videojuego y criterio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Videojuego</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>NRC</TableHead>
                  {columnasCriterios.map(c => (
                    <TableHead key={c.id}>{c.name}</TableHead>
                  ))}
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Estado Eval.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videojuegosOrdenados.map((videojuego: VideojuegoData) => {
                  // Comprobación adicional: asegurarse de que 'criterios' es un objeto
                  // y no null o undefined antes de intentar acceder a sus propiedades.
                   // Para depuración
                  const criteriosDelVideojuego = videojuego.criterios && typeof videojuego.criterios === 'object'
                    ? videojuego.criterios
                    : {}; // Si no es un objeto válido, tratarlo como un objeto vacío

                  return (
                    <TableRow key={videojuego.id}>
                      <TableCell className="font-medium">{videojuego.nombre || 'Sin Nombre'}</TableCell>
                      <TableCell>{videojuego.materia || '-'}</TableCell>
                      <TableCell>{videojuego.nrc || '-'}</TableCell>
                      {columnasCriterios.map(columna => {
                        const valor = getCriterionValue(criteriosDelVideojuego, columna);
                        return (
                          <TableCell key={columna.id}>
                            {typeof valor === 'number' ? valor.toFixed(2) : 'N/A'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="font-bold">
                        {/* Asegurarse que promedio es un número antes de llamar a toFixed */}
                        {typeof videojuego.promedio === 'number' ? videojuego.promedio.toFixed(2) : 'N/A'}
                      </TableCell>
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

export default TablaResultados;