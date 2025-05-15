// src/components/Tablas/TablaPorJurado.tsx (o la ruta que prefieras)
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useGlobalState, VideojuegoData, Jurados as JuradoData } from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta
import { TabsContent } from '@/components/ui/tabs';
import { AlertCircle, UserCheck, UserX } from "lucide-react"; // Iconos para estado

interface JuradoConInfoAdicional extends JuradoData {
  correo?: string; // Si tienes el correo, si no, omite o ajusta
}

const TablaPorJurado = () => {
  const {
    listaVideojuegosFiltrados, // Usaremos esta lista ya filtrada
    listaJurados,             // Necesitamos la lista de jurados del estado global
    isLoading,
    error,
    // filtroMateria, // No se usa directamente aquí, ya se aplica en listaVideojuegosFiltrados
    // filtroNRC,     // No se usa directamente aquí
  } = useGlobalState();

  // Deberías obtener o calcular la lista de jurados.
  // Por ahora, asumiré que la tienes en `listaJurados` desde el GlobalState.
  // Si no, necesitarás una forma de obtenerla o derivarla.
  // Ejemplo de cómo podrías construirla si solo tienes los videojuegos:
  // const juradosUnicos = useMemo(() => { ...lógica para extraer jurados... }, [listaVideojuegos]);

  if (isLoading) {
    return <TabsContent value="porJurado"><p>Cargando tabla por jurado...</p></TabsContent>;
  }

  if (error) {
    return (
      <TabsContent value="porJurado">
        <p className="text-red-500">Error al cargar datos: {error.message}</p>
      </TabsContent>
    );
  }

  if (!listaJurados || listaJurados.length === 0) {
    return <TabsContent value="porJurado"><p>No hay jurados para mostrar.</p></TabsContent>;
  }

  return (
    <TabsContent value="porJurado" className="space-y-6">
      {listaJurados.map((jurado: JuradoConInfoAdicional) => {
        // 1. Filtrar los videojuegos que están asignados a ESTE jurado
        //    Y que también están presentes en la lista general filtrada (listaVideojuegosFiltrados)
        const videojuegosAsignadosAlJuradoYFiltrados = listaVideojuegosFiltrados.filter(vj =>
          // Opción A: Si JuradoData.videojuegosAsignados tiene IDs/Nombres de videojuegos
          jurado.videojuegosAsignados.includes(vj.nombre) || // o vj.id.toString() si guardas IDs
          // Opción B: Si VideojuegoData.juradosAsignados tiene nombres/IDs de jurados
          vj.juradosAsignados?.includes(jurado.nombre) // o jurado.id.toString()
        );

        // Si después de los filtros, este jurado no tiene videojuegos para mostrar,
        // podrías optar por no renderizar su segmento o mostrar un mensaje.
        if (videojuegosAsignadosAlJuradoYFiltrados.length === 0) {
          return null; // O un <Card> con un mensaje "No hay videojuegos filtrados para este jurado"
        }

        return (
          <Card key={jurado.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 p-4 border-b">
              <CardTitle className="text-lg">Jurado: {jurado.nombre}</CardTitle>
              {jurado.correo && <CardDescription>Correo: {jurado.correo}</CardDescription>}
              <CardDescription>
                Videojuegos Asignados (filtrados): {videojuegosAsignadosAlJuradoYFiltrados?.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0"> {/* Quitamos padding para que la tabla ocupe todo */}
              {videojuegosAsignadosAlJuradoYFiltrados.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Videojuego</TableHead>
                        <TableHead>Materia</TableHead>
                        <TableHead>NRC</TableHead>
                        <TableHead className="text-center">Estado Calificación (Jurado)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videojuegosAsignadosAlJuradoYFiltrados?.map((videojuego: VideojuegoData) => {
                        // Determinar si ESTE jurado ha completado la calificación de ESTE videojuego
                        const calificadoPorEsteJurado =
                          videojuego.juradosCompletos?.includes(jurado.nombre) || // Si usas nombres
                          // videojuego.juradosCompletos?.includes(jurado.id.toString()) || // Si usas IDs
                          // Alternativamente, si JuradoData tiene videojuegosCompletos:
                          jurado.videojuegosCompletos?.includes(videojuego.nombre); // o videojuego.id

                        return (
                          <TableRow key={`${jurado.id}-${videojuego.id}`}>
                            <TableCell className="font-medium">{videojuego.nombre || 'Sin Nombre'}</TableCell>
                            <TableCell>{videojuego.materia || '-'}</TableCell>
                            <TableCell>{videojuego.nrc || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={calificadoPorEsteJurado ? "success" : "outline"} className="text-xs">
                                {calificadoPorEsteJurado ? (
                                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                                ) : (
                                  <UserX className="mr-1 h-3.5 w-3.5" />
                                )}
                                {calificadoPorEsteJurado ? "Calificado" : "Pendiente"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No hay videojuegos asignados (o que coincidan con los filtros actuales) para este jurado.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </TabsContent>
  );
};

export default TablaPorJurado;