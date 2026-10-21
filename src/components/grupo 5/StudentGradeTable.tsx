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
  X,
} from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedGrade, setEditedGrade] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState<"student" | "team">("student");
  const [sortBy, setSortBy] = useState<"student" | "team">("team");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
  } = useTeacherDashboard({ sortBy, sortOrder });

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

  const clearFilters = () => {
    setSelectedFair("");
    setSelectedNRC("");
    setFilterSearch("");
    setFilterType("student");
    setSortBy("team");
    setSortOrder("asc");
    setCurrentPage(1);
  };

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
    // Asegura que gradeValue tenga solo un decimal
    const gradeValue = parseFloat(Number(editedGrade).toFixed(1));

    // Validate grade
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 5) {
      toast.error("La nota debe ser un número entre 0 y 5");
      return;
    }

    setSavingGrade(true);
    toast("Guardando calificación...");

    try {
      // Ahora simplemente usamos el campo videogameId del equipo
      const finalVideogameId = team.videogameId;
      if (!finalVideogameId) {
        toast.error("No se encontró videogameId para el equipo.");
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
        "Content-Type": "application/json",
      };

      try {
        if (typeof document !== "undefined" && document.cookie) {
          const match = document.cookie.match("(?:^|; )access-token=([^;]+)");
          if (match && match[1]) {
            const token = decodeURIComponent(match[1]);
            headers["Authorization"] = `Bearer ${token}`;
          }
        }
      } catch (e) {
        // ignore cookie read errors
        console.debug("No se pudo leer cookie access-token", e);
      }

      const response = await fetch(teamEvalEndpoint, {
        method: "POST",
        credentials: "include",
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
        const msg =
          parsed?.message || `Error ${response.status} al guardar calificación`;
        throw new Error(msg);
      }

      toast.success(`Calificación guardada: ${gradeValue}`);
      // After saving the senior grade we prefer to reload the authoritative
      // data for the current page from the backend instead of trying to
      // patch the local cache. This avoids sync issues when backend alters
      // shapes or computes derived fields.
      reloadProjects();

      // Reset editing state
      cancelEditing();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "No se pudo guardar la calificación"}`,
      );
    } finally {
      setSavingGrade(false);
    }
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
                      Descarga una plantilla o edita las notas directamente
                      en la tabla
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DownloadTemplateButton}
                </div>
              </div>
            </div>
          )}

          {/* Filtro de Feria */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 border-b border-border pb-4">
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
                    onChange={(event) => {
                      setFilterSearch(event.target.value);
                      setCurrentPage(1);
                    }}
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
                      onValueChange={(value) => {
                        setFilterType(value as "student" | "team");
                        setCurrentPage(1);
                      }}
                    >
                      <DropdownMenuRadioItem value="student">Estudiante</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="team">Equipo</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="grade-sort-by" className="block text-xs font-medium mb-1.5 opacity-70">
                Ordenar por
              </label>
              <select
                id="grade-sort-by"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as "student" | "team");
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="team">Grupo</option>
                <option value="student">Estudiante</option>
              </select>
            </div>
            <div>
              <label htmlFor="grade-sort-order" className="block text-xs font-medium mb-1.5 opacity-70">
                Orden
              </label>
              <select
                id="grade-sort-order"
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value as "asc" | "desc");
                  setCurrentPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="asc">A-Z</option>
                <option value="desc">Z-A</option>
              </select>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="cursor-pointer self-start sm:self-auto"
          >
            Limpiar filtros
          </Button>
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
              <TableHead className="text-center">Acciones</TableHead>
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
                  <TableCell>
                    <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : noStudents || filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
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
                          autoFocus
                          disabled={savingGrade}
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => saveGrade(t)}
                            disabled={savingGrade}
                          >
                            {savingGrade ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={cancelEditing}
                            disabled={savingGrade}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
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
                  <TableCell>
                    <div className="flex justify-center items-center">
                      {editingRowIndex !== i && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              onClick={() =>
                                startEditing(i, t.calificacionDocente)
                              }
                              disabled={savingGrade || editingRowIndex !== null}
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Editar calificación docente
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación (solo se muestra si no está cargando y hay equipos) */}
      {!initialLoading && !isLoading && teams.length > 0 && (
        <div className="flex items-center justify-between px-2 text-sm opacity-70">
          <div>
            Mostrando {teams.length} equipo(s) de la página{" "}
            {paginationMetadata ? paginationMetadata.currentPage : 1}
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
