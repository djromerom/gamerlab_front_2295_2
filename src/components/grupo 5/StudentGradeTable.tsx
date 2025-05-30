"use client";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";
import LoadingScreen from "@/components/grupo 5/LoadingScreen";
import { toast } from "sonner";

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

  // View mode state
  const [viewMode, setViewMode] = useState<"nrc" | "subject">("nrc");

  // Selection states
  const [selectedNRC, setSelectedNRC] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [paginationMetadata, setPaginationMetadata] = useState<PaginationMetadata | null>(null);

  // Available options
  const [availableNRCs, setAvailableNRCs] = useState<any[]>([]);
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

  // Initialize available NRCs
  useEffect(() => {
    const fetchAvailableNRCs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/my-nrcs`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Error fetching available NRCs");
        }

        const data = await response.json();
        setAvailableNRCs(data);

        // Set initial NRC selection
        if (defaultNRC && defaultNRC !== "-") {
          setSelectedNRC(defaultNRC);
        } else if (data.length > 0) {
          setSelectedNRC(data[0].code);
        } else {
          toast.info("No se encontraron NRCs disponibles");
        }
      } catch (err) {
        console.error("Error fetching available NRCs:", err);
        toast.error("Error al cargar los NRCs");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAvailableNRCs();
  }, [defaultNRC]);

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

        if (data.length > 0) {
          setSelectedSubject(data[0].name);
        } else {
          toast.info("No se encontraron materias disponibles");
        }
      } catch (err) {
        console.error("Error fetching available Subjects:", err);
        toast.error("Error al cargar las materias");
      }
    };

    fetchAvailableSubjects();
  }, []);

  // Fetch students by NRC
  const fetchStudentsByNRC = useCallback(async (nrc: string, page: number = 1) => {
    if (!nrc || nrc === "-") return;

    const cacheKey = `${nrc}-${page}`;
    
    // Check cache first
    if (fetchedStudentsByNRC[cacheKey]) {
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
        toast.success(`${studentsData.length} registros cargados para el NRC ${nrc}`);
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
        toast.success(`${studentsArray.length} registros cargados para la materia ${subject}`);
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

  // Handle data fetching when selection changes
  useEffect(() => {
    // Reset states when switching modes or selections
    setError(null);
    setNoStudents(false);
    setCurrentPage(1); // Reset to first page
    setPaginationMetadata(null);

    if (viewMode === "nrc" && selectedNRC) {
      fetchStudentsByNRC(selectedNRC, 1);
    } else if (viewMode === "subject" && selectedSubject) {
      fetchStudentsBySubject(selectedSubject, 1);
    }
  }, [viewMode, selectedNRC, selectedSubject, fetchStudentsByNRC, fetchStudentsBySubject]);

  // Handle page changes
  useEffect(() => {
    if (currentPage > 1) {
      if (viewMode === "nrc" && selectedNRC) {
        fetchStudentsByNRC(selectedNRC, currentPage);
      } else if (viewMode === "subject" && selectedSubject) {
        fetchStudentsBySubject(selectedSubject, currentPage);
      }
    }
  }, [currentPage, viewMode, selectedNRC, selectedSubject, fetchStudentsByNRC, fetchStudentsBySubject]);

  // Get current students data
  const getCurrentStudents = () => {
    const cacheKey = viewMode === "nrc" 
      ? `${selectedNRC}-${currentPage}` 
      : `${selectedSubject}-${currentPage}`;
    
    if (viewMode === "nrc") {
      return fetchedStudentsByNRC[cacheKey] || [];
    } else {
      return fetchedStudentsBySubject[cacheKey] || [];
    }
  };

  const students = getCurrentStudents();

  // Handle view mode change
  const handleViewModeChange = (newMode: string) => {
    // Clear current states
    setError(null);
    setNoStudents(false);
    setIsLoading(false);
    setCurrentPage(1);
    setPaginationMetadata(null);
    setViewMode(newMode as "nrc" | "subject");
  };

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
    return <LoadingScreen text={`Cargando datos para ${viewMode === "nrc" ? `NRC ${selectedNRC}` : `materia ${selectedSubject}`}...`} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        <h3 className="text-lg font-semibold">Error al cargar datos</h3>
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-2 cursor-pointer"
          onClick={() => {
            setError(null);
            // Clear cache to force refresh
            const cacheKey = viewMode === "nrc" 
              ? `${selectedNRC}-${currentPage}` 
              : `${selectedSubject}-${currentPage}`;
              
            if (viewMode === "nrc") {
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

    toast(
      `Preparando exportación ${viewMode === "nrc" ? `del NRC ${selectedNRC}` : `de la materia ${selectedSubject}`}...`
    );

    const endpoint = viewMode === "nrc"
      ? `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/exportNRC/${selectedNRC}`
      : `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/exportSubject/${encodeURIComponent(selectedSubject)}`;

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
        a.download = viewMode === "nrc" ? `reporte_nrc_${selectedNRC || 'desconocido'}.xlsx` : `reporte_materia_${selectedSubject || 'desconocido'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Reporte de videojuegos ${viewMode === "nrc" ? `del NRC ${selectedNRC}` : `de la materia ${selectedSubject}`} exportado correctamente`);
      })
      .catch((error) => {
        console.error('Error:', error);
        toast.error(`Error al exportar: ${error.message || 'No se pudo completar la exportación'}`);
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  // No students message component
  const NoStudentsMessage = (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="mb-4 p-4 rounded-full bg-blue-50 flex items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No hay videojuegos registrados</h2>
      <p className="text-gray-600 mb-6">
        No se han encontrado videojuegos para este {viewMode === "nrc" ? "NRC" : "curso"}.
      </p>
    </div>
  );

  // NRC Selector
  const NRCSelector = (
    <div className="mb-4 w-full sm:w-64 cursor-pointer">
      <label className="block text-sm font-medium mb-1">Selecciona el NRC:</label>
      <Select
        value={selectedNRC}
        onValueChange={setSelectedNRC}
        disabled={availableNRCs.length === 0}
      >
        <SelectTrigger className="cursor-pointer">
          <SelectValue placeholder={availableNRCs.length === 0 ? "Cargando NRCs..." : "Selecciona NRC"} />
        </SelectTrigger>
        <SelectContent>
          {availableNRCs.length > 0 ? (
            availableNRCs.map((nrc) => (
              <SelectItem className="cursor-pointer" key={nrc.code} value={nrc.code}>
                {nrc.code}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-nrcs" disabled>
              No hay NRCs disponibles
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  // Subject Selector
  const SubjectSelector = (
    <div className="mb-4 w-full sm:w-64">
      <label className="block text-sm font-medium mb-1">
        Selecciona la Materia:
      </label>
      <Select
        value={selectedSubject}
        onValueChange={setSelectedSubject}
      >
        <SelectTrigger className="cursor-pointer">
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
  );

  // Export Button
  const ExportButton = (
    <Button
      variant="outline"
      className="ml-auto mb-4 cursor-pointer"
      onClick={exportToExcel}
      disabled={students.length === 0 || downloading}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      {downloading ? "Descargando..." : "Exportar a Excel"}
    </Button>
  );

  // Pagination Component
  const PaginationComponent = () => {
    if (!paginationMetadata || paginationMetadata.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Página {paginationMetadata.currentPage} de {paginationMetadata.totalPages} 
          ({paginationMetadata.totalItems} registros totales)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= paginationMetadata.totalPages}
            className="cursor-pointer"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Unified table view (used for both mobile and desktop)
  return (
    <div className="container mx-auto py-6 sm:py-10 px-2 sm:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
        {viewMode === "nrc"
          ? `Lista de Videojuegos - NRC ${selectedNRC}`
          : `Lista de Videojuegos - Materia: ${selectedSubject}`}
      </h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
        <Tabs
          value={viewMode}
          onValueChange={handleViewModeChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
            <TabsTrigger
              className="cursor-pointer hover:bg-[var(--accent)] hover:text-primary transition-colors"
              value="nrc"
            >
              Por NRC
            </TabsTrigger>
            <TabsTrigger
              className="cursor-pointer hover:bg-[var(--accent)] hover:text-primary transition-colors"
              value="subject"
            >
              Por Materia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nrc" className="pt-4">
            {NRCSelector}
          </TabsContent>

          <TabsContent value="subject" className="pt-4">
            {SubjectSelector}
          </TabsContent>
        </Tabs>

        {students.length > 0 && ExportButton}
      </div>

      {noStudents ? (
        NoStudentsMessage
      ) : students.length > 0 ? (
        <>
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table className="min-w-[800px]">
              <TableCaption>
                {viewMode === "nrc"
                  ? `Lista de videojuegos y calificaciones - NRC ${selectedNRC}`
                  : `Lista de videojuegos y calificaciones - Materia: ${selectedSubject}`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>
                    {viewMode === "nrc" ? "Materia" : "NRC"}
                  </TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Videojuego</TableHead>
                  <TableHead className="text-center">Calificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={`${student.studentCode}-${student.NRC || student.nrc || ""}`}>
                    <TableCell className="font-medium">{student.studentCode}</TableCell>
                    <TableCell>{student.student}</TableCell>
                    <TableCell>
                      {viewMode === "nrc"
                        ? (student.subject || "")
                        : (student.NRC || student.nrc || "")}
                    </TableCell>
                    <TableCell>{student.team || "Sin equipo"}</TableCell>
                    <TableCell>{student.videogame || "Sin videojuego"}</TableCell>
                    <TableCell className={`text-center ${getGradeStatus(student.grade)}`}>
                      {student.grade === null || student.grade === undefined ? "No calificado" : parseFloat(student.grade.toFixed(2))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationComponent />
        </>
      ) : null}
    </div>
  );
}