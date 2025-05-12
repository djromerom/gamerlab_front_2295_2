// src/components/Tablas/TablaResultados.tsx (o la ruta que prefieras)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGlobalState } from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta
import { TabsContent } from '@/components/ui/tabs'; // Asumiendo que lo usas dentro de Tabs

// Nombres de los criterios como se espera que vengan del backend en VideojuegoData.criterios
// O como los quieres mostrar en la cabecera. Es mejor si coinciden.
const NOMBRES_CRITERIOS_TABLA = [
  {key: "Interfaz de Usuario", display: "Interfaz"},
  {key: "Interacción", display: "Interacción"},
  {key: "Resultados", display: "Resultados"},
  {key: "Presentación del Proyecto", display: "Presentación"},
  {key: "Funcionamiento del Programa", display: "Funcionamiento"},
  {key: "Presentación personal del equipo", display: "Presentación personal"},
];

const TablaResultados = () => {
  const { listaVideojuegosFiltrados, isLoading, error, fetchGlobalData } = useGlobalState();

  if (isLoading) {
    return <TabsContent value="tabla"><p>Cargando tabla de resultados...</p></TabsContent>;
  }

  if (error) {
    return (
      <TabsContent value="tabla">
        <p className="text-red-500">Error al cargar datos: {error.message}</p>
        <button onClick={fetchGlobalData} className="mt-2 p-2 bg-blue-500 text-white rounded">
          Reintentar
        </button>
      </TabsContent>
    );
  }

  if (!listaVideojuegosFiltrados || listaVideojuegosFiltrados.length === 0) {
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
                  {NOMBRES_CRITERIOS_TABLA.map(c => (
                    <TableHead key={c.key}>{c.display}</TableHead>
                  ))}
                  <TableHead>Promedio</TableHead>
                  <TableHead>Estado Eval.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listaVideojuegosFiltrados.map((videojuego) => (
                  <TableRow key={videojuego.id}>
                    <TableCell className="font-medium">{videojuego.nombre}</TableCell>
                    <TableCell>{videojuego.materia || '-'}</TableCell>
                    <TableCell>{videojuego.nrc || '-'}</TableCell>
                    {NOMBRES_CRITERIOS_TABLA.map(c => (
                      <TableCell key={c.key}>
                        {(videojuego.criterios[c.key] !== undefined ? videojuego.criterios[c.key].toFixed(1) : 'N/A')}
                      </TableCell>
                    ))}
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

export default TablaResultados;