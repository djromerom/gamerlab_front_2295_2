"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Loader2, ChevronLeft, ChevronRight, Upload, Download, Edit, Save, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
// Tabs removed: single flow Subject -> NRC
import { AlertTriangle } from "lucide-react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface Props {
  initialNRC?: string;
}

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export default function StudentGradeTable({ initialNRC }: Props) {
  const defaultNRC = initialNRC || "-";

  // Selection states: primero Materia, luego NRC (NRC depende de la materia)
  const [selectedNRC, setSelectedNRC] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [paginationMetadata, setPaginationMetadata] = useState<PaginationMetadata | null>(null);

  // Available options
  const [availableNRCs, setAvailableNRCs] = useState<any[]>([]);
  // Guarda la lista completa de NRCs recibida inicialmente para poder aplicar filtros locales
  const [allNRCs, setAllNRCs] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  // Data cache - keeps fetched data to avoid re-fetching
  const [fetchedStudentsByNRC, setFetchedStudentsByNRC] = useState<Record<string, any[]>>({});
  const [fetchedStudentsBySubject, setFetchedStudentsBySubject] = useState<Record<string, any[]>>({});

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStudents, setNoStudents] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadingGrades, setUploadingGrades] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  
  // Inline editing states
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedGrade, setEditedGrade] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  // Nota: ahora usamos únicamente el endpoint `/professors/my-subjects` (cada materia incluye sus NRCs)
  // por lo que no necesitamos llamar a `/professors/my-nrcs` por separado. Inicializamos `allNRCs`
  // cuando cargamos las materias en el efecto de abajo.

  // Initialize available subjects
  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/my-subjects`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Error fetching available subjects");
        }

        const data = await response.json();
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
            return name && String(name).toLowerCase() === String(initialSubjectName).toLowerCase();
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
            const match = allNrcsFromSubjects.find((x: any) => String(x.code) === String(defaultNRC) || String(x.id) === String(defaultNRC));
            if (match) setSelectedNRC(defaultNRC);
          }
        } else {
          toast.info("No se encontraron materias disponibles");
        }
      } catch (err) {
        console.error("Error fetching available Subjects:", err);
        toast.error("Error al cargar las materias");
      }
      finally {
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
      const subjObj = availableSubjects.find((s: any) => String(s.name).toLowerCase() === String(selectedSubject).toLowerCase());
      const subjectId = subjObj?.id || subjObj?.subjectId || subjObj?._id || subjObj?.code || null;

      const filtered = allNRCs.filter((nrc: any) => {
        if (!nrc) return false;
        // Si el backend incluyó subject, comparamos por subject.id
        if (nrc.subject && (nrc.subject.id || nrc.subject._id)) {
          const nrcSubjectId = nrc.subject.id || nrc.subject._id;
          if (subjectId) return String(nrcSubjectId) === String(subjectId);
        }
        // Si no hay id, buscamos claves comunes en el objeto nrc
        const nrcSubjectIdAlt = nrc.subjectId || nrc.subject_id || nrc.materiaId || nrc.materia_id || nrc.signatureId || nrc.signature_id;
        if (subjectId && nrcSubjectIdAlt) return String(nrcSubjectIdAlt) === String(subjectId);

        // Fallback por nombre de materia
        const name = nrc.subject?.name || nrc.subjectName || nrc.name || nrc.signature || "";
        return name && String(name).toLowerCase() === String(selectedSubject).toLowerCase();
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
  const fetchStudentsByNRC = useCallback(async (nrc: string, page: number = 1) => {
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
      const response = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/nrc-report/${nrc}?page=${page}&limit=${itemsPerPage}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.dismiss();

      if (response.status === 404) {
        setFetchedStudentsByNRC(prev => ({
          ...prev,
          [cacheKey]: []
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
      setFetchedStudentsByNRC(prev => ({
        ...prev,
        [cacheKey]: studentsData
      }));

      setPaginationMetadata(metadata);

      if (studentsData.length > 0) {
        // Calcular número de registros en la tabla (equipos únicos) a partir de los estudiantes recibidos
        const teamSet = new Set<string>();
        studentsData.forEach((s: any) => {
          const teamCode = s.teamCode || s.teamId || s.team || `TEAM_${s.studentCode}`;
          teamSet.add(String(teamCode));
        });
        const teamCount = teamSet.size;
        toast.success(`${teamCount} equipos en la tabla cargados para el NRC ${nrc}`);
      } else {
        setNoStudents(true);
        toast.info(`No hay información registrada para el NRC ${nrc}`);
      }

    } catch (err) {
      console.error("Error fetching students:", err);
      const errorMsg = err instanceof Error ? err.message : "Error al cargar videojuegos";
      setError(errorMsg);
      toast.error(`Error: ${errorMsg}`);

      setFetchedStudentsByNRC(prev => ({
        ...prev,
        [cacheKey]: []
      }));
      setPaginationMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

  // Fetch students by subject
  const fetchStudentsBySubject = useCallback(async (subject: string, page: number = 1) => {
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
      const response = await fetch(
        `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/signature-report/${encodeURIComponent(subject)}?page=${page}&limit=${itemsPerPage}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.dismiss();

      if (response.status === 404) {
        setFetchedStudentsBySubject(prev => ({
          ...prev,
          [cacheKey]: []
        }));
        setNoStudents(true);
        setPaginationMetadata(null);
        toast.info(`No hay videojuegos registrados para la materia ${subject}`);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const studentsArray = data.data || [];
      const metadata = data.metadata;

      setFetchedStudentsBySubject(prev => ({
        ...prev,
        [cacheKey]: studentsArray
      }));

      setPaginationMetadata(metadata);

      if (!studentsArray || studentsArray.length === 0) {
        setNoStudents(true);
        toast.info(`No hay información registrada para la materia ${subject}`);
      } else {
       // Agrupar por equipo para contar registros en la tabla
        const teamSet = new Set<string>();
        studentsArray.forEach((s: any) => {
          const teamCode = s.teamCode || s.teamId || s.team || `TEAM_${s.studentCode}`;
          teamSet.add(String(teamCode));
        });
        const teamCount = teamSet.size;
        toast.success(`${teamCount} equipos en la tabla cargados para la materia ${subject}`);
      }

    } catch (err) {
      console.error("Error fetching students by subject:", err);
      const errorMsg = err instanceof Error ? err.message : "Error al cargar videojuegos por materia";
      setError(errorMsg);
      toast.error(`Error: ${errorMsg}`);

      setFetchedStudentsBySubject(prev => ({
        ...prev,
        [cacheKey]: []
      }));
      setPaginationMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

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
  }, [selectedNRC, selectedSubject, fetchStudentsByNRC, fetchStudentsBySubject]);

  // Handle page changes
  useEffect(() => {
    if (currentPage > 1) {
      if (selectedNRC && selectedNRC !== "") {
        fetchStudentsByNRC(selectedNRC, currentPage);
      } else if (selectedSubject) {
        fetchStudentsBySubject(selectedSubject, currentPage);
      }
    }
  }, [currentPage, selectedNRC, selectedSubject, fetchStudentsByNRC, fetchStudentsBySubject]);

  // Get current students data
  const getCurrentStudents = () => {
    const cacheKey = selectedNRC ? `${selectedNRC}-${currentPage}` : `${selectedSubject}-${currentPage}`;
    if (selectedNRC) {
      return fetchedStudentsByNRC[cacheKey] || [];
    }
    return fetchedStudentsBySubject[cacheKey] || [];
  };

  const students = getCurrentStudents();

  // Agrupar estudiantes por equipo (soporta varios shapes: teamCode, team, teamName)
  const teams = useMemo(() => {
    const map = new Map<string, any>();
    students.forEach((s: any) => {
      const teamCode = s.teamCode || s.teamId || s.team || `TEAM_${s.studentCode}`;
      const teamName = s.teamName || s.team || `Equipo ${teamCode}`;
      if (!map.has(teamCode)) {
        map.set(teamCode, {
          teamCode,
          teamName,
          members: [],
          videogame: s.videogame || null,
          gradeSum: 0,
          gradeCount: 0,
          grade: null,
          seniorGrade: s.seniorGrade ?? null,
          // calificación docente única por equipo (tomamos la primera no nula)
          teacherGrade: null,
        });
      }
      const t = map.get(teamCode);
      t.members.push(s);
      if (s.videogame && !t.videogame) t.videogame = s.videogame;
      if (s.grade != null) {
        t.gradeSum += s.grade;
        t.gradeCount += 1;
      }
      // Calificación docente por fila (campo 'calificacionDocente' en el JSON)
      // Tomamos la primera calificación docente encontrada para el equipo (no acumulamos)
      if (s.calificacionDocente != null && t.teacherGrade == null) {
        t.teacherGrade = Number(s.calificacionDocente);
      }
      // If any member has seniorGrade and team doesn't, prefer member's grade (backend may send team-level)
      if (t.seniorGrade == null && s.seniorGrade != null) t.seniorGrade = s.seniorGrade;
    });

    const arr = Array.from(map.values()).map((t: any) => ({
      ...t,
      grade: t.gradeCount > 0 ? t.gradeSum / t.gradeCount : null,
  teacherGrade: t.teacherGrade ?? null,
    }));
    return arr;
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

  // Show initial loading screen
  if (initialLoading) {
    return <LoadingScreen text="Cargando información de videojuegos..." />;
  }

  // Show loading for data fetching
  if (isLoading) {
    return <LoadingScreen text={`Cargando datos para ${selectedNRC ? `NRC ${selectedNRC}` : `materia ${selectedSubject}`}...`} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 rounded-md border">
        <h3 className="text-lg font-semibold">Error al cargar datos</h3>
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-2 cursor-pointer"
          onClick={() => {
            setError(null);
            // Clear cache to force refresh
            const cacheKey = selectedNRC ? `${selectedNRC}-${currentPage}` : `${selectedSubject}-${currentPage}`;

            if (selectedNRC) {
              setFetchedStudentsByNRC(prev => {
                const newCache = { ...prev };
                delete newCache[cacheKey];
                return newCache;
              });
              fetchStudentsByNRC(selectedNRC, currentPage);
            } else {
              setFetchedStudentsBySubject(prev => {
                const newCache = { ...prev };
                delete newCache[cacheKey];
                return newCache;
              });
              fetchStudentsBySubject(selectedSubject, currentPage);
            }
            toast.info("Intentando cargar los datos nuevamente...");
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const getGradeStatus = (grade: number) => {
    if (grade >= 4.5) return "text-green-600 font-medium";
    if (grade >= 4.0) return "text-blue-600 font-medium";
    if (grade >= 3.0) return "text-yellow-600 font-medium";
    return "text-red-600 font-medium";
  };

  // Export to Excel function
  const exportToExcel = () => {
    setDownloading(true);

    // Exportar de forma GLOBAL: ignorar filtros de Materia/NRC
    toast(`Preparando exportación global (todos los NRCs)...`);

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/exportAll`;

    fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          throw new Error('Error al exportar a Excel');
        }
        return response.blob();
      })
      .then((blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
  a.download = `reporte_todos_nrcs_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
  toast.success(`Reporte global exportado correctamente`);
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error(`Error al exportar: ${error.message || 'No se pudo completar la exportación'}`);
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  // Download grading template
  const downloadGradingTemplate = () => {
    setDownloadingTemplate(true);

    // Descargar plantilla GLOBAL: ignorar filtros
    toast(`Preparando plantilla de calificaciones global...`);

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-template-all`;

    fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          throw new Error('Error al descargar plantilla');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plantilla Calificaciones FeriaGamer.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Plantilla descargada. Completa las notas y súbela de vuelta.');
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error(`Error al descargar plantilla: ${error.message || 'No se pudo completar la descarga'}`);
      })
      .finally(() => {
        setDownloadingTemplate(false);
      });
  };

  // Upload grading file
  const uploadGradingFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor, sube un archivo Excel válido (.xlsx o .xls)');
      return;
    }

    setUploadingGrades(true);
    toast('Subiendo calificaciones...');

    const formData = new FormData();
    formData.append('file', file);
    // Nota: subida GLOBAL — no añadimos filtros (nrc/subject) al formData

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/upload-senior-grades`;

    fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Error al subir calificaciones');
          });
        }
        return response.json();
      })
      .then((data) => {
        toast.success(`✅ Calificaciones guardadas exitosamente. ${data.updated || 0} registros actualizados.`);
        
        // Clear all caches to force a global refresh (subida fue global)
        setFetchedStudentsByNRC({});
        setFetchedStudentsBySubject({});
        // Re-fetch current view depending on selection
        if (selectedNRC && selectedNRC !== "") {
          fetchStudentsByNRC(selectedNRC, currentPage);
        } else if (selectedSubject) {
          fetchStudentsBySubject(selectedSubject, currentPage);
        }
        
        // Reset file input
        event.target.value = '';
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error(`Error al subir calificaciones: ${error.message || 'No se pudo completar la carga'}`);
      })
      .finally(() => {
        setUploadingGrades(false);
      });
  };

  // Start editing a team row
  const startEditing = (index: number, currentGrade?: number) => {
    setEditingRowIndex(index);
    setEditedGrade(currentGrade != null ? String(currentGrade) : "");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingRowIndex(null);
    setEditedGrade("");
  };

  // Save edited grade (now for a team)
  const saveGrade = async (team: any) => {
    const gradeValue = parseFloat(editedGrade);
    
    // Validate grade
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
      toast.error("La nota debe ser un número entre 0 y 5");
      return;
    }

    setSavingGrade(true);
    toast("Guardando calificación...");

    try {
  // Prepare videogame identifiers (backend can accept videogameId, videogameName or teamCode)
  const vg = team.videogame;
  let videogameId: any = undefined;
      if (vg != null) {
        if (typeof vg === 'object') {
          videogameId = vg.id ?? vg._id ?? vg.videojuegoId ?? undefined;
        }
      }

          // El backend identifica por videogameId. Preferimos extraerlo directamente
          // desde los campos a nivel de estudiante (forma más fiable en nuestros datos):
          // m.videogameid | m.videogameId | m.videojuegoId | m.videogame_id
          // Si no se encuentra, usamos como fallback la forma anidada (m.videogame.id)
          // y finalmente team.videogame (antiguo shape).
          let finalVideogameId: any = undefined;

          const members = team.members || [];

          // 1) Buscar campo scalar a nivel de miembro (forma preferida)
          for (const m of members) {
            const scalarId = m.videogameid ?? m.videogameId ?? m.videojuegoId ?? m.videogame_id ?? null;
            if (scalarId) {
              finalVideogameId = scalarId;
              break;
            }
          }

          // 2) Si no hay scalar id, intentar objetos anidados por compatibilidad
          if (!finalVideogameId) {
            for (const m of members) {
              const mv = m.videogame ?? m.videojuego ?? m.game;
              if (mv && typeof mv === 'object') {
                finalVideogameId = mv.id ?? mv._id ?? mv.videojuegoId ?? undefined;
                if (finalVideogameId) break;
              }
            }
          }

          // 3) Finalmente, intentar extraer desde team.videogame (legacy)
          if (!finalVideogameId && team.videogame && typeof team.videogame === 'object') {
            finalVideogameId = team.videogame.id ?? team.videogame._id ?? team.videogame.videojuegoId ?? undefined;
          }

      // DEBUG: show what was found while trying to extract videogameId
      try {
        const membersDebug = (team.members || []).map((m: any, idx: number) => {
          const mv = m.videogame ?? m.videojuego ?? m.game;
          const id = mv && typeof mv === 'object' ? (mv.id ?? mv._id ?? mv.videojuegoId ?? null) : null;
          return { index: idx, foundId: id, raw: mv };
        });
        const debugInfo = { fromTeamVg: videogameId ?? null, members: membersDebug, finalVideogameId: finalVideogameId ?? null };
        console.debug('StudentGradeTable - videogame id extraction debug:', debugInfo);
        // Try to copy debug info to clipboard to make it easy to paste into backend logs
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(JSON.stringify(debugInfo));
          toast('IDs copiados al portapapeles para revisar en tus logs');
        }
      } catch (e) {
        console.debug('No se pudo copiar/mostrar debug de videogameId', e);
      }

      if (!finalVideogameId) {
        toast.error('No se encontró videogameId para el equipo. Asegúrate que algún integrante tiene el videojuego con id.');
        setSavingGrade(false);
        return;
      }

      const payload: any = {
        videogameId: finalVideogameId,
        score: gradeValue,
        isSenior: true,
      };

      // Use the new inline endpoint that expects { teamId, score }.
      const teamEvalEndpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/team-evaluation`;

      // Build headers: Content-Type required; include Authorization Bearer if cookie `access-token` exists
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      try {
        if (typeof document !== 'undefined' && document.cookie) {
          const match = document.cookie.match('(?:^|; )access-token=([^;]+)');
          if (match && match[1]) {
            const token = decodeURIComponent(match[1]);
            headers['Authorization'] = `Bearer ${token}`;
          }
        }
      } catch (e) {
        // ignore cookie read errors
        console.debug('No se pudo leer cookie access-token', e);
      }

      const response = await fetch(teamEvalEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      });

      toast.dismiss();

      // Try to parse JSON body safely; backend may return empty body on 204 or on errors
      let parsed: any = null;
      try {
        parsed = await response.json();
      } catch (e) {
        // ignore parse errors — we'll rely on status code and fallback messages
        parsed = null;
      }

      if (!response.ok) {
        const msg = parsed?.message || `Error ${response.status} al guardar calificación`;
        throw new Error(msg);
      }

  toast.success(`✅ Calificación guardada: ${gradeValue.toFixed(1)}`);
      console.log('Grade saved:', parsed ?? { status: response.status });

      // After saving the senior grade we prefer to reload the authoritative
      // data for the current page from the backend instead of trying to
      // patch the local cache. This avoids sync issues when backend alters
      // shapes or computes derived fields.
      const cacheKey = selectedNRC ? `${selectedNRC}-${currentPage}` : `${selectedSubject}-${currentPage}`;

      if (selectedNRC) {
        // Remove cached page and re-fetch from backend
        setFetchedStudentsByNRC(prev => {
          const updated = { ...prev };
          delete updated[cacheKey];
          return updated;
        });
        // Await refetch so UI updates immediately with server data
        await fetchStudentsByNRC(selectedNRC, currentPage);
      } else {
        setFetchedStudentsBySubject(prev => {
          const updated = { ...prev };
          delete updated[cacheKey];
          return updated;
        });
        await fetchStudentsBySubject(selectedSubject, currentPage);
      }

      // Reset editing state
      cancelEditing();

    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'No se pudo guardar la calificación'}`);
    } finally {
      setSavingGrade(false);
    }
  };

  // Export Button
  const ExportButton = (
    <Button
      variant="outline"
      size="sm"
      className="cursor-pointer"
      onClick={exportToExcel}
      disabled={downloading}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-1.5" />
      )}
      <span className="hidden sm:inline">{downloading ? "Exportando..." : "Exportar"}</span>
      <span className="sm:hidden">Excel</span>
    </Button>
  );

  // Download Template Button
  const DownloadTemplateButton = (
    <Button
      variant="default"
      size="sm"
      className="cursor-pointer"
      onClick={downloadGradingTemplate}
      disabled={downloadingTemplate}
    >
      {downloadingTemplate ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-1.5" />
      )}
      {downloadingTemplate ? "Descargando..." : "Plantilla"}
    </Button>
  );

  // Upload Grades Button
  const UploadGradesButton = (
    <div className="relative">
      <Input
        id="upload-grades"
        type="file"
        accept=".xlsx,.xls"
        onChange={uploadGradingFile}
        disabled={uploadingGrades}
        className="hidden"
      />
      <Label htmlFor="upload-grades">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={uploadingGrades}
          asChild
        >
          <span>
            {uploadingGrades ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            {uploadingGrades ? "Subiendo..." : "Subir"}
          </span>
        </Button>
      </Label>
    </div>
  );

  // Unified table view (used for both mobile and desktop)
  return (
    <div className="bg-background text-foreground min-h-screen p-4">
      {/* Header */}
      <div className="mb-6 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium">Panel de Calificaciones</h1>
            <p className="opacity-70 text-sm mt-1">Gestiona y visualiza las calificaciones de tus estudiantes</p>
          </div>
          <div className="flex items-start sm:items-center">
            {/* Export button in the top-right corner of the header */}
            <div className="ml-2">{ExportButton}</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Acciones */}
      <Card className="rounded-lg overflow-hidden bg-card mb-6">
        <div className="p-5 space-y-4">
          {/* Gestión de Calificaciones Jurado Senior*/}
          {/* Mostrar siempre cuando hay una materia seleccionada: las acciones son globales y no dependen de que haya proyectos */}
          {selectedSubject && (
            <div className="pt-0 pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Calificación Jurado Senior</h3>
                    <p className="text-xs opacity-70 mt-0.5">
                      Descarga una plantilla, completa las notas y súbelas, o edita directamente en la tabla
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DownloadTemplateButton}
                  {UploadGradesButton}
                </div>
              </div>
            </div>
          )}

          {/* Fila única: Materia | Filtrar por NRC (pills) */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            {/* Materia */}
            <div className="w-full lg:w-1/3">
              <label className="block text-xs font-medium mb-1.5 opacity-70">
                Materia
              </label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="cursor-pointer h-9">
                  <SelectValue placeholder="Selecciona Materia" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.name} value={subject.name} className="cursor-pointer">
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* NRC pills + label */}
            <div className="w-full lg:w-1/3">
              {selectedSubject && availableNRCs.length > 0 && (
                <>
                  <div className="flex items-center justify-start gap-3 mb-2">
                    <label className="block text-xs font-medium opacity-70">Filtrar por NRC</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableNRCs.length > 1 && (
                      <Button
                        variant={selectedNRC === "" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedNRC("")}
                        className="cursor-pointer"
                      >
                        Todos los NRCs
                      </Button>
                    )}
                    {availableNRCs.map((nrc) => (
                      <Button
                        key={nrc.code}
                        variant={selectedNRC === nrc.code ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedNRC(nrc.code)}
                        className="cursor-pointer"
                      >
                        {nrc.code}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="w-full lg:w-1/3" />
          </div>
        </div>
      </Card>

      {/* Contenido principal */}
      {noStudents ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="font-semibold text-lg mb-1">No hay proyectos registrados</p>
          <p className="text-sm opacity-70">Verifica que tus estudiantes hayan inscrito sus videojuegos</p>
        </div>
      ) : students.length > 0 ? (
        <>
          <Card className="rounded-lg overflow-hidden bg-card">
            <Table>
              <TableHeader className="bg-card border-b border-border">
                <TableRow>
                    <TableHead>Team Code</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Integrantes</TableHead>
                    <TableHead>Videojuego</TableHead>
                    <TableHead className="text-center">Calificación Feria</TableHead>
                    <TableHead className="text-center">Calificación Docente</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t: any, i: number) => (
                  <>
                    <TableRow key={t.teamCode} className="hover:bg-muted/50">
                      <TableCell className="font-mono">{t.teamCode}</TableCell>
                      <TableCell className="font-medium">{t.teamName}</TableCell>
                      <TableCell>
                        <div className="text-sm opacity-80">
                          {t.members.map((m: any) => m.student).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>{t.videogame || 'Sin videojuego'}</TableCell>
                      <TableCell className={`text-center ${getGradeStatus(t.grade ?? 0)}`}>
                          {t.grade != null ? (
                          t.grade.toFixed(1)
                        ) : (
                          <span className="text-orange-600 font-medium">Pendiente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingRowIndex === i ? (
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              step="0.1"
                              value={editedGrade}
                              onChange={(e) => setEditedGrade(e.target.value)}
                              className="w-20 h-8 text-center"
                              placeholder="0.0"
                              autoFocus
                              disabled={savingGrade}
                            />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                onClick={() => saveGrade(t)}
                                disabled={savingGrade}
                              >
                              {savingGrade ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                              onClick={cancelEditing}
                              disabled={savingGrade}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <span>
                            {t.teacherGrade != null ? (
                              <span className="font-medium">{t.teacherGrade.toFixed(1)}</span>
                            ) : (
                              <span className="text-orange-600 font-medium">Pendiente</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingRowIndex !== i && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            onClick={() => startEditing(i, t.seniorGrade)}
                            disabled={savingGrade || editingRowIndex !== null}
                          >
                            <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>

            {/* Paginación integrada en el Card */}
            <div className="flex justify-between items-center p-4 text-sm border-t border-border">
              <div className="flex items-center gap-2">
                <span>Filas por página</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={() => {
                    // itemsPerPage es fijo en 20, no se cambia dinámicamente
                  }}
                  disabled={true}
                >
                  <SelectTrigger className="w-[70px] cursor-pointer">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50].map((n) => (
                      <SelectItem
                        className="cursor-pointer"
                        key={n}
                        value={n.toString()}
                      >
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  Página {paginationMetadata ? paginationMetadata.currentPage : 0} de{" "}
                  {paginationMetadata ? paginationMetadata.totalPages : 0}
                </span>
                <div className="flex gap-1">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleNextPage}
                    disabled={
                      !paginationMetadata ||
                      currentPage === paginationMetadata.totalPages ||
                      isLoading
                    }
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <LoadingScreen text="Cargando calificaciones de la Feria Gamer..." />
      )}
    </div>
  );
}
