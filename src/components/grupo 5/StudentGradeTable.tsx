"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, FileSpreadsheet, Loader2, Save, X } from "lucide-react";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";
import StudentGradeFilters from "./StudentGradeFilters";
import StudentGradeTableView from "./StudentGradeTableView";
import { gradeKey, normalizeSearch, type GradeFilterType, type GradeTeam } from "./student-grade-table-types";

export default function StudentGradeTable() {
  const [downloading, setDownloading] = useState(false);
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Record<string, string>>({});
  const [savingGrade, setSavingGrade] = useState(false);
  const gradeInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [filterSearch, setFilterSearch] = useState("");
  const [filterType, setFilterType] = useState<GradeFilterType>("student");
  const dashboard = useTeacherDashboard();
  const {
    selectedNRC, setSelectedNRC, selectedFair, setSelectedFair, selectedEdition,
    availableFairs, currentPage, paginationMetadata, availableNRCs, isLoading,
    initialLoading, error, setError, noStudents, teams, handlePreviousPage,
    handleNextPage, reloadProjects,
  } = dashboard;

  const filteredTeams = teams.filter((team: GradeTeam) => {
    const studentNames = Array.isArray(team.integrantes) ? team.integrantes.join(" ") : team.integrantes || "";
    return normalizeSearch(filterType === "student" ? studentNames : team.teamName).includes(normalizeSearch(filterSearch));
  });

  const exportToExcel = async () => {
    setDownloading(true);
    toast("Preparando exportación global (todos los NRCs)...");
    try {
      const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-template-all?final=true`;
      const response = await fetch(endpoint, { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
      toast.dismiss();
      if (!response.ok) throw new Error("Error al exportar a Excel");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Reporte_Calificaciones_FeriaGamer_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte global exportado correctamente");
    } catch (exportError) {
      toast.dismiss();
      console.error("Error:", exportError);
      toast.error(`Error al exportar: ${exportError instanceof Error ? exportError.message : "No se pudo completar la exportación"}`);
    } finally {
      setDownloading(false);
    }
  };

  const enterEditMode = () => {
    const drafts: Record<string, string> = {};
    teams.forEach((team: GradeTeam) => { drafts[gradeKey(team)] = team.calificacionDocente == null ? "" : String(team.calificacionDocente); });
    setEditedGrades(drafts);
    setIsEditingGrades(true);
  };
  const cancelEditMode = () => { setIsEditingGrades(false); setEditedGrades({}); };

  const saveGrades = async () => {
    const changed = teams.filter((team: GradeTeam) => (editedGrades[gradeKey(team)] ?? "") !== (team.calificacionDocente == null ? "" : String(team.calificacionDocente)));
    if (changed.length === 0) { toast.info("No hay cambios para guardar"); cancelEditMode(); return; }
    for (const team of changed) {
      const value = editedGrades[gradeKey(team)]?.trim() ?? "";
      const score = Number(value);
      if (value === "" || !Number.isFinite(score) || score < 0 || score > 5) { toast.error("Todas las notas editadas deben ser números entre 0 y 5"); return; }
      if (!team.videogameId) { toast.error("No se encontró videogameId para uno de los juegos"); return; }
    }
    setSavingGrade(true);
    toast("Guardando cambios...");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const match = typeof document !== "undefined" ? document.cookie.match("(?:^|; )access-token=([^;]+)") : null;
      if (match?.[1]) headers.Authorization = `Bearer ${decodeURIComponent(match[1])}`;
      for (const team of changed) {
        const score = parseFloat(Number(editedGrades[gradeKey(team)]).toFixed(1));
        const response = await fetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/team-evaluation`, { method: "POST", credentials: "include", headers, body: JSON.stringify({ videogameId: team.videogameId, score, isSenior: true }) });
        let parsed: { message?: string } | null = null;
        try { parsed = await response.json(); } catch { /* The endpoint may return an empty response. */ }
        if (!response.ok) throw new Error(parsed?.message || `Error ${response.status} al guardar una nota`);
      }
      toast.dismiss();
      toast.success(`Se guardaron ${changed.length} nota(s)`);
      reloadProjects();
      cancelEditMode();
    } catch (saveError) {
      toast.dismiss();
      toast.error(`Error: ${saveError instanceof Error ? saveError.message : "No se pudieron guardar las notas"}`);
    } finally { setSavingGrade(false); }
  };

  if (error) return <div className="p-4 rounded-md border"><h3 className="text-lg font-semibold">Error al cargar datos</h3><p>{error}</p><Button variant="outline" className="mt-2 cursor-pointer" onClick={() => { setError(null); reloadProjects(); toast.info("Intentando cargar los datos nuevamente..."); }}>Reintentar</Button></div>;

  return <div className="bg-background text-foreground min-h-screen p-4">
    <div className="mb-6 px-4"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><h1 className="text-xl font-medium">Panel de Calificaciones</h1><p className="opacity-70 text-sm mt-1">Gestiona y visualiza las calificaciones de tus estudiantes</p></div><div className="flex items-start sm:items-center">{isEditingGrades ? <div className="flex gap-2"><Button variant="outline" size="sm" onClick={cancelEditMode} disabled={savingGrade}><X className="h-4 w-4 mr-1.5" /> Cancelar</Button><Button size="sm" onClick={saveGrades} disabled={savingGrade}>{savingGrade ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}{savingGrade ? "Guardando..." : "Guardar cambios"}</Button></div> : <Button variant="outline" size="sm" onClick={enterEditMode} disabled={!teams.length || isLoading || initialLoading}><Edit className="h-4 w-4 mr-1.5" /> Editar notas</Button>}<div className="ml-2"><Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="cursor-pointer" onClick={exportToExcel} aria-label="Exportar todas las calificaciones" disabled={downloading}>{downloading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1.5" />}<span className="hidden sm:inline">{downloading ? "Exportando..." : "Exportar"}</span><span className="sm:hidden">Excel</span></Button></TooltipTrigger><TooltipContent side="top">Exportar todas las calificaciones a Excel</TooltipContent></Tooltip></div></div></div></div>
    <StudentGradeFilters selectedFair={selectedFair} setSelectedFair={setSelectedFair} setSelectedNRC={setSelectedNRC} availableFairs={availableFairs} selectedEdition={selectedEdition} availableNRCs={availableNRCs} selectedNRC={selectedNRC} initialLoading={initialLoading} filterSearch={filterSearch} setFilterSearch={setFilterSearch} filterType={filterType} setFilterType={setFilterType} />
    <StudentGradeTableView teams={teams} filteredTeams={filteredTeams} initialLoading={initialLoading} isLoading={isLoading} noStudents={noStudents} isEditingGrades={isEditingGrades} editedGrades={editedGrades} setEditedGrades={setEditedGrades} savingGrade={savingGrade} gradeInputRefs={gradeInputRefs} currentPage={currentPage} totalPages={paginationMetadata?.totalPages ?? 0} handlePreviousPage={handlePreviousPage} handleNextPage={handleNextPage} />
  </div>;
}
