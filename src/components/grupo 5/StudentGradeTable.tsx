"use client";
import { useState, useEffect, useCallback } from "react";
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

  // Initialize available NRCs
  useEffect(() => {
    const fetchAvailableNRCs = async () => {
      try {
        // Pedimos includeSubjects=true para que cada NRC traiga la información de la materia (id, name)
        const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/my-nrcs?includeSubjects=true`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Error fetching available NRCs");
        }

    const data = await response.json();
      // data es un array de NRCs; con includeSubjects=true cada NRC idealmente tendrá `subject` con su id
      setAllNRCs(data || []);
      setAvailableNRCs(data || []);

            // Set initial NRC selection only if a default NRC was passed
            if (defaultNRC && defaultNRC !== "-") {
              setSelectedNRC(defaultNRC);
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
        // SIEMPRE reseteamos a vacío cuando cambia la materia para mostrar "Todos los NRCs"
        setSelectedNRC("");
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

    toast(
      `Preparando exportación ${selectedNRC ? `del NRC ${selectedNRC}` : `de la materia ${selectedSubject}`}...`
    );

    const endpoint = selectedNRC
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
  a.download = selectedNRC ? `reporte_nrc_${selectedNRC || 'desconocido'}.xlsx` : `reporte_materia_${selectedSubject || 'desconocido'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
  toast.success(`Reporte de videojuegos ${selectedNRC ? `del NRC ${selectedNRC}` : `de la materia ${selectedSubject}`} exportado correctamente`);
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

    toast(
      `Preparando plantilla de calificaciones ${selectedNRC ? `del NRC ${selectedNRC}` : `de la materia ${selectedSubject}`}...`
    );

    const endpoint = selectedNRC
      ? `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-template/${selectedNRC}`
      : `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-template-subject/${encodeURIComponent(selectedSubject)}`;

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
        a.download = selectedNRC 
          ? `plantilla_calificaciones_nrc_${selectedNRC}.xlsx` 
          : `plantilla_calificaciones_${selectedSubject}.xlsx`;
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
    
    if (selectedNRC) {
      formData.append('nrc', selectedNRC);
    } else if (selectedSubject) {
      formData.append('subject', selectedSubject);
    }

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

  // Start editing a row
  const startEditing = (index: number, currentGrade?: number) => {
    setEditingRowIndex(index);
    setEditedGrade(currentGrade ? currentGrade.toString() : "");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingRowIndex(null);
    setEditedGrade("");
  };

  // Save edited grade
  const saveGrade = async (student: any, index: number) => {
    const gradeValue = parseFloat(editedGrade);
    
    // Validate grade
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
      toast.error("La nota debe ser un número entre 0 y 5");
      return;
    }

    setSavingGrade(true);
    toast("Guardando calificación...");

    try {
      const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/update-senior-grade`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: student.studentCode,
          nrc: selectedNRC || student.NRC,
          subject: selectedSubject,
          seniorGrade: gradeValue
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al guardar calificación');
      }

      const result = await response.json();
      toast.success(`✅ Calificación guardada: ${gradeValue.toFixed(2)}`);
      console.log('Grade saved:', result);

      // Update local cache
      const cacheKey = selectedNRC ? `${selectedNRC}-${currentPage}` : `${selectedSubject}-${currentPage}`;
      
      if (selectedNRC) {
        setFetchedStudentsByNRC(prev => {
          const updatedCache = { ...prev };
          if (updatedCache[cacheKey]) {
            updatedCache[cacheKey] = updatedCache[cacheKey].map((s, i) => 
              i === index ? { ...s, seniorGrade: gradeValue } : s
            );
          }
          return updatedCache;
        });
      } else {
        setFetchedStudentsBySubject(prev => {
          const updatedCache = { ...prev };
          if (updatedCache[cacheKey]) {
            updatedCache[cacheKey] = updatedCache[cacheKey].map((s, i) => 
              i === index ? { ...s, seniorGrade: gradeValue } : s
            );
          }
          return updatedCache;
        });
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
      disabled={students.length === 0 || downloading}
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
      disabled={students.length === 0 || downloadingTemplate}
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
        <h1 className="text-xl font-medium">
          Panel de Calificaciones
        </h1>
        <p className="opacity-70 text-sm mt-1">
          Gestiona y visualiza las calificaciones de tus estudiantes
        </p>
      </div>

      {/* Barra de Filtros y Acciones */}
      <Card className="rounded-lg overflow-hidden bg-card mb-6">
        <div className="p-5 space-y-4">
          {/* Selector de Materia */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-[200px]">
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
          </div>

          {/* Filtro de NRCs con botones y Exportar */}
          {selectedSubject && availableNRCs.length > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                <label className="block text-xs font-medium opacity-70">
                  Filtrar por NRC
                </label>
                {students.length > 0 && ExportButton}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedNRC === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedNRC("")}
                  className="cursor-pointer"
                >
                  Todos los NRCs
                </Button>
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
            </div>
          )}

          {/* Gestión de Calificaciones Jurado Senior */}
          {students.length > 0 && (
            <div className="pt-4 border-t border-border">
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
                      Descarga plantilla, completa las notas y súbelas, o edita directamente en la tabla
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
                  <TableHead>ID</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>{selectedNRC ? "Materia" : "NRC"}</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Videojuego</TableHead>
                  <TableHead className="text-center">Calificación</TableHead>
                  <TableHead className="text-center">Nota J. Senior</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{s.studentCode}</TableCell>
                    <TableCell className="font-medium">{s.student}</TableCell>
                    <TableCell>{selectedNRC ? s.subject : s.NRC}</TableCell>
                    <TableCell>{s.team || "Sin equipo"}</TableCell>
                    <TableCell>{s.videogame || "Sin videojuego"}</TableCell>
                    <TableCell className={`text-center ${getGradeStatus(s.grade)}`}>
                      {s.grade ? s.grade.toFixed(2) : <span className="opacity-50">-</span>}
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
                            onClick={() => saveGrade(s, i)}
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
                          {s.seniorGrade ? (
                            <span className="font-medium">{s.seniorGrade.toFixed(2)}</span>
                          ) : (
                            <span className="opacity-50">-</span>
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
                          onClick={() => startEditing(i, s.seniorGrade)}
                          disabled={savingGrade || editingRowIndex !== null}
                        >
                          <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
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
