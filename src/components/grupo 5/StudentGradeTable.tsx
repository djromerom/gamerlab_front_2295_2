"use client";
import { useState, useEffect } from "react";
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
import { Eye, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-querry";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react"; // Agrega esta línea al inicio con los otros imports

interface Props {
  initialNRC?: string;
}

export default function StudentGradeTable({ initialNRC }: Props) {
  const defaultNRC = initialNRC || "-"; 
  // Modos de visualización: 'nrc' o 'subject'
  const [viewMode, setViewMode] = useState<"nrc" | "subject">("nrc");

  // Estados para selección de NRC y materia
  
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  // Estados para los datos de estudiantes y carga
  const [fetchedStudentsByNRC, setFetchedStudentsByNRC] = useState<Record<string, any[]>>({});
  const [fetchedStudentsBySubject, setFetchedStudentsBySubject] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStudents, setNoStudents] = useState(false);
  const [downloading, setDownloading] = useState(false); // Nuevo estado

  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [availableNRCs, setAvailableNRCs] = useState<any[]>([]);
  const [selectedNRC, setSelectedNRC] = useState<string>("");
  
  
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
        setSelectedNRC(data[0].code); // Set the first NRC as selected if available
      } catch (err) {
        console.log("Error fetching available NRCs:", err);
      } 
    };

    fetchAvailableNRCs();
  }, []);

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
        console.log("Available subjects:", data.map((subject: any) => subject.name));
        if (data.length > 0) setSelectedSubject(data[0].name);
      } catch (err) {
        console.log("Error fetching available Subjects:", err);
      }
    };
    fetchAvailableSubjects();
  }, []);


  useEffect(() => {
    setNoStudents(false);
    // Inicialmente, si no hay NRC seleccionado, no intentamos cargar datos
    if (selectedNRC === "-" || !selectedNRC) {
      setLoading(false);
      return;
    }

    if (viewMode === "nrc") {
      setLoading(true);
      setError(null);
      setNoStudents(false);
      
      // Verificar si ya tenemos estos datos en caché
      if (fetchedStudentsByNRC[selectedNRC]) {
        // Si tenemos datos en caché pero están vacíos, mostramos mensaje de "no hay estudiantes"
        
        setLoading(false);
        return;
      }
      
      const fetchStudentsByNRC = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/nrc-report/${selectedNRC}`,
            {
              method: "GET",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            }
          );
          
          // Manejar caso específico de 404 (sin estudiantes)
          if (response.status === 404) {
            setFetchedStudentsByNRC(prev => ({
              ...prev,
              [selectedNRC]: []
            }));
            setNoStudents(true);
            setLoading(false);
            return;
          }
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Actualizar el estado con los datos obtenidos
          setFetchedStudentsByNRC(prev => ({
            ...prev,
            [selectedNRC]: (data.data || [])
          }));
          
        } catch (err) {
          console.error("Error fetching students:", err);
          setError(err instanceof Error ? err.message : "Error al cargar estudiantes");
          // Asegurarse de que se establezca un valor predeterminado si hay un error
          setFetchedStudentsByNRC(prev => ({
            ...prev,
            [selectedNRC]: []
          }));
        } finally {
          // Siempre establecer loading a false al final
          setLoading(false);
        }
      };
      
      fetchStudentsByNRC();
    }
  }, [selectedNRC, viewMode]);

  useEffect(() => {
    if (viewMode !== "subject" || !selectedSubject) {
      return;
    }

    setLoading(true);
    setError(null);
    setNoStudents(false);

    // Verificar si ya tenemos estos datos en caché
    if (fetchedStudentsBySubject[selectedSubject]) {
      if (fetchedStudentsBySubject[selectedSubject].length === 0) {
        setNoStudents(true);
      }
      setLoading(false);
      return;
    }

    const fetchStudentsBySubject = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/signature-report/${encodeURIComponent(selectedSubject)}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        // Manejar caso específico de 404 (sin estudiantes)
        if (response.status === 404) {
          setFetchedStudentsBySubject(prev => ({
            ...prev,
            [selectedSubject]: []
          }));
          setNoStudents(true);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        // Si la respuesta es { data: [...] }
        const studentsArray = Array.isArray(data) ? data : data.data || [];
        
        console.log("Fetched students by subject:", studentsArray);

        setFetchedStudentsBySubject(prev => ({
          ...prev,
          [selectedSubject]: studentsArray
        }));

        if (!studentsArray || studentsArray.length === 0) {
          setNoStudents(true);
        }

      } catch (err) {
        console.error("Error fetching students by subject:", err);
        setError(err instanceof Error ? err.message : "Error al cargar estudiantes por materia");
        setFetchedStudentsBySubject(prev => ({
          ...prev,
          [selectedSubject]: []
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsBySubject();
  }, [selectedSubject, viewMode]);

  useEffect(() => {
    // Inicialización cuando el componente se monta
    if (defaultNRC && defaultNRC !== "-") {
      // Si tenemos un NRC inicial válido, iniciamos el proceso de carga
      // El efecto dependiente de selectedNRC se encargará de la carga real
      setSelectedNRC(defaultNRC);
    } else {
      // Si no hay NRC inicial, simplemente desactivamos el estado de carga
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNoStudents(false);
  }, [selectedNRC, selectedSubject, viewMode]);

  // Obtener los estudiantes según el modo de visualización (usar datos fetcheados o de respaldo)
  const students = viewMode === "nrc"
    ? (fetchedStudentsByNRC[selectedNRC] || [])
    : (fetchedStudentsBySubject[selectedSubject] || []);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="mb-4">Cargando videojuegos...</p>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        <h3 className="text-lg font-semibold">Error al cargar datos</h3>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2" 
          onClick={() => {
            setError(null);
            setFetchedStudentsByNRC({});
            if (viewMode === "nrc") {
              // Refrescar datos de NRC
              setSelectedNRC(selectedNRC);
            } else {
              // Refrescar datos de materia
              setSelectedSubject(selectedSubject);
            }
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }


  // Componente para mostrar cuando no hay estudiantes
  const NoStudentsMessage = (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <div className="mb-4 p-4 rounded-full bg-blue-50 flex items-center justify-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500" /> {/* Icono de warning */}
    </div>
    <h2 className="text-xl font-semibold mb-2">No hay videojuegos registrados</h2>
    <p className="text-gray-600 mb-6">
      No se han encontrado videojuegos para este {viewMode === "nrc" ? "NRC" : "curso"}.
    </p>
  </div>
);

  const viewStudentDetails = (id: string, nrc?: string) => {
    const useNRC = viewMode === "nrc" ? selectedNRC : nrc;
    navigate(`/home-estudiante?nrc=${useNRC}&studentId=${id}`);
  };

  const getGradeStatus = (grade: number) => {
    if (grade >= 4.5) return "text-green-600 font-medium";
    if (grade >= 4.0) return "text-blue-600 font-medium";
    if (grade >= 3.0) return "text-yellow-600 font-medium";
    return "text-red-600 font-medium";
  };

  // Función para exportar a Excel
  const exportToExcel = () => {
    setDownloading(true); // Inicia el loader

    // Si la vista es por NRC, usa el endpoint actual
    if (viewMode === "nrc") {
      fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/exportNRC/${selectedNRC}`, {
        method: 'GET',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al exportar a Excel');
          }
          return response.blob();
        })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'videojuegos.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
        })
        .catch((error) => {
          console.error('Error:', error);
        })
        .finally(() => {
          setDownloading(false); // Detiene el loader
        });
    } else {
      // Si la vista es por materia, usa el endpoint para exportar por materia
      fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/exportSubject/${encodeURIComponent(selectedSubject)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error al exportar a Excel');
          }
          return response.blob();
        })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'videojuegos_materia.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
        })
        .catch((error) => {
          console.error('Error:', error);
        })
        .finally(() => {
          setDownloading(false); // Detiene el loader
        });
    }
  };

  // Selector de NRC (para modo de visualización por NRC)
  const NRCSelector = (
  <div className="mb-4 w-full sm:w-64">
    <label className="block text-sm font-medium mb-1">Selecciona el NRC:</label>
    <Select 
      value={selectedNRC} 
      onValueChange={setSelectedNRC}
      disabled={availableNRCs.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={availableNRCs.length === 0 ? "Cargando NRCs..." : "Selecciona NRC"} />
      </SelectTrigger>
      <SelectContent>
        {availableNRCs.length > 0 ? (
          availableNRCs.map((nrc) => (
            <SelectItem key={nrc.code} value={nrc.code}>
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

  // Selector de Materia (para modo de visualización por materia)
  const SubjectSelector = (
    <div className="mb-4 w-full sm:w-64">
      <label className="block text-sm font-medium mb-1">
        Selecciona la Materia:
      </label>
      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona Materia" />
        </SelectTrigger>
        <SelectContent>
          {availableSubjects.map((subject) => (
            <SelectItem key={subject.name} value={subject.name}>
              {subject.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Botón de exportación a Excel
  const ExportButton = (
    <Button 
      variant="outline" 
      className="ml-auto mb-4" 
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

  // Interfaz móvil
  if (isMobile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-xl font-bold mb-4">
          {viewMode === "nrc"
            ? `Lista de Videojuegos - NRC ${selectedNRC}`
            : `Lista de Videojuegos - Materia: ${selectedSubject}`}
        </h1>

        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "nrc" | "subject")}
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nrc">Por NRC</TabsTrigger>
            <TabsTrigger value="subject">Por Materia</TabsTrigger>
          </TabsList>

          <TabsContent value="nrc" className="pt-2">
            {NRCSelector}
          </TabsContent>

          <TabsContent value="subject" className="pt-2">
            {SubjectSelector}
          </TabsContent>
        </Tabs>

        {noStudents ? (
          NoStudentsMessage
        ) : students.length > 0 ? (
          <>
            {ExportButton}
            <div className="space-y-3">
              {students.map((student: any) => (
                <Card key={student.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">
                          ID: {student.id}
                        </p>
                        <p className="font-semibold">{student.name}</p>
                        {student.additionalInfo && (
                          <p className="text-xs text-muted-foreground">
                            {student.additionalInfo}
                          </p>
                        )}
                      </div>
                      <div
                        className={`text-center px-3 py-1 rounded-full text-sm ${getGradeStatus(
                          student.grade
                        )} bg-muted`}
                      >
                        {student.grade}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => viewStudentDetails(student.id, student.nrc)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // Interfaz de escritorio
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">
        {viewMode === "nrc"
          ? `Lista de Videojuegos - NRC ${selectedNRC}`
          : `Lista de Videojuegos - Materia: ${selectedSubject}`}
      </h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "nrc" | "subject")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
            <TabsTrigger value="nrc">Por NRC</TabsTrigger>
            <TabsTrigger value="subject">Por Materia</TabsTrigger>
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
        <div className="overflow-x-auto">
          <Table>
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
                <TableHead className="text-center">Calificación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => (
                <TableRow key={`${student.studentCode}-${student.nrc || ""}`}>
                  <TableCell className="font-medium">{student.studentCode}</TableCell>
                  <TableCell>{student.student}</TableCell>
                  <TableCell>
                    {viewMode === "nrc"
                      ? (student.subject  || "") // Muestra la materia en vista NRC
                      : (student.nrc || student.NRC || "")}
                  </TableCell>
                  <TableCell className={`text-center ${getGradeStatus(student.grade)}`}>
                    {student.grade === null || student.grade === undefined ? "No calificado" : student.grade}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
