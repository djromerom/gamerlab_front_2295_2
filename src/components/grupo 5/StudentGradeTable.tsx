"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Filter,
  FileSpreadsheet,
  Loader2,
  Search,
  Save,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PaginationMetadata {
  totalItems: number;
  itemsOnCurrentPage: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export default function StudentGradeTable() {
  // 1. Estados exclusivos de la Interfaz de Usuario (UI)
  const [downloading, setDownloading] = useState(false);
  const [uploadingGrades, setUploadingGrades] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Record<string, string>>({});
  const [savingGrade, setSavingGrade] = useState(false);
  const gradeInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState<"student" | "team">("student");

  // 2. Nuestro asistente personal (el Hook) trayendo la data:
  const {
    selectedNRC,
    setSelectedNRC,
    selectedFair,
    setSelectedFair,
    selectedEdition,
    availableFairs,
    currentPage,
    setCurrentPage,
    paginationMetadata,
    availableNRCs,
    isLoading,
    initialLoading,
    error,
    setError,
    noStudents,
    teams,
    handlePreviousPage,
    handleNextPage,
    reloadProjects,
  } = useTeacherDashboard();

  const normalizeSearch = (value: unknown) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
      .trim();

  const filteredTeams = teams.filter((team: any) => {
    const studentNames = Array.isArray(team.integrantes)
      ? team.integrantes.join(" ")
      : team.integrantes || "";
    const searchableName = filterType === "student" ? studentNames : team.teamName;
    return normalizeSearch(searchableName).includes(normalizeSearch(filterSearch));
  });

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
            reloadProjects();
            toast.info("Intentando cargar los datos nuevamente...");
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const getGradeStatus = (_grade: number) => {
    return "";
  };

  // Export to Excel function
  const exportToExcel = () => {
    setDownloading(true);

    // Exportar de forma GLOBAL: ignorar filtros de Materia/NRC
    toast(`Preparando exportación global (todos los NRCs)...`);

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-template-all?final=true`;

    fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          throw new Error("Error al exportar a Excel");
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Reporte_Calificaciones_FeriaGamer_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`Reporte global exportado correctamente`);
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error(
          `Error al exportar: ${error.message || "No se pudo completar la exportación"}`,
        );
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
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          throw new Error("Error al descargar plantilla");
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Plantilla_Evaluación_Docente_FeriaGamer.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(
          "Plantilla descargada. Completa las notas y súbela de vuelta.",
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error(
          `Error al descargar plantilla: ${error.message || "No se pudo completar la descarga"}`,
        );
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Por favor, sube un archivo Excel válido (.xlsx o .xls)");
      return;
    }

    setUploadingGrades(true);
    toast("Subiendo calificaciones...");

    const formData = new FormData();
    formData.append("file", file);
    // Nota: subida GLOBAL — no añadimos filtros (nrc/subject) al formData

    const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/upload-senior-grades`;

    fetch(endpoint, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((response) => {
        toast.dismiss();
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message || "Error al subir calificaciones");
          });
        }
        return response.json();
      })
      .then((data) => {
        toast.success(
          `Calificaciones guardadas exitosamente. ${data.updated || 0} registros actualizados.`,
        );

        reloadProjects();

        // Reset file input
        event.target.value = "";
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error(
          `Error al subir calificaciones: ${error.message || "No se pudo completar la carga"}`,
        );
      })
      .finally(() => {
        setUploadingGrades(false);
      });
  };

  const gradeKey = (team: any) => String(team.videogameId ?? team.teamCode);
  const enterEditMode = () => {
    const drafts: Record<string, string> = {};
    teams.forEach((team: any) => {
      drafts[gradeKey(team)] = team.calificacionDocente == null ? "" : String(team.calificacionDocente);
    });
    setEditedGrades(drafts);
    setIsEditingGrades(true);
  };
  const cancelEditMode = () => {
    setIsEditingGrades(false);
    setEditedGrades({});
  };

  const saveGrades = async () => {
    const changed = teams.filter((team: any) => {
      const value = editedGrades[gradeKey(team)] ?? "";
      return value !== (team.calificacionDocente == null ? "" : String(team.calificacionDocente));
    });
    if (changed.length === 0) {
      toast.info("No hay cambios para guardar");
      cancelEditMode();
      return;
    }
    for (const team of changed) {
      const value = editedGrades[gradeKey(team)]?.trim() ?? "";
      const score = Number(value);
      if (value === "" || !Number.isFinite(score) || score < 0 || score > 5) {
        toast.error("Todas las notas editadas deben ser números entre 0 y 5");
        return;
      }
      if (!team.videogameId) {
        toast.error("No se encontró videogameId para uno de los juegos");
        return;
      }
    }
    setSavingGrade(true);
    toast("Guardando cambios...");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const match = typeof document !== "undefined" ? document.cookie.match("(?:^|; )access-token=([^;]+)") : null;
      if (match?.[1]) headers.Authorization = `Bearer ${decodeURIComponent(match[1])}`;
      for (const team of changed) {
        const score = parseFloat(Number(editedGrades[gradeKey(team)]).toFixed(1));
        const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/team-evaluation`, {
          method: "POST", credentials: "include", headers,
          body: JSON.stringify({ videogameId: team.videogameId, score, isSenior: true }),
        });
        let parsed: any = null;
        try { parsed = await response.json(); } catch { /* empty response */ }
        if (!response.ok) throw new Error(parsed?.message || `Error ${response.status} al guardar una nota`);
      }
      toast.dismiss();
      toast.success(`Se guardaron ${changed.length} nota(s)`);
      reloadProjects();
      cancelEditMode();
    } catch (error) {
      toast.dismiss();
      toast.error(`Error: ${error instanceof Error ? error.message : "No se pudieron guardar las notas"}`);
    } finally { setSavingGrade(false); }
  };

  // Export Button
  const ExportButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={exportToExcel}
          aria-label="Exportar todas las calificaciones"
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          )}
          <span className="hidden sm:inline">
            {downloading ? "Exportando..." : "Exportar"}
          </span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Exportar todas las calificaciones a Excel
      </TooltipContent>
    </Tooltip>
  );

  // Download Template Button
  const DownloadTemplateButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="cursor-pointer"
          onClick={downloadGradingTemplate}
          aria-label="Descargar plantilla de calificaciones"
          disabled={downloadingTemplate}
        >
          {downloadingTemplate ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          {downloadingTemplate ? "Descargando..." : "Plantilla"}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Descargar plantilla de calificaciones
      </TooltipContent>
    </Tooltip>
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
      <Tooltip>
        <TooltipTrigger asChild>
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
        </TooltipTrigger>
        <TooltipContent side="top">Subir calificaciones (Excel)</TooltipContent>
      </Tooltip>
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
            <p className="opacity-70 text-sm mt-1">
              Gestiona y visualiza las calificaciones de tus estudiantes
            </p>
          </div>
          <div className="flex items-start sm:items-center">
            {isEditingGrades ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEditMode} disabled={savingGrade}>
                  <X className="h-4 w-4 mr-1.5" /> Cancelar
                </Button>
                <Button size="sm" onClick={saveGrades} disabled={savingGrade}>
                  {savingGrade ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                  {savingGrade ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={enterEditMode} disabled={!teams.length || isLoading || initialLoading}>
                <Edit className="h-4 w-4 mr-1.5" /> Editar notas
              </Button>
            )}
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
          {availableFairs.length > 0 && (
            <div className="pt-0 pb-4 border-b border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      Calificación Jurado Senior
                    </h3>
                    <p className="text-xs opacity-70 mt-0.5">
                      Descarga una plantilla, completa las notas y súbelas, o
                      edita directamente en la tabla
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

          <div className="flex flex-col lg:flex-row lg:items-start gap-4 border-b border-border pb-4">
          {/* Filtro de Feria */}
          <div className="w-full lg:flex-1">
              <label className="block text-xs font-medium mb-2 opacity-70">
                Filtrar por Feria
              </label>
              <div className="flex flex-wrap justify-start gap-2">
                <Button
                  variant={selectedFair === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedFair("");
                    setSelectedNRC("");
                  }}
                  className="cursor-pointer"
                >
                  Todas las Ferias
                </Button>
                {availableFairs.map((fair) => (
                  <Button
                    key={fair.id}
                    variant={selectedFair === String(fair.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedFair(String(fair.id));
                      setSelectedNRC("");
                    }}
                    className="cursor-pointer"
                  >
                    {fair.year} - S{fair.semester === 10 ? 1 : fair.semester === 30 ? 2 : fair.semester}
                  </Button>
                ))}
                {availableFairs.length === 0 && (
                  <span className="text-xs text-muted-foreground self-center">
                    No hay ferias disponibles
                  </span>
                )}
              </div>
          </div>

          <div className="w-full lg:w-1/3 lg:max-w-sm lg:ml-auto">
            <label htmlFor="grade-search" className="block text-xs font-medium mb-1.5 opacity-70">
              Filtrar por estudiante o equipo
            </label>
            <div className="flex max-w-sm lg:ml-auto">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                <Input
                  id="grade-search"
                  value={filterSearch}
                  onChange={(event) => setFilterSearch(event.target.value)}
                  placeholder={filterType === "student" ? "Nombre del estudiante" : "Nombre del equipo"}
                  className="h-8 md:h-8 pl-9 rounded-r-none"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Tipo de filtro: ${filterType === "student" ? "estudiante" : "equipo"}`}
                    title={`Filtrar por ${filterType === "student" ? "estudiante" : "equipo"}`}
                    className="!h-8 !w-8 rounded-l-none -ml-px"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup
                    value={filterType}
                    onValueChange={(value) => setFilterType(value as "student" | "team")}
                  >
                    <DropdownMenuRadioItem value="student">Estudiante</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="team">Equipo</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          </div>

          {/* Filtro opcional: al dejarlo en Todos se conservan todos los proyectos del alcance. */}
          <div className="w-full">
            <label className="block text-xs font-medium mb-2 opacity-70">
              Filtrar por NRC{selectedEdition ? ` · ${selectedEdition.year} - S${selectedEdition.semester === 10 ? 1 : selectedEdition.semester === 30 ? 2 : selectedEdition.semester}` : ""}
            </label>
            <div className="flex flex-wrap justify-start gap-2">
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
                  key={selectedFair ? nrc.id : String(nrc.code)}
                  variant={
                    selectedNRC === String(selectedFair ? nrc.id : nrc.code)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    const filterValue = String(
                      selectedFair ? nrc.id : nrc.code,
                    );
                    setSelectedNRC(
                      selectedNRC === filterValue ? "" : filterValue,
                    );
                  }}
                  className="cursor-pointer"
                >
                  {nrc.code}
                </Button>
              ))}
              {!initialLoading && availableNRCs.length === 0 && (
                <span className="text-xs text-muted-foreground self-center">
                  No hay NRCs para este filtro.
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* [MODIFICACIÓN]: La tabla siempre se renderiza para no dejar la pantalla vacía. */}
      <div className="rounded-md border bg-[var(--card)] shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--color-primary)] [&_th]:!text-white dark:bg-blue-900/30 dark:text-[var(--card-foreground)] border-b border-border">
            <TableRow>
              <TableHead>Team Code</TableHead>
              <TableHead>NRC</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Integrantes</TableHead>
              <TableHead>Videojuego</TableHead>
              <TableHead className="text-center">Calificación Feria</TableHead>
              <TableHead className="text-center">
                Calificación Docente
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* [APRENDIZAJE]: Renderizado Condicional Triple. 1: Si carga = Skeleton. 2: Si está vacío = Mensaje. 3: Si hay datos = Filas. */}
            {initialLoading || isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : noStudents || teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4 mx-auto">
                      <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="font-semibold text-lg mb-1">
                      No hay proyectos registrados para estos filtros
                    </p>
                    <p className="text-sm opacity-70">
                      Verifica los proyectos asociados a las ferias y NRC seleccionados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm opacity-70"
                  >
                    No se encontraron equipos con esos criterios de búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams.map((t: any, i: number) => (
                <TableRow
                  key={t.teamCode}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{t.teamCode}</TableCell>
                  <TableCell>{t.nrc}</TableCell>
                  <TableCell>{t.teamName}</TableCell>
                  <TableCell>
                    <div className="text-sm opacity-80">
                      {Array.isArray(t.integrantes)
                        ? t.integrantes.join(", ")
                        : t.integrantes || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{t.videogame}</TableCell>
                  <TableCell
                    className={`text-center ${getGradeStatus(t.calificacionFeria ?? 0)}`}
                  >
                    {t.calificacionFeria != null ? (
                      t.calificacionFeria.toFixed(1)
                    ) : (
                      <span className="text-orange-600 font-medium">
                        Pendiente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditingGrades ? (
                      <div className="flex items-center justify-center gap-2">
                        <Input
                          ref={(element) => {
                            const key = gradeKey(t);
                            if (element) gradeInputRefs.current.set(key, element);
                            else gradeInputRefs.current.delete(key);
                          }}
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={editedGrades[gradeKey(t)] ?? ""}
                          onChange={(e) => setEditedGrades((prev) => ({ ...prev, [gradeKey(t)]: e.target.value }))}
                          className="w-20 h-8 text-center"
                          autoFocus={i === 0}
                          disabled={savingGrade}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              const nextTeam = filteredTeams[i + 1];
                              if (nextTeam) gradeInputRefs.current.get(gradeKey(nextTeam))?.focus();
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <span
                        className={
                          t.calificacionDocente != null
                            ? ""
                            : "text-orange-600 font-medium"
                        }
                      >
                        {t.calificacionDocente != null ? (
                          <span>{t.calificacionDocente.toFixed(1)}</span>
                        ) : (
                          <span>Pendiente</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación (solo se muestra si no está cargando y hay equipos) */}
      {!initialLoading && !isLoading && teams.length > 0 && (
        <div className="flex items-center justify-between px-2 text-sm opacity-70">
          <div>
            Mostrando {filteredTeams.length} de {teams.length} equipo(s) en la
            página {paginationMetadata ? paginationMetadata.currentPage : 1}
          </div>
          <div className="flex items-center gap-4">
            <span>
              Página {paginationMetadata ? paginationMetadata.currentPage : 0}{" "}
              de {paginationMetadata ? paginationMetadata.totalPages : 0}
            </span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={handleNextPage}
                disabled={
                  !paginationMetadata ||
                  currentPage === paginationMetadata.totalPages
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
