// src/components/Filtros/FiltrosPanel.tsx (o la ruta que prefieras)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalState, VideojuegoData } from "@/fetchs/grupo 1/GlobalStateContext"; // Ajusta la ruta

const FiltrosPanel = () => {
  const {
    // Estados de los filtros seleccionados
    filtroMateria, setFiltroMateria,
    filtroNRC, setFiltroNRC,

    // Estado del videojuego seleccionado
    videojuegoSeleccionado, setVideojuegoSeleccionado,

    // Listas de opciones para los filtros
    opcionesFiltroMateria,
    opcionesFiltroNRC,
    listaVideojuegos, // Para el selector de videojuegos

    // Estado de carga (para deshabilitar filtros mientras se carga, opcional)
    isLoading,
  } = useGlobalState();

  const handleVideojuegoChange = (value: string) => {
    // Asumimos que 'value' es el ID del videojuego como string
    const seleccionado = listaVideojuegos.find((v) => v.id.toString() === value);
    if (seleccionado) {
      setVideojuegoSeleccionado(seleccionado);
    } else if (listaVideojuegos.length > 0) {
      // Si por alguna razón no se encuentra (no debería pasar si la lista está bien),
      // o si se quiere un valor por defecto, se podría seleccionar el primero.
      // O podrías manejarlo para que no cambie si el valor es inválido.
      setVideojuegoSeleccionado(listaVideojuegos[0]);
    }
  };

  // Puedes mostrar un estado de carga o deshabilitar los selects si isLoading es true
  if (isLoading && (opcionesFiltroMateria.length === 0 && opcionesFiltroNRC.length === 0 && listaVideojuegos.length === 0)) {
    return (
      <div className="col-span-12 md:col-span-3">
        <Card className="h-full pt-2">
          <CardHeader className="pt-2"><CardTitle>Filtros</CardTitle></CardHeader>
          <CardContent><p>Cargando opciones de filtros...</p></CardContent>
        </Card>
      </div>
    );
  }

  //console.log(opcionesFiltroMateria); // Para depurar y ver qué datos tienes
  return (
    <div className="col-span-12 md:col-span-3"> {/* Mantén las clases de grid si este componente se coloca directamente en un grid */}
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
              onValueChange={setFiltroMateria}
              disabled={isLoading || opcionesFiltroMateria.length === 0}
              name="filtro-materia"
            >
              <SelectTrigger id="filtro-materia">
                <SelectValue placeholder="Seleccionar materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las Materias</SelectItem>
                {opcionesFiltroMateria.map((materia) => (
                  // Asumimos que el valor que guardas en filtroMateria es el ID (o un identificador único)
                  // Si es el nombre, entonces value={materia.nombre}
                  <SelectItem key={materia.id} value={materia.name}>
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
              onValueChange={setFiltroNRC}
              disabled={isLoading || opcionesFiltroNRC.length === 0}
              name="filtro-nrc"
            >
              <SelectTrigger id="filtro-nrc">
                <SelectValue placeholder="Seleccionar NRC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos los NRCs</SelectItem>
                {opcionesFiltroNRC.map((nrc) => (
                  // Asumimos que el valor de filtroNRC es el código del NRC como string
                  <SelectItem key={nrc.id} value={nrc.codigo.toString()}>
                    {nrc.codigo} {/* Puedes añadir más info si la tienes, ej: nrc.materiaNombre */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Videojuego (este no es un filtro para la lista, sino para seleccionar cuál ver en detalle) */}
          <div className="space-y-2">
            <label htmlFor="select-videojuego" className="text-sm font-medium">Videojuego</label>
            <Select
              // Si videojuegoSeleccionado puede ser null al inicio (antes de cargar datos)
              value={videojuegoSeleccionado ? videojuegoSeleccionado.id.toString() : ""}
              onValueChange={handleVideojuegoChange}
              disabled={isLoading || listaVideojuegos.length === 0}
              name="select-videojuego"
            >
              <SelectTrigger id="select-videojuego">
                <SelectValue placeholder="Seleccionar videojuego" />
              </SelectTrigger>
              <SelectContent>
                {listaVideojuegos.length === 0 && !isLoading && (
                  <SelectItem value="" disabled>No hay videojuegos disponibles</SelectItem>
                )}
                {listaVideojuegos.map((videojuego: VideojuegoData) => (
                  <SelectItem key={videojuego.id} value={videojuego.id.toString()}>
                    {videojuego.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FiltrosPanel;