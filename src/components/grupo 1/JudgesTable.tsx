// src/components/Tablas/TablaPorJurado.tsx
"use client";

import { useMemo } from "react"; // Añadido useMemo para optimizar
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Para el botón de reintentar
import {
  useGlobalState,
  VideojuegoData,
  // La interfaz Jurados del GlobalState ya debería coincidir con la que devuelve getJuradosData
  // Si no, asegúrate de que la interfaz Jurados en GlobalStateContext.ts sea:
  // export interface Jurados {
  //   id: string; // o number si el ID del User es number
  //   nombre: string;
  //   correo?: string;
  //   videojuegosAsignados: string[]; // Nombres
  //   videojuegosCompletos: string[]; // Nombres
  // }
  Jurados as JuradoData // Usamos el alias JuradoData
} from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta
//import { TabsContent } from '@/components/ui/tabs';
import { UserCheck, UserX, AlertCircle, Loader2 } from "lucide-react";

// No necesitamos JuradoConInfoAdicional si la interfaz Jurados en GlobalStateContext ya incluye correo opcionalmente.

const TablaPorJurado = () => {
  console.log("Renderizando TablaPorJurado - INICIO")
  const {
    listaVideojuegos, // Usaremos la lista completa para buscar detalles de los videojuegos asignados
    listaJurados,
    isLoading,
    error,
    fetchGlobalData, // Para el botón de reintentar
    // Los filtros globales (filtroMateria, filtroNRC) ya se aplican
    // para generar `listaVideojuegosFiltrados` en el GlobalStateProvider,
    // pero aquí necesitamos la lista completa (`listaVideojuegos`) para buscar por nombre.
    // Si queremos que los videojuegos ASIGNADOS también se filtren por los filtros globales,
    // usaremos listaVideojuegosFiltrados para obtener la lista de IDs/nombres válidos.
    listaVideojuegosFiltrados,
  } = useGlobalState();

  console.log("TablaPorJurado - isLoading:", isLoading);
  console.log("TablaPorJurado - error:", error);
  console.log("TablaPorJurado - listaJurados:", listaJurados);
  console.log("TablaPorJurado - listaVideojuegos:", listaVideojuegos);
  console.log("TablaPorJurado - listaVideojuegosFiltrados:", listaVideojuegosFiltrados);


  if (isLoading && (!listaJurados || listaJurados.length === 0)) {
    return (
      <div className="flex items-center justify-center py-10 min-h-[200px]">
        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Cargando tabla por jurado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" /> Error al Cargar Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive-foreground/90">
            No se pudieron obtener los datos necesarios. ({error.message})
          </p>
          <Button onClick={fetchGlobalData} variant="secondary" size="sm" className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>

    );
  }

  if (!listaJurados || listaJurados.length === 0) {
    return (

      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No hay jurados para mostrar.</p>
        </CardContent>
      </Card>

    );
  }

  // Creamos un mapa de videojuegos para búsqueda rápida de detalles por nombre
  // Esto asume que los nombres de videojuegos son únicos. Si no, usa IDs.
  const mapaVideojuegos = useMemo(() => {
    if (!listaVideojuegos) return new Map<string, VideojuegoData>();
    return new Map(listaVideojuegos.map(vj => [vj.nombre, vj]));
  }, [listaVideojuegos]);

  // Nombres/IDs de los videojuegos que SÍ pasan los filtros globales (materia, nrc, etc.)
  const nombresVideojuegosValidosFiltrados = useMemo(() => {
    if (!listaVideojuegosFiltrados) return new Set<string>(); // Si es undefined, ningún juego es válido por filtro global
    return new Set(listaVideojuegosFiltrados.map(vj => vj.nombre)); // Asumimos nombres únicos
  }, [listaVideojuegosFiltrados]);


  const juradoCards = listaJurados.map((jurado: JuradoData) => {
    //console.log(`TablaPorJurado - Procesando jurado: ${jurado.nombre}`, jurado);

    // --- LÓGICA PARA DETERMINAR LOS VIDEOJUEGOS BASE A MOSTRAR ---
    let nombresBaseVideojuegos: string[] = [];
    let fuenteVideojuegos: "asignados" | "completados" | "ninguno" = "ninguno";

    if (jurado.videojuegosAsignados && jurado.videojuegosAsignados.length > 0) {
      nombresBaseVideojuegos = jurado.videojuegosAsignados;
      fuenteVideojuegos = "asignados";
    } else if (jurado.videojuegosCompletos && jurado.videojuegosCompletos.length > 0) {
      // Si no hay asignados PERO sí hay completados (tu caso de prueba)
      nombresBaseVideojuegos = jurado.videojuegosCompletos;
      fuenteVideojuegos = "completados";
    }
    // Si ambos están vacíos, nombresBaseVideojuegos permanecerá [] y fuenteVideojuegos "ninguno"

    // --- FIN DE LÓGICA PARA DETERMINAR VIDEOJUEGOS BASE ---

    const videojuegosParaEsteJurado = nombresBaseVideojuegos
      .filter(nombreVideojuego =>
        // Aplicar filtro global: solo si el videojuego (ya sea asignado o completado)
        // también está en la lista de los que pasaron los filtros de materia/NRC.
        // Si listaVideojuegosFiltrados es undefined, nombresVideojuegosValidosFiltrados es Set vacío.
        nombresVideojuegosValidosFiltrados.has(nombreVideojuego)
      )
      .map(nombreVideojuego => {
        const detallesVideojuego = mapaVideojuegos.get(nombreVideojuego);
        if (!detallesVideojuego) {
          console.warn(`No se encontraron detalles para el videojuego: ${nombreVideojuego} (jurado ${jurado.nombre})`);
          return null;
        }
        // El estado de calificación se basa SIEMPRE en jurado.videojuegosCompletos
        const calificadoPorEsteJurado = jurado.videojuegosCompletos.includes(nombreVideojuego);
        return {
          ...detallesVideojuego,
          calificadoPorEsteJurado,
        };
      })
      .filter(vj => vj !== null) as (VideojuegoData & { calificadoPorEsteJurado: boolean })[];

    //console.log(`TablaPorJurado - Videojuegos para ${jurado.nombre} (fuente: ${fuenteVideojuegos}):`, videojuegosParaEsteJurado);

    if (videojuegosParaEsteJurado.length === 0) {
      //console.log(`TablaPorJurado - Jurado ${jurado.nombre} no tiene videojuegos (fuente: ${fuenteVideojuegos}) que coincidan con filtros.`);
      let mensajeNoJuegos = "No hay videojuegos que coincidan con los filtros actuales para este jurado.";
      if (fuenteVideojuegos === "ninguno") {
        mensajeNoJuegos = "Este jurado no tiene videojuegos asignados ni evaluados.";
      } else if (fuenteVideojuegos === "asignados" && jurado.videojuegosAsignados.length > 0) {
        mensajeNoJuegos = "Ninguno de los videojuegos asignados a este jurado coincide con los filtros actuales.";
      } else if (fuenteVideojuegos === "completados" && jurado.videojuegosCompletos.length > 0) {
        mensajeNoJuegos = "Ninguno de los videojuegos evaluados por este jurado coincide con los filtros actuales.";
      }

      return (
        <Card key={jurado.id} className="overflow-hidden opacity-70">
          <CardHeader className="bg-muted/30 p-4 border-b">
            <CardTitle className="text-md font-medium text-muted-foreground">Jurado: {jurado.nombre}</CardTitle>
            {jurado.correo && <CardDescription className="text-xs text-muted-foreground">Correo: {jurado.correo}</CardDescription>}
          </CardHeader>
          <CardContent className="p-4 text-sm text-center text-muted-foreground">
            {mensajeNoJuegos}
          </CardContent>
        </Card>
      );
    }

    //console.log(`TablaPorJurado - Jurado ${jurado.nombre} TIENE videojuegos (fuente: ${fuenteVideojuegos}), renderizando tabla.`);
    let descripcionFuente = "";
    if (fuenteVideojuegos === "asignados") {
        descripcionFuente = `Mostrando ${videojuegosParaEsteJurado.length} de ${jurado.videojuegosAsignados.length} videojuego(s) asignado(s) (filtrados).`;
    } else if (fuenteVideojuegos === "completados") {
        descripcionFuente = `Mostrando ${videojuegosParaEsteJurado.length} de ${jurado.videojuegosCompletos.length} videojuego(s) evaluado(s) (filtrados, sin asignación formal).`;
    }

    return (
      <Card key={jurado.id} className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-4 border-b">
          <CardTitle className="text-lg">Jurado: {jurado.nombre}</CardTitle>
          {jurado.correo && <CardDescription>Correo: {jurado.correo}</CardDescription>}
          <CardDescription>
            {descripcionFuente} <br />
            Total asignados (original): {jurado.videojuegosAsignados.length}, Total completados (original): {jurado.videojuegosCompletos.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Videojuego</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>NRC</TableHead>
                  <TableHead className="text-center">Estado Calificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videojuegosParaEsteJurado.map((videojuego) => (
                  <TableRow key={`${jurado.id}-${videojuego.id}`}>
                    <TableCell className="font-medium">{videojuego.nombre || 'Sin Nombre'}</TableCell>
                    <TableCell>{videojuego.materia || '-'}</TableCell>
                    <TableCell>{videojuego.nrc || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={videojuego.calificadoPorEsteJurado ? "success" : "outline"} className="text-xs">
                        {videojuego.calificadoPorEsteJurado ? (
                          <UserCheck className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <UserX className="mr-1 h-3.5 w-3.5" />
                        )}
                        {videojuego.calificadoPorEsteJurado ? "Calificado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  });

  const contenidoVisible = juradoCards.some(
    (element) => {
        // Consideramos contenido visible si al menos una card no es solo el mensaje de "no juegos para este jurado"
        // Esto es una heurística, podrías necesitar una forma más robusta de identificar las cards "vacías"
        // Por ahora, si el elemento existe y no es una card con opacidad (que usamos para las vacías)
        return element && element.props.className && !element.props.className.includes("opacity-70");
    }
  );

  if (!contenidoVisible && listaJurados.length > 0) {
    console.log("TablaPorJurado - Retornando: Todos los jurados filtrados o sin juegos, mostrando mensaje general.");
    return (
        <Card className="mt-4">
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground pb-3">
                    Ningún jurado tiene videojuegos (asignados o evaluados) que coincidan con los filtros actuales para mostrar.
                </p>
            </CardContent>
        </Card>
    );
  }

  console.log("TablaPorJurado - Retornando: JSX principal con las cards de los jurados.");
  return (
    <div className="space-y-6">
      {juradoCards} {/* .filter(Boolean) no es necesario si el map siempre devuelve una Card */}
    </div>
  );
};

export default TablaPorJurado;