// src/contexts/GlobalStateContext.tsx
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";

// Tus interfaces (asegúrate que coincidan con los datos de tu BD)

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
  id: number; // Coincide con Subject.id
  name: string; // Coincide con Subject.name
}

// Para las opciones en el filtro de "NRC"
export interface NRCData {
  id: number; // Coincide con NRC.id
  codigo: number; // Coincide con NRC.code
  materiaNombre: string; // Nombre de la materia asociada
  promedioxNRC?: number; // Promedio de NRC, si es necesario
}

// Para el gráfico de torta "Distribución por Materia"
export interface DatosGraficoMateria {
  name: string; // Nombre de la materia
  value: number; // Valor para el gráfico (promedio de videojuegos en esa materia)
  color?: string; // Color opcional para el segmento del gráfico
}

// --- INTERFAZ DEL VALOR DEL CONTEXTO GLOBAL ---
export interface GlobalStateContextType {
  // Estados de los filtros (los valores serán strings que representan "Todos" o un ID/nombre específico)
  filtroMateria: string; // Puede ser "Todas" o un MateriaData.id.toString() o MateriaData.nombre
  setFiltroMateria: React.Dispatch<React.SetStateAction<string>>;
  setFiltroMateriaExt: (value: string) => void; // Función para cambiar el filtro de materia y resetear NRC

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

  listaVideojuegosFiltrados?: VideojuegoData[];
  nrcsFiltrados?: NRCData[];
  listaJurados?: Jurados[];

  // Estado de carga y error para los datos globales
  isLoading: boolean;
  error: Error | null;
  fetchGlobalData: () => Promise<void>; // Función para cargar/recargar todos estos datos
  fetchJurados: () => Promise<void>; // Recarga solo los jurados (requieren sesión)
  clearJurados: () => void;
  hasSessionRef: React.MutableRefObject<boolean>; // lo marca JuradosAuthSync

  // Permiso local para mostrar u ocultar calificaciones (frontend-only)
  canViewScores: boolean;
  setCanViewScores: React.Dispatch<React.SetStateAction<boolean>>;

  canViewRanking: boolean;
  setCanViewRanking: React.Dispatch<React.SetStateAction<boolean>>;

  canViewJudges: boolean;
  setCanViewJudges: React.Dispatch<React.SetStateAction<boolean>>;
}

// 2. Crear los Contextos
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(
  undefined,
);

// Contexto ligero para permisos/UI que suelen provocar rerenders en consumidores si van juntos

// 3. Crear el Componente Proveedor
interface GlobalStateProviderProps {
  children: ReactNode;
}

export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
  // Estados de los filtros (valores seleccionados)
  const [filtroMateria, setFiltroMateria] = useState<string>("Todas");
  const [filtroNRC, setFiltroNRC] = useState<string>("Todos");
  const setFiltroMateriaExt = (value: string) => {
    setFiltroMateria(value);
    setFiltroNRC("Todos"); // Resetea el filtro de NRC si se selecciona "Todas"
  };

  // Estados para los datos principales y la selección
  const [listaVideojuegos, setListaVideojuegos] = useState<VideojuegoData[]>(
    [],
  );
  const [videojuegoSeleccionado, setVideojuegoSeleccionado] =
    useState<VideojuegoData | null>(null);
  const [listaJurados, setListaJurados] = useState<Jurados[]>([]); // Si necesitas la lista de jurados

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

  //

  const API_BASE_URL = `${import.meta.env.VITE_ENDPOINT_BACKEND}`;
  const API_ENDPOINT = `${API_BASE_URL}/reports`;

  // Permiso local para que los jurados puedan calificar a los equipos
  const [canViewJudges, setCanViewJudges] = useState<boolean>(false);
  const [canViewScores, setCanViewScores] = useState<boolean>(false);
  const [canViewRanking, setCanViewRanking] = useState<boolean>(false);

  //permiso para que los jurados puedan ver los equipos asignados y calificarlos
  useEffect(() => {
    const controller = new AbortController();
    const endpoint = `${API_BASE_URL}/settings/evaluations-status`;
    setCanViewJudges(false);
    const fetchPermission = async () => {
      try {
        // Usamos apiFetch para que, si el jurado lleva mucho tiempo inactivo,
        // la sesión se refresque automáticamente antes de cargar los permisos.
        const res = await apiFetch(endpoint, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) {
          // si falla, mantener estado local (no forzar true). Ajusta según política.
          console.warn("Permission fetch failed:", res.status);
          return;
        }
        const body = await res.json();

        // soporta boolean directo o objetos como { enabled: true } / { studentsCanView: true }
        const enabled =
          typeof body === "boolean" ? body : (body?.evaluationsOpen ?? false);

        // tu lógica de fecha...

        setCanViewJudges(enabled);
      } catch (err: any) {
        if (err.name !== "AbortError")
          console.error("Error fetching /settings/evaluations:", err);
      }
    };

    fetchPermission();
  }, []);

  // Consultar endpoint /settings/evaluations (estudiantes pueden ver calificaciones)
  useEffect(() => {
    const controller = new AbortController();
    const endpoint = `${API_BASE_URL}/settings/show-evaluations`;
    setCanViewScores(false); // valor por defecto
    const fetchPermission = async () => {
      try {
        const res = await apiFetch(endpoint, {
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

        // soporta boolean directo o objetos como { enabled: true } / { studentsCanView: true }
        const enabled =
          typeof body === "boolean" ? body : (body?.showEvaluations ?? false);

        // tu lógica de fecha...

        setCanViewScores(enabled);
      } catch (err: any) {
        if (err.name !== "AbortError")
          console.error("Error fetching /settings/evaluations:", err);
      }
    };

    fetchPermission();
  }, []);

  // Ranking - permiso para habilitar el ranking publico
  useEffect(() => {
    const controller = new AbortController();
    const endpoint = `${API_BASE_URL}/settings/show-ranking`;
    setCanViewRanking(false);
    const fetchPermission = async () => {
      try {
        const res = await apiFetch(endpoint, {
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

        // soporta boolean directo o objetos como { enabled: true } / { studentsCanView: true }
        const enabled =
          typeof body === "boolean" ? body : (body?.showRanking ?? false);

        // tu lógica de fecha...

        setCanViewRanking(enabled);
      } catch (err: any) {
        if (err.name !== "AbortError")
          console.error("Error fetching /settings/evaluations:", err);
      }
    };

    fetchPermission();
  }, []);

  // JuradosData exige sesión (BG-02): se carga aparte para que un 401 antes del login
  // no tumbe el resto de datos, y se vuelve a pedir al iniciar sesión (ver JuradosAuthSync).
  // El contador descarta respuestas viejas si se piden los jurados varias veces seguidas.
  const juradosRequestRef = useRef(0);

  const fetchJurados = useCallback(async () => {
    const requestId = ++juradosRequestRef.current;
    try {
      const res = await apiFetch(`${API_ENDPOINT}/JuradosData`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = res.ok ? await res.json() : [];
      if (requestId === juradosRequestRef.current) {
        setListaJurados(Array.isArray(data) ? (data as Jurados[]) : []);
      }
    } catch (e) {
      console.error("Failed to fetch jurados:", e);
      if (requestId === juradosRequestRef.current) setListaJurados([]);
    }
  }, [API_ENDPOINT]);

  const clearJurados = useCallback(() => {
    juradosRequestRef.current++;
    setListaJurados([]);
  }, []);

  // Lo actualiza JuradosAuthSync; fetchGlobalData solo pide los jurados si hay sesión.
  const hasSessionRef = useRef(false);

  // Función para cargar todos los datos globales
  const fetchGlobalData = async () => {
    setIsLoading(true);
    setError(null);
    if (hasSessionRef.current) fetchJurados();
    try {
      // Cargamos todos los datos globales (videojuegos, materias, NRCs, etc.)
      // usando apiFetch para garantizar que la comunicación sea resiliente a errores 401.
      const responses = await Promise.all([
        apiFetch(`${API_ENDPOINT}/videojuegoData`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        apiFetch(`${API_ENDPOINT}/MateriaData`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        apiFetch(`${API_ENDPOINT}/NRCData`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        apiFetch(`${API_ENDPOINT}/DatosGraficoMateria`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
      ]);

      // Verificar todas las respuestas
      for (const response of responses) {
        if (!response.ok) {
          // Intenta obtener más detalles del error si es posible
          const errorData = await response.text(); // o response.json() si tu API devuelve errores JSON
          throw new Error(
            `Error HTTP ${response.status}: ${response.statusText}. URL: ${response.url}. Details: ${errorData}`,
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
        fetchedDatosGraficoMateria as DatosGraficoMateria[],
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
          : new Error(String(e.message || "Error desconocido al cargar datos")),
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
    // Primero, manejar el caso de que listaVideojuegos no esté definida o esté vacía
    if (!listaVideojuegos || listaVideojuegos.length === 0) {
      return [];
    }

    // Empezar con todos los videojuegos si no hay filtros activos o si la lista base está vacía
    let filtradosIntermedios = [...listaVideojuegos];

    // Aplicar filtro de Materia
    if (filtroMateria !== "Todas") {
      filtradosIntermedios = filtradosIntermedios.filter(
        (vj) => vj.materia === filtroMateria,
      );
    }

    // Aplicar filtro de NRC (sobre los ya filtrados por materia, si aplica)
    if (filtroNRC !== "Todos") {
      filtradosIntermedios = filtradosIntermedios.filter(
        (vj) => vj.nrc?.toString() === filtroNRC, // Asegurar comparación de strings si vj.nrc puede ser number
      );
    }

    return filtradosIntermedios;
  }, [listaVideojuegos, filtroMateria, filtroNRC]);

  const nrcsFiltrados = useMemo<NRCData[]>(() => {
    if (!Array.isArray(opcionesFiltroNRC)) return [];

    return filtroMateria === "Todas"
      ? opcionesFiltroNRC
      : opcionesFiltroNRC.filter((nrc) => {
          // También puedes agregar verificación para nrc.materiaNombre si es necesario
          return nrc.materiaNombre === filtroMateria;
        });
  }, [filtroMateria, opcionesFiltroNRC]);

  //

  const contextValue = useMemo(
    () => ({
      // Filtros seleccionados
      filtroMateria,
      setFiltroMateria,
      setFiltroMateriaExt,
      filtroNRC,
      setFiltroNRC,

      // Datos de videojuegos
      videojuegoSeleccionado,
      setVideojuegoSeleccionado,
      listaVideojuegos,
      listaVideojuegosFiltrados, // <-- SUGERENCIA: Añadir esto
      nrcsFiltrados,
      listaJurados, // <-- SUGERENCIA: Añadir esto si es necesario

      // Permiso local para ver calificaciones (frontend-only)
      canViewScores,
      setCanViewScores,
      canViewRanking,
      setCanViewRanking,
      canViewJudges,
      setCanViewJudges,
      // Opciones para los filtros
      opcionesFiltroMateria,
      opcionesFiltroNRC,
      // Datos para gráficos
      datosGraficoTortaMaterias, // <-- CORRECCIÓN: Nombre consistente

      // Estado de carga/error
      isLoading,
      error,
      fetchGlobalData,
      fetchJurados,
      clearJurados,
      hasSessionRef,
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
      nrcsFiltrados,
      listaJurados, // <-- SUGERENCIA: Añadir esto si es necesario
      datosGraficoTortaMaterias, // <-- CORRECCIÓN: Nombre consistente
      isLoading,
      error,
      canViewScores,
      canViewRanking,
      canViewJudges,
      fetchJurados,
      clearJurados,
      // fetchGlobalData es estable y no necesita estar aquí, pero no hace daño.
    ],
  );

  // Memoizar solo el valor de permisos para que consumidores que solo lean permisos
  // no se vean re-renderizados cuando cambian los datos pesados del contexto global.

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Vuelve a pedir los jurados cuando cambia la sesión. Va dentro de AuthProvider (App.tsx),
// porque GlobalStateProvider está por fuera y no se entera del login (BG-02).
export function JuradosAuthSync() {
  const { user, loading } = useAuth();
  const { fetchJurados, clearJurados, hasSessionRef } = useGlobalState();
  const userId = user?.id;

  useEffect(() => {
    if (loading) return;
    hasSessionRef.current = Boolean(userId);
    if (userId) {
      fetchJurados();
    } else {
      clearJurados();
    }
  }, [userId, loading, fetchJurados, clearJurados, hasSessionRef]);

  return null;
}

// 4. Custom Hook (sin cambios)
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalState debe ser usado dentro de un GlobalStateProvider",
    );
  }
  return context;
}
