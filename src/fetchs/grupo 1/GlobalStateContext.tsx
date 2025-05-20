// data/videojuegos.ts

// src/contexts/GlobalStateContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from "react";

// Tus interfaces (asegúrate que coincidan con los datos de tu BD)
// src/contexts/GlobalStateContext.tsx
//import React from 'react'; // Asegúrate de importar React si usas Dispatch, SetStateAction

// --- INTERFACES PARA LOS DATOS QUE LLEGAN DE LOS ENDPOINTS ---
// Estas interfaces deben coincidir con la estructura JSON que tu API devuelve.

// Para un elemento en la lista de videojuegos y para el videojuego seleccionado.
// Asume que el backend ya calculó promedios y formateó los criterios.

// En GlobalStateContext.tsx (solo la interfaz VideojuegoData)
export interface VideojuegoData {
  id: number | string; // Coincide con Videogame.id
  nombre: string; // Coincide con Videogame.name
  logoUrl?: string | null;
  materia?: string | null; // Nombre de la materia
  nrc?: number | string | null; // Código del NRC asociado
  promedio: number; // Promedio general ya calculado
  criterios: {
    [nombreCriterio: string]: number; // ej: { "Jugabilidad": 4.5, "Diseño": 4.0 }
  };
  evaluacionesCompletadas?: number; // Número de evaluaciones recibidas
  totalJuradosAsignados?: number; // Total de jurados que deben evaluar
  // Otros campos que el backend pueda proveer, como 'estadoVideojuego', etc.
  // Por ejemplo, si el endpoint también devuelve el equipo, el estado, etc.
  // teamName?: string;
  // status?: string;
}

// Para las opciones en el filtro de "Materia"
export interface MateriaData {
  id: number; // Coincide con Subject.id
  name: string; // Coincide con Subject.name
  // codigo?: string; // Coincide con Subject.code, si lo necesitas
}

// Para las opciones en el filtro de "NRC"
export interface NRCData {
  id: number; // Coincide con NRC.id
  codigo: number; // Coincide con NRC.code
  materiaNombre?: string; // Si el endpoint de NRCs incluye el nombre de la materia
}

// Para el gráfico de torta "Distribución por Materia"
// Asume que el backend devuelve los datos ya agregados.
export interface DatosGraficoMateria {
  name: string; // Nombre de la materia
  value: number; // Valor para el gráfico (ej. promedio de videojuegos en esa materia, o cantidad)
  color?: string; // Color opcional para el segmento del gráfico
}

// --- INTERFAZ DEL VALOR DEL CONTEXTO GLOBAL ---
export interface GlobalStateContextType {
  // Estados de los filtros (los valores serán strings que representan "Todos" o un ID/nombre específico)
  filtroMateria: string; // Puede ser "Todas" o un MateriaData.id.toString() o MateriaData.nombre
  setFiltroMateria: React.Dispatch<React.SetStateAction<string>>;

  filtroNRC: string; // Puede ser "Todos" o un NRCData.codigo.toString()
  setFiltroNRC: React.Dispatch<React.SetStateAction<string>>;

  // Datos principales
  videojuegoSeleccionado: VideojuegoData | null;
  setVideojuegoSeleccionado: React.Dispatch<
    React.SetStateAction<VideojuegoData | null>
  >;
  listaVideojuegos: VideojuegoData[]; // Lista completa de videojuegos recibida del API

  // Listas para poblar los <select> de los filtros
  opcionesFiltroMateria: MateriaData[];
  opcionesFiltroNRC: NRCData[];

  // Datos para otros gráficos globales
  datosGraficoTortaMaterias: DatosGraficoMateria[];

  listaVideojuegosFiltrados?: VideojuegoData[]; // SUGERENCIA: Añadir esto

  // Estado de carga y error para los datos globales
  isLoading: boolean;
  error: Error | null;
  fetchGlobalData: () => Promise<void>; // Función para cargar/recargar todos estos datos
}

// 2. Crear el Contexto
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(
  undefined
);

// 3. Crear el Componente Proveedor
interface GlobalStateProviderProps {
  children: ReactNode;
}

export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
  // Asegúrate que GlobalStateProviderProps esté definida
  // Estados de los filtros (valores seleccionados)
  const [filtroMateria, setFiltroMateria] = useState<string>("Todas");
  const [filtroNRC, setFiltroNRC] = useState<string>("Todos");

  // Estados para los datos principales y la selección
  const [listaVideojuegos, setListaVideojuegos] = useState<VideojuegoData[]>(
    []
  );
  const [videojuegoSeleccionado, setVideojuegoSeleccionado] =
    useState<VideojuegoData | null>(null);

  // Estados para las LISTAS DE OPCIONES de los filtros
  const [opcionesFiltroMateria, setOpcionesFiltroMateria] = useState<
    MateriaData[]
  >([]);
  const [opcionesFiltroNRC, setOpcionesFiltroNRC] = useState<NRCData[]>([]);

  // Estado para los datos del gráfico de torta
  const [datosGraficoTortaMaterias, setDatosGraficoTortaMaterias] = useState<
    DatosGraficoMateria[]
  >([]);

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGlobalData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        fetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/reports/videojuegoData`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        ),
        fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/reports/MateriaData`, {
          credentials: "include",
        }),
        fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/reports/NRCData`, {
          credentials: "include",
        }),
        fetch(
          `${
            import.meta.env.VITE_ENDPOINT_BACKEND
          }/reports/DatosGraficoMateria`,
          {
            credentials: "include",
          }
        ),
      ]);

      // Verificar todas las respuestas
      for (const response of responses) {
        if (!response.ok) {
          // Intenta obtener más detalles del error si es posible
          const errorData = await response.text(); // o response.json() si tu API devuelve errores JSON
          throw new Error(
            `Error HTTP ${response.status}: ${response.statusText}. URL: ${response.url}. Details: ${errorData}`
          );
        }
      }

      // Desestructurar las promesas de los JSON después de verificar que todas las respuestas están OK
      const [
        fetchedVideojuegos,
        fetchedMaterias,
        fetchedNRCs,
        fetchedDatosGraficoMateria,
      ] = await Promise.all(responses.map((res) => res.json()));

      // Ahora TypeScript sabrá los tipos si los endpoints devuelven los JSON correctos
      setListaVideojuegos(fetchedVideojuegos as VideojuegoData[]);
      setOpcionesFiltroMateria(fetchedMaterias as MateriaData[]); // <-- CORRECCIÓN: Usar el setter correcto
      setOpcionesFiltroNRC(fetchedNRCs as NRCData[]); // <-- CORRECCIÓN: Usar el setter correcto
      setDatosGraficoTortaMaterias(
        fetchedDatosGraficoMateria as DatosGraficoMateria[]
      ); // <-- CORRECCIÓN: Nombre del estado y setter consistentes

      if (
        fetchedVideojuegos &&
        (fetchedVideojuegos as VideojuegoData[]).length > 0
      ) {
        setVideojuegoSeleccionado((fetchedVideojuegos as VideojuegoData[])[0]);
      } else {
        setVideojuegoSeleccionado(null);
      }
    } catch (e: any) {
      console.error("Failed to fetch global data:", e);
      setError(
        e instanceof Error
          ? e
          : new Error(String(e.message || "Error desconocido al cargar datos"))
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  // SUGERENCIA: Derivar la lista filtrada aquí
  const listaVideojuegosFiltrados = useMemo(() => {
    return listaVideojuegos.filter((vj) => {
      const pasaMateria =
        filtroMateria === "Todas" ||
        (vj.materia &&
          opcionesFiltroMateria.find((m) => m.name === filtroMateria)?.name ===
            vj.materia); // Si filtroMateria es nombre

      //console.log("Filtro de materia:", filtroMateria, "Pasa materia:", pasaMateria, "string pendejo:", opcionesFiltroMateria.find(m => m.id.toString()), "vj.materia:", vj.materia,
      //"String god", opcionesFiltroMateria.find(m => m.name));
      const pasaNRC =
        filtroNRC === "Todos" || (vj.nrc && vj.nrc.toString() === filtroNRC);

      return pasaMateria && pasaNRC;
    });
  }, [listaVideojuegos, filtroMateria, filtroNRC, opcionesFiltroMateria]);

  console.log("Lista de videojuegos filtrados:", listaVideojuegosFiltrados);

  const contextValue = useMemo(
    () => ({
      // Filtros seleccionados
      filtroMateria,
      setFiltroMateria,
      filtroNRC,
      setFiltroNRC,

      // Datos de videojuegos
      videojuegoSeleccionado,
      setVideojuegoSeleccionado,
      listaVideojuegos,
      listaVideojuegosFiltrados, // <-- SUGERENCIA: Añadir esto

      // Opciones para los filtros
      opcionesFiltroMateria,
      opcionesFiltroNRC,
      // Datos para gráficos
      datosGraficoTortaMaterias, // <-- CORRECCIÓN: Nombre consistente

      // Estado de carga/error
      isLoading,
      error,
      fetchGlobalData,
    }),
    [
      // Dependencias: todos los estados que se incluyen en contextValue
      filtroMateria,
      filtroNRC,
      videojuegoSeleccionado,
      listaVideojuegos,
      listaVideojuegosFiltrados,
      opcionesFiltroMateria,
      opcionesFiltroNRC,
      datosGraficoTortaMaterias, // <-- CORRECCIÓN: Nombre consistente
      isLoading,
      error,
      // fetchGlobalData es estable y no necesita estar aquí, pero no hace daño.
    ]
  );

  return (
    // Asumo que GlobalStateContext está definido más arriba
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// 4. Custom Hook (sin cambios)
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalState debe ser usado dentro de un GlobalStateProvider"
    );
  }
  return context;
}
