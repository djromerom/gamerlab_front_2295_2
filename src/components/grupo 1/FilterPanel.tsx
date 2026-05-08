// src/components/Filtros/FiltrosPanel.tsx
"use client";

import { useEffect } from "react"; // Solo necesitamos useEffect para el reseteo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalState, VideojuegoData } from "@/fetchs/grupo 1/GlobalStateContext";

const FiltrosPanel = () => {
  const {
    filtroMateria,
    setFiltroMateriaExt,
    filtroNRC,
    setFiltroNRC,
    videojuegoSeleccionado,
    setVideojuegoSeleccionado,
    opcionesFiltroMateria,
    nrcsFiltrados,
    // listaVideojuegos, // Ya no se necesita directamente aquí si usamos listaVideojuegosFiltrados
    listaVideojuegosFiltrados, // <--- ESTA ES LA LISTA QUE USAMOS PARA LAS OPCIONES
    isLoading,
  } = useGlobalState();

  
  // Efecto para ajustar videojuegoSeleccionado si ya no es válido
  // cuando la lista de videojuegos filtrados cambia.
  useEffect(() => {
    if (videojuegoSeleccionado) {
      // Verificar si el videojuego seleccionado actualmente todavía existe en la nueva lista filtrada
      const seleccionadoAunEsValido = listaVideojuegosFiltrados?.some(
        (vj) => vj.id === videojuegoSeleccionado.id
      );
      if (!seleccionadoAunEsValido) {
        // Si no es válido, seleccionar el primero de la nueva lista o null
        setVideojuegoSeleccionado(
          listaVideojuegosFiltrados && listaVideojuegosFiltrados.length > 0
            ? listaVideojuegosFiltrados[0]
            : null
        );
      }
    } else {
      // Si no había nada seleccionado y ahora hay opciones filtradas, seleccionar el primero
      if (listaVideojuegosFiltrados && listaVideojuegosFiltrados.length > 0) {
        setVideojuegoSeleccionado(listaVideojuegosFiltrados[0]);
      }
    }
  }, [listaVideojuegosFiltrados, setVideojuegoSeleccionado]);
  // OJO: De nuevo, cuidado con 'videojuegoSeleccionado' en las dependencias aquí.
  // Depender de 'listaVideojuegosFiltrados' es más directo para este caso de reseteo.

  const handleMateriaChange = (value: string) => {
    setFiltroMateriaExt(value);
    setFiltroNRC("Todos"); // Resetear NRC cuando cambia la materia
    // El useEffect se encargará de videojuegoSeleccionado
  };

  const handleNrcChange = (value: string) => {
    setFiltroNRC(value);
    // El useEffect se encargará de videojuegoSeleccionado
  };

  const handleVideojuegoChange = (value: string) => {
    if (!value) { // Si se selecciona la opción placeholder/vacía
      setVideojuegoSeleccionado(null);
      return;
    }
    // Buscar en la lista filtrada que se está mostrando en el Select
    const seleccionado = listaVideojuegosFiltrados?.find(
      (vj) => vj.id.toString() === value
    );
    setVideojuegoSeleccionado(seleccionado || null);
  };

  // Estado de carga (ajustado para verificar listaVideojuegosFiltrados si es la principal)
  if (isLoading && (opcionesFiltroMateria.length === 0 && (!nrcsFiltrados || nrcsFiltrados.length === 0) && (!listaVideojuegosFiltrados || listaVideojuegosFiltrados.length === 0))) {
    return (
      <div className="col-span-12 md:col-span-3">
        <Card className="h-full pt-2">
          <CardHeader className="pt-2"><CardTitle>Filtros</CardTitle></CardHeader>
          <CardContent><p>Cargando opciones de filtros...</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="col-span-12 md:col-span-3">
      <Card className="h-full pt-2">
        <CardHeader className="pt-2">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refina los resultados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de Materia */}
          <div className="space-y-2">
            <label htmlFor="filtro-materia" className="text-sm font-medium">Materia</label>
            <Select
              value={filtroMateria}
              onValueChange={handleMateriaChange}
              disabled={isLoading || opcionesFiltroMateria.length === 0}
            >
              <SelectTrigger className="cursor-pointer" id="filtro-materia">
                <SelectValue placeholder="Seleccionar materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las Materias</SelectItem>
                {opcionesFiltroMateria.map((materia) => (
                  <SelectItem className="cursor-pointer" key={materia.id} value={materia.name}>
                    {materia.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de NRC */}
          <div className="space-y-2">
            <label htmlFor="filtro-nrc" className="text-sm font-medium">NRC</label>
            <Select
              value={filtroNRC}
              onValueChange={handleNrcChange}
              disabled={isLoading || !nrcsFiltrados || nrcsFiltrados.length === 0}
            >
              <SelectTrigger className="cursor-pointer" id="filtro-nrc">
                <SelectValue placeholder="Seleccionar NRC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos los NRCs</SelectItem>
                {nrcsFiltrados?.map((nrc) => (
                  <SelectItem className="cursor-pointer" key={nrc.id} value={nrc.codigo.toString()}>
                    {nrc.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Videojuego */}
          <div className="space-y-2 pb-3">
            <label htmlFor="select-videojuego" className="text-sm font-medium">Videojuego</label>
            <Select
              value={videojuegoSeleccionado ? videojuegoSeleccionado.id.toString() : undefined}
              onValueChange={handleVideojuegoChange}
              // Deshabilitar si isLoading o si la lista de videojuegos filtrados (que es la fuente de opciones) está vacía
              disabled={isLoading || !listaVideojuegosFiltrados || listaVideojuegosFiltrados.length === 0}
            >
              <SelectTrigger className="cursor-pointer" id="select-videojuego">
                <SelectValue placeholder="Seleccionar videojuego" />
              </SelectTrigger>
              <SelectContent>
                {/* Mensaje si no hay opciones */}
                {(!listaVideojuegosFiltrados || listaVideojuegosFiltrados.length === 0) && !isLoading && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                    {filtroMateria === "Todas" && filtroNRC === "Todos"
                      ? "No hay videojuegos disponibles"
                      : "No hay videojuegos con los filtros actuales"}
                  </div>
                )}
                {/* Iterar sobre listaVideojuegosFiltrados para las opciones */}
                {listaVideojuegosFiltrados?.map((videojuego: VideojuegoData) => {
                  // Asegurarse que el ID nunca sea una cadena vacía
                  const videojuegoIdString = videojuego.id.toString();
                  if (videojuegoIdString === "") {
                    // Esto no debería ocurrir si los IDs son válidos, pero es una salvaguarda
                    console.warn("Videojuego con ID vacío encontrado:", videojuego);
                    return null; // Omitir este SelectItem
                  }
                  return (
                    <SelectItem className="cursor-pointer" key={videojuego.id} value={videojuegoIdString}>
                      {videojuego.nombre}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FiltrosPanel;