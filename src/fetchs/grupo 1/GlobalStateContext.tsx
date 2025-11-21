// src/contexts/GlobalStateContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';

// Tus interfaces (asegúrate que coincidan con los datos de tu BD)

export interface VideojuegoData {
  id: number | string;  // Coincide con Videogame.id
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
  juradosAsignados?: string[]; // Nombres de jurados asignados (si es necesario)
  juradosCompletos?: string[]; // Nombres de jurados que completaron la evaluación
}

export interface Jurados {
  id: number;
  nombre: string;
  correo?: string; // Si tienes el correo, si no, omite o ajusta
  videojuegosAsignados: string[]; // Nombres de los videojuegos asignados
  videojuegosCompletos: string[]; // Nombres de los videojuegos que completaron
}

// Para las opciones en el filtro de "Materia"
export interface MateriaData {
  id: number;    // Coincide con Subject.id
  name: string; // Coincide con Subject.name
}

// Para las opciones en el filtro de "NRC"
export interface NRCData {
  id: number;    // Coincide con NRC.id
  codigo: number; // Coincide con NRC.code
  materiaNombre: string; // Nombre de la materia asociada
  promedioxNRC?: number; // Promedio de NRC, si es necesario
}


// Para el gráfico de torta "Distribución por Materia"
export interface DatosGraficoMateria {
  name: string;  // Nombre de la materia
  value: number; // Valor para el gráfico (promedio de videojuegos en esa materia)
  color?: string; // Color opcional para el segmento del gráfico
}


// --- INTERFAZ DEL VALOR DEL CONTEXTO GLOBAL ---
export interface GlobalStateContextType {
  // Estados de los filtros (los valores serán strings que representan "Todos" o un ID/nombre específico)
  filtroMateria: string; // Puede ser "Todas" o un MateriaData.id.toString() o MateriaData.nombre
  setFiltroMateria: React.Dispatch<React.SetStateAction<string>>;
  setFiltroMateriaExt: (value: string) => void; // Función para cambiar el filtro de materia y resetear NRC

  filtroNRC: string;     // Puede ser "Todos" o un NRCData.codigo.toString()
  setFiltroNRC: React.Dispatch<React.SetStateAction<string>>;

  // Datos principales
  videojuegoSeleccionado: VideojuegoData | null;
  setVideojuegoSeleccionado: React.Dispatch<React.SetStateAction<VideojuegoData | null>>;
  listaVideojuegos: VideojuegoData[]; // Lista completa de videojuegos recibida del API

  // Listas para poblar los <select> de los filtros
  opcionesFiltroMateria: MateriaData[];
  opcionesFiltroNRC: NRCData[];

  // Datos para otros gráficos globales
  datosGraficoTortaMaterias: DatosGraficoMateria[];

  listaVideojuegosFiltrados?: VideojuegoData[];
  nrcsFiltrados?: NRCData[];
  listaJurados?: Jurados[];

  // Estado de carga y error para los datos globales
  isLoading: boolean;
  error: Error | null;
  fetchGlobalData: () => Promise<void>; // Función para cargar/recargar todos estos datos
  
  // Permiso local para mostrar u ocultar calificaciones (frontend-only)
  canViewScores: boolean;
  setCanViewScores: React.Dispatch<React.SetStateAction<boolean>>;
}

// 2. Crear los Contextos
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

// Contexto ligero para permisos/UI que suelen provocar rerenders en consumidores si van juntos

// 3. Crear el Componente Proveedor
interface GlobalStateProviderProps {
  children: ReactNode;
}

export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
  // Estados de los filtros (valores seleccionados)
  const [filtroMateria, setFiltroMateria] = useState<string>("Todas");
  const [filtroNRC, setFiltroNRC] = useState<string>("Todos");
  // const [canViewScores, setCanViewScores] = useState<boolean | null>(null);
  const setFiltroMateriaExt = (value: string) => {
    setFiltroMateria(value);
    setFiltroNRC("Todos"); // Resetea el filtro de NRC si se selecciona "Todas"
  };

  // Estados para los datos principales y la selección
  const [listaVideojuegos, setListaVideojuegos] = useState<VideojuegoData[]>([]);
  const [videojuegoSeleccionado, setVideojuegoSeleccionado] = useState<VideojuegoData | null>(null);
  const [listaJurados, setListaJurados] = useState<Jurados[]>([]); // Si necesitas la lista de jurados

  // Estados para las LISTAS DE OPCIONES de los filtros
  const [opcionesFiltroMateria, setOpcionesFiltroMateria] = useState<MateriaData[]>([]);
  const [opcionesFiltroNRC, setOpcionesFiltroNRC] = useState<NRCData[]>([]);


  // Estado para los datos del gráfico de torta
  const [datosGraficoTortaMaterias, setDatosGraficoTortaMaterias] = useState<DatosGraficoMateria[]>([]);


  // Estados de carga y error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const API_ENDPOINT = `${API_BASE_URL}/reports`;

  // Permiso local para que estudiantes vean calificaciones (persistido en localStorage)
  const [canViewScores, setCanViewScores] = useState<boolean>(false);

  // useEffect(() => {
  //   try {
  //     localStorage.setItem("canViewScores", String(canViewScores));
  //   } catch {}
  // }, [canViewScores]);
  // // sincronizar entre pestañas
  // useEffect(() => {
  //   const handler = (e: StorageEvent) => {
  //     if (e.key === "canViewScores") {
  //       try {
  //         setCanViewScores(e.newValue === "true");
  //       } catch {}
  //     }
  //   };
  //   window.addEventListener("storage", handler);
  //   return () => window.removeEventListener("storage", handler);
  // }, []);

  // Consultar endpoint /settings/evaluations para obtener permiso y refrescar periódicamente
  useEffect(() => {
    const controller = new AbortController();
    const endpoint = `${API_BASE_URL}/settings/evaluations`;

    const fetchPermission = async () => {
      try {
        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) {
          // si falla, mantener estado local (no forzar true). Ajusta según política.
          console.warn("Permission fetch failed:", res.status);
          return;
        }
        const body = await res.json();

        console.log("Fetched evaluation settings:", body);
        // soporta boolean directo o objetos como { enabled: true } / { studentsCanView: true }
        const enabled = typeof body === "boolean" ? body :  body?.evaluationsOpen ?? false;

        // tu lógica de fecha...
        const now = new Date();
        const target = body?.endDate ? new Date(body.endDate) : null;
        const newVal = (enabled === false && target && now >= target) ? true : Boolean(enabled);

        setCanViewScores(prev => (prev === newVal ? prev : newVal));


      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Error fetching /settings/evaluations:", err);
      }
    };

    fetchPermission();
    
  }, []); 

  // Función para cargar todos los datos globales
  const fetchGlobalData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        fetch(`${API_ENDPOINT}/videojuegoData`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`${API_ENDPOINT}/MateriaData`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`${API_ENDPOINT}/NRCData`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`${API_ENDPOINT}/DatosGraficoMateria`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
        fetch(`${API_ENDPOINT}/JuradosData`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      // Verificar todas las respuestas
      for (const response of responses) {
        if (!response.ok) {
          // Intenta obtener más detalles del error si es posible
          const errorData = await response.text(); // o response.json() si tu API devuelve errores JSON
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}. URL: ${response.url}. Details: ${errorData}`);
        }
      }

      // Desestructurar las promesas de los JSON después de verificar que todas las respuestas están OK
      const [
        fetchedVideojuegos,
        fetchedMaterias,
        fetchedNRCs,
        fetchedDatosGraficoMateria,
        fetchedJurados
      ] = await Promise.all(responses.map(res => res.json()));

      // Ahora TypeScript sabrá los tipos si los endpoints devuelven los JSON correctos
      setListaVideojuegos(fetchedVideojuegos as VideojuegoData[]);
      setOpcionesFiltroMateria(fetchedMaterias as MateriaData[]); // <-- CORRECCIÓN: Usar el setter correcto
      setOpcionesFiltroNRC(fetchedNRCs as NRCData[]);          // <-- CORRECCIÓN: Usar el setter correcto
      setDatosGraficoTortaMaterias(fetchedDatosGraficoMateria as DatosGraficoMateria[]); // <-- CORRECCIÓN: Nombre del estado y setter consistentes
      setListaJurados(fetchedJurados as Jurados[]);

      if (fetchedVideojuegos && (fetchedVideojuegos as VideojuegoData[]).length > 0) {
        setVideojuegoSeleccionado((fetchedVideojuegos as VideojuegoData[])[0]);
      } else {
        setVideojuegoSeleccionado(null);
      }

    } catch (e: any) {
      console.error("Failed to fetch global data:", e);
      setError(e instanceof Error ? e : new Error(String(e.message || "Error desconocido al cargar datos")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  // SUGERENCIA: Derivar la lista filtrada aquí
  const listaVideojuegosFiltrados = useMemo(() => {
    // Primero, manejar el caso de que listaVideojuegos no esté definida o esté vacía
    if (!listaVideojuegos || listaVideojuegos.length === 0) {
      return [];
    }

    // Empezar con todos los videojuegos si no hay filtros activos o si la lista base está vacía
    let filtradosIntermedios = [...listaVideojuegos];

    // Aplicar filtro de Materia
    if (filtroMateria !== "Todas") {
      filtradosIntermedios = filtradosIntermedios.filter(
        (vj) => vj.materia === filtroMateria
      );
    }

    // Aplicar filtro de NRC (sobre los ya filtrados por materia, si aplica)
    if (filtroNRC !== "Todos") {
      filtradosIntermedios = filtradosIntermedios.filter(
        (vj) => vj.nrc?.toString() === filtroNRC // Asegurar comparación de strings si vj.nrc puede ser number
      );
    }

    return filtradosIntermedios;
  }, [listaVideojuegos, filtroMateria, filtroNRC]);

  const nrcsFiltrados = useMemo<NRCData[]>(() => {
    if (!Array.isArray(opcionesFiltroNRC)) return [];

    return filtroMateria === "Todas"
      ? opcionesFiltroNRC
      : opcionesFiltroNRC.filter(nrc => {
        // También puedes agregar verificación para nrc.materiaNombre si es necesario
        return nrc.materiaNombre === filtroMateria;
      });
  }, [filtroMateria, opcionesFiltroNRC]);

  // console.log("Lista de videojuegos filtrados:", listaVideojuegosFiltrados);

  const contextValue = useMemo(() => ({
    // Filtros seleccionados
    filtroMateria, setFiltroMateria, setFiltroMateriaExt,
    filtroNRC, setFiltroNRC,

    // Datos de videojuegos
    videojuegoSeleccionado, setVideojuegoSeleccionado,
    listaVideojuegos,
    listaVideojuegosFiltrados, // <-- SUGERENCIA: Añadir esto
    nrcsFiltrados,
    listaJurados, // <-- SUGERENCIA: Añadir esto si es necesario

    // Permiso local para ver calificaciones (frontend-only)
    canViewScores,
    setCanViewScores,

    // Opciones para los filtros
    opcionesFiltroMateria,
    opcionesFiltroNRC,
    // Datos para gráficos
    datosGraficoTortaMaterias, // <-- CORRECCIÓN: Nombre consistente

    // Estado de carga/error
    isLoading,
    error,
    fetchGlobalData,
  }), [
    // Dependencias: todos los estados que se incluyen en contextValue
    filtroMateria, filtroNRC,
    videojuegoSeleccionado, listaVideojuegos, listaVideojuegosFiltrados,
    opcionesFiltroMateria, opcionesFiltroNRC, nrcsFiltrados,
    listaJurados, // <-- SUGERENCIA: Añadir esto si es necesario
    datosGraficoTortaMaterias, // <-- CORRECCIÓN: Nombre consistente
    isLoading, error,
    canViewScores,
    // fetchGlobalData es estable y no necesita estar aquí, pero no hace daño.
  ]);

  // Memoizar solo el valor de permisos para que consumidores que solo lean permisos
  // no se vean re-renderizados cuando cambian los datos pesados del contexto global.

  return (
      <GlobalStateContext.Provider value={contextValue}>
        {children}
      </GlobalStateContext.Provider>
  );
}

// 4. Custom Hook (sin cambios)
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState debe ser usado dentro de un GlobalStateProvider');
  }
  return context;
}