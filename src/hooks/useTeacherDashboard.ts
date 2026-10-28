// [MODIFICACION]: Creacion del Custom Hook para aislar la logica de obtencion de datos del perfil
// docente

// Aqui se aplica el principio de separacion de responsabilidades, el componente solo se encarga de
// la UI y el hook de la logica de negocio

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useFetch } from "./useFetch";

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

interface UseTeacherDashboardProps {
  initialNRC?: string;
  itemsPerPage?: number;
}

export function useTeacherDashboard({
  initialNRC,
  itemsPerPage = 20,
}: UseTeacherDashboardProps = {}) {
  const customFetch = useFetch();
  // Aqui se colocan los estados (isLoading, students, error, etc)
  const defaultNRC = initialNRC || "-";
  // Selection states: primero Materia, luego NRC (NRC depende de la materia)
  const [selectedNRC, setSelectedNRC] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  const [paginationMetadata, setPaginationMetadata] =
    useState<PaginationMetadata | null>(null);

  // Available options
  const [availableNRCs, setAvailableNRCs] = useState<any[]>([]);
  // Guarda la lista completa de NRCs recibida inicialmente para poder aplicar filtros locales
  const [allNRCs, setAllNRCs] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  // Data cache - keeps fetched data to avoid re-fetching
  const [fetchedStudentsByNRC, setFetchedStudentsByNRC] = useState<
    Record<string, any[]>
  >({});
  const [fetchedStudentsBySubject, setFetchedStudentsBySubject] = useState<
    Record<string, any[]>
  >({});



  // Estados de carga (¡Estos se quedan en el asistente!)
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStudents, setNoStudents] = useState(false);

  // Nota: ahora usamos únicamente el endpoint `/professors/my-subjects` (cada materia incluye sus NRCs)
  // por lo que no necesitamos llamar a `/professors/my-nrcs` por separado. Inicializamos `allNRCs`
  // cuando cargamos las materias en el efecto de abajo.

  // Initialize available subjects
  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      try {
        const response = await customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/my-subjects`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!response.ok) {
          throw new Error("Error fetching available subjects");
        }

        const data = await response.json();
        
        // Agregar materia virtual para equipos evaluados como jurado
        data.push({
          id: "juror_virtual",
          name: "Evaluaciones como Jurado (Universitarios)",
          nrcs: []
        });

        setAvailableSubjects(data);

        // Extraer todos los NRCs incluidos en cada materia y anexar info de la materia
        const allNrcsFromSubjects = (data || []).flatMap((subject: any) => {
          const subjectId = subject.id || subject._id || subject.code;
          const subjectName = subject.name || subject.title || "";
          const nrcs = subject.nrcs || [];
          return nrcs.map((nrc: any) => ({
            ...nrc,
            subject: { id: subjectId, name: subjectName },
          }));
        });

        // Guardamos todos los NRCs en el estado (se usará para filtrado local)
        setAllNRCs(allNrcsFromSubjects);

        if (data.length > 0) {
          const initialSubjectName = data[0].name;
          setSelectedSubject(initialSubjectName);
          // Inicialmente filtramos los NRCs para la materia seleccionada
          const filtered = allNrcsFromSubjects.filter((n: any) => {
            const name = n.subject?.name || n.subjectName || n.name || "";
            return (
              name &&
              String(name).toLowerCase() ===
                String(initialSubjectName).toLowerCase()
            );
          });
          setAvailableNRCs(filtered);
          // Si hay exactamente un NRC para la materia, auto-seleccionarlo (salvo que venga initialNRC explícito)
          if (filtered.length === 1) {
            if (!(defaultNRC && defaultNRC !== "-")) {
              setSelectedNRC(filtered[0].code ?? filtered[0].id ?? "");
            }
          }
          // Si se pasó un NRC por props (defaultNRC), lo aplicamos si existe (tiene prioridad)
          if (defaultNRC && defaultNRC !== "-") {
            const match = allNrcsFromSubjects.find(
              (x: any) =>
                String(x.code) === String(defaultNRC) ||
                String(x.id) === String(defaultNRC),
            );
            if (match) setSelectedNRC(defaultNRC);
          }
        } else {
          toast.info("No se encontraron materias disponibles");
        }
      } catch (err) {
        console.error("Error fetching available Subjects:", err);
        toast.error("Error al cargar las materias");
      } finally {
        // Desactivamos la pantalla inicial de carga
        setInitialLoading(false);
      }
    };

    fetchAvailableSubjects();
  }, []);

  // When the selected subject changes, try to narrow the list of NRCs to that subject.
  useEffect(() => {
    if (!selectedSubject) return;

    const fetchNRCsBySubject = async () => {
      // Usamos la lista completa `allNRCs` (que ya contiene `subject` si pedimos includeSubjects=true)
      const subjObj = availableSubjects.find(
        (s: any) =>
          String(s.name).toLowerCase() ===
          String(selectedSubject).toLowerCase(),
      );
      const subjectId =
        subjObj?.id ||
        subjObj?.subjectId ||
        subjObj?._id ||
        subjObj?.code ||
        null;

      const filtered = allNRCs.filter((nrc: any) => {
        if (!nrc) return false;
        // Si el backend incluyó subject, comparamos por subject.id
        if (nrc.subject && (nrc.subject.id || nrc.subject._id)) {
          const nrcSubjectId = nrc.subject.id || nrc.subject._id;
          if (subjectId) return String(nrcSubjectId) === String(subjectId);
        }
        // Si no hay id, buscamos claves comunes en el objeto nrc
        const nrcSubjectIdAlt =
          nrc.subjectId ||
          nrc.subject_id ||
          nrc.materiaId ||
          nrc.materia_id ||
          nrc.signatureId ||
          nrc.signature_id;
        if (subjectId && nrcSubjectIdAlt)
          return String(nrcSubjectIdAlt) === String(subjectId);

        // Fallback por nombre de materia
        const name =
          nrc.subject?.name ||
          nrc.subjectName ||
          nrc.name ||
          nrc.signature ||
          "";
        return (
          name &&
          String(name).toLowerCase() === String(selectedSubject).toLowerCase()
        );
      });

      if (filtered.length > 0) {
        setAvailableNRCs(filtered);
        // Si solo hay un NRC disponible para la materia, auto-seleccionarlo
        if (filtered.length === 1) {
          setSelectedNRC(filtered[0].code ?? filtered[0].id ?? "");
        } else {
          // Varios NRCs: mostramos la opción "Todos los NRCs" por defecto
          setSelectedNRC("");
        }
      } else {
        setAvailableNRCs([]);
        setSelectedNRC("");
      }
    };

    fetchNRCsBySubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  // Fetch students by NRC
  const fetchStudentsByNRC = useCallback(
    async (nrc: string, page: number = 1) => {
      if (!nrc || nrc === "-") return;

      const cacheKey = `${nrc}-${page}`;

      // Check cache first
      if (fetchedStudentsByNRC[cacheKey]) {
        const cached = fetchedStudentsByNRC[cacheKey] || [];
        // Reflect cached state in the UI (avoid stale "no projects" view)
        setNoStudents(!cached || cached.length === 0);
        setPaginationMetadata((prev) => prev || null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setNoStudents(false);

      try {
        const response = await customFetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/nrc-report/${nrc}?page=${page}&limit=${itemsPerPage}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        toast.dismiss();

        if (response.status === 404) {
          setFetchedStudentsByNRC((prev) => ({
            ...prev,
            [cacheKey]: [],
          }));
          setNoStudents(true);
          setPaginationMetadata(null);
          toast.info(`No hay videojuegos registrados para el NRC ${nrc}`);
          return;
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const studentsData = data.data || [];
        const metadata = data.metadata;
        setFetchedStudentsByNRC((prev) => ({
          ...prev,
          [cacheKey]: studentsData,
        }));

        setPaginationMetadata(metadata);

        if (studentsData.length > 0) {
          // Calcular número de registros en la tabla (equipos únicos) a partir de los estudiantes recibidos
          const teamSet = new Set<string>();
          studentsData.forEach((s: any) => {
            const teamCode =
              s.teamCode || s.teamId || s.team || `TEAM_${s.studentCode}`;
            teamSet.add(String(teamCode));
          });
          const teamCount = teamSet.size;
          toast.success(
            `${teamCount} equipos en la tabla cargados para el NRC ${nrc}`,
          );
        } else {
          setNoStudents(true);
          toast.info(`No hay información registrada para el NRC ${nrc}`);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Error al cargar videojuegos";
        setError(errorMsg);
        toast.error(`Error: ${errorMsg}`);

        setFetchedStudentsByNRC((prev) => ({
          ...prev,
          [cacheKey]: [],
        }));
        setPaginationMetadata(null);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage],
  );

  // Fetch students by subject
  const fetchStudentsBySubject = useCallback(
    async (subject: string, page: number = 1) => {
      if (!subject) return;

      const cacheKey = `${subject}-${page}`;

      // Check cache first
      if (fetchedStudentsBySubject[cacheKey]) {
        const cached = fetchedStudentsBySubject[cacheKey] || [];
        // Reflect cached state in the UI immediately
        setNoStudents(!cached || cached.length === 0);
        setPaginationMetadata((prev) => prev || null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setNoStudents(false);

      try {
        let response;
        if (subject === "Evaluaciones como Jurado (Universitarios)") {
          response = await customFetch(
            `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/juror-evaluations?page=${page}&limit=${itemsPerPage}`,
            {
              method: "GET",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            },
          );
        } else {
          response = await customFetch(
            `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/signature-report/${encodeURIComponent(subject)}?page=${page}&limit=${itemsPerPage}`,
            {
              method: "GET",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        toast.dismiss();

        if (response.status === 404) {
          setFetchedStudentsBySubject((prev) => ({
            ...prev,
            [cacheKey]: [],
          }));
          setNoStudents(true);
          setPaginationMetadata(null);
          toast.info(
            `No hay videojuegos registrados para la materia ${subject}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const studentsArray = data.data || [];
        const metadata = data.metadata;

        setFetchedStudentsBySubject((prev) => ({
          ...prev,
          [cacheKey]: studentsArray,
        }));

        setPaginationMetadata(metadata);

        if (!studentsArray || studentsArray.length === 0) {
          setNoStudents(true);
          toast.info(
            `No hay información registrada para la materia ${subject}`,
          );
        } else {
          // Agrupar por equipo para contar registros en la tabla
          const teamSet = new Set<string>();
          studentsArray.forEach((s: any) => {
            const teamCode =
              s.teamCode || s.teamId || s.team || `TEAM_${s.studentCode}`;
            teamSet.add(String(teamCode));
          });
          const teamCount = teamSet.size;
          toast.success(
            `${teamCount} equipos en la tabla cargados para la materia ${subject}`,
          );
        }
      } catch (err) {
        console.error("Error fetching students by subject:", err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Error al cargar videojuegos por materia";
        setError(errorMsg);
        toast.error(`Error: ${errorMsg}`);

        setFetchedStudentsBySubject((prev) => ({
          ...prev,
          [cacheKey]: [],
        }));
        setPaginationMetadata(null);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage],
  );

  // Handle data fetching when selection changes: priorizamos materia, pero si hay NRC seleccionado usamos ese reporte
  useEffect(() => {
    setError(null);
    setNoStudents(false);
    setCurrentPage(1);
    setPaginationMetadata(null);

    // Si hay NRC específico seleccionado, usamos ese
    if (selectedNRC && selectedNRC !== "") {
      fetchStudentsByNRC(selectedNRC, 1);
    }
    // Si no hay NRC o está vacío, pero hay materia, cargamos por materia (todos los NRCs)
    else if (selectedSubject) {
      fetchStudentsBySubject(selectedSubject, 1);
    }
  }, [
    selectedNRC,
    selectedSubject,
    fetchStudentsByNRC,
    fetchStudentsBySubject,
  ]);

  // Handle page changes
  useEffect(() => {
    if (currentPage > 1) {
      if (selectedNRC && selectedNRC !== "") {
        fetchStudentsByNRC(selectedNRC, currentPage);
      } else if (selectedSubject) {
        fetchStudentsBySubject(selectedSubject, currentPage);
      }
    }
  }, [
    currentPage,
    selectedNRC,
    selectedSubject,
    fetchStudentsByNRC,
    fetchStudentsBySubject,
  ]);



  // Get current students data
  const getCurrentStudents = () => {
    const cacheKey = selectedNRC
      ? `${selectedNRC}-${currentPage}`
      : `${selectedSubject}-${currentPage}`;
    if (selectedNRC) {
      return fetchedStudentsByNRC[cacheKey] || [];
    }
    return fetchedStudentsBySubject[cacheKey] || [];
  };

  const students = getCurrentStudents();

  // Agrupar estudiantes por equipo (soporta varios shapes: teamCode, team, teamName)
  // Agrupar por equipo usando los campos del backend (teamCode, nrc, team, integrantes, etc.)
  const teams = useMemo(() => {
    const map = new Map<string, any>();

    students.forEach((s: any) => {
      const teamCode =
        s.teamCode ||
        s.team ||
        s.videogameId ||
        s.videogame ||
        `TEAM_${s.nrc || ""}_${s.team || ""}`;
      if (!map.has(teamCode)) {
        map.set(teamCode, {
          teamCode: s.teamCode || s.team || "-",
          nrc: s.nrc || "-",
          teamName: s.team || s.teamName || "-",
          integrantes: s.integrantes
            ? s.integrantes.split(",").map((x: any) => x.trim())
            : [],
          videogame: s.videogame || "-",
          calificacionFeria: s.calificacionFeria ?? null,
          calificacionDocente: s.calificacionDocente ?? null,
          videogameId: s.videogameId ?? null,
          _rows: [s],
        });
      } else {
        const t = map.get(teamCode);
        if (s.integrantes) {
          const nuevos = s.integrantes.split(",").map((x: any) => x.trim());
          t.integrantes = Array.from(new Set([...t.integrantes, ...nuevos]));
        }
        t._rows.push(s);
      }
    });
    return Array.from(map.values());
  }, [students]);

  // No view mode: la navegación es Materia -> NRC

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (paginationMetadata && currentPage < paginationMetadata.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  return {
    // Aqui se retornan las varialbes y funciones que el componente visual necesita usar
    selectedNRC,
    setSelectedNRC,
    selectedSubject,
    setSelectedSubject,
    currentPage,
    setCurrentPage,
    paginationMetadata,
    availableNRCs,
    availableSubjects,
    isLoading,
    initialLoading,
    error,
    setError,
    noStudents,
    teams,
    handlePreviousPage,
    handleNextPage,
    fetchStudentsByNRC,
    fetchStudentsBySubject,
    setFetchedStudentsByNRC,
    setFetchedStudentsBySubject,
  };
}
