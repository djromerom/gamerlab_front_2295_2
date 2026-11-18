"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, FileSpreadsheet, Loader2, Save, X } from "lucide-react";
import { useTeacherDashboard } from "@/features/results/hooks/useTeacherDashboard";
import { useFetch } from "@/hooks/useFetch";
import StudentGradeFilters from "./StudentGradeFilters";
import StudentGradeTableView from "./StudentGradeTableView";
import { gradeKey, type GradeTeam } from "@/features/results/types/studentGradeTable";
import { DEFAULT_FINAL_GRADE_WEIGHTING_TEXT } from "@/features/results/lib/finalGradeWeights";
import { clearGradeDraft, isGradeModified, readGradeDraft, writeGradeDraft } from "@/lib/gradeDrafts";

export default function StudentGradeTable() {
  const customFetch = useFetch();
  const [downloading, setDownloading] = useState(false);
  // BG-27: notas sin guardar de una visita anterior (recarga, pestaña cerrada o sesión vencida)
  const [restoredDraft] = useState(readGradeDraft);
  const [isEditingGrades, setIsEditingGrades] = useState(restoredDraft !== null);
  const [editedGrades, setEditedGrades] = useState<Record<string, string>>(() => restoredDraft?.grades ?? {});
  const [editedTeams, setEditedTeams] = useState<Record<string, GradeTeam>>(() => restoredDraft?.teams ?? {});
  // false si el navegador no pudo guardar las notas: entonces sí se avisa al recargar
  const draftPersisted = useRef(false);
  const [gradeResults, setGradeResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [savingGrade, setSavingGrade] = useState(false);
  const gradeInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [filterSearch, setFilterSearch] = useState("");
  const [showHistorical, setShowHistorical] = useState(false);
  const [sortBy, setSortBy] = useState<"student" | "team">("team");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const dashboard = useTeacherDashboard({
    search: filterSearch, includeHistorical: showHistorical, sortBy, sortOrder,
    initialFair: restoredDraft?.fair, initialNRC: restoredDraft?.nrc,
  });
  const {
    selectedNRC, setSelectedNRC, selectedFair, setSelectedFair, selectedEdition,
    availableFairs, currentPage, setCurrentPage, paginationMetadata, availableNRCs, isLoading,
    initialLoading, error, noStudents, teams, handlePreviousPage,
    handleNextPage, reloadProjects, retryLoad,
  } = dashboard;

  const filteredTeams = useMemo(() => [...teams].sort((a, b) => {
    const key = (team: GradeTeam) => sortBy === "team"
      ? team.teamName
      : (Array.isArray(team.integrantes) ? team.integrantes[0] : team.integrantes) || "";
    const comparison = key(a).toLocaleLowerCase("es").localeCompare(key(b).toLocaleLowerCase("es"), "es");
    return sortOrder === "asc" ? comparison : -comparison;
  }), [teams, sortBy, sortOrder]);

  const editableTeams = useMemo(() => {
    const byKey = new Map<string, GradeTeam>(Object.entries(editedTeams));
    teams.filter((team: GradeTeam) => team.canEdit).forEach((team) => {
      const key = gradeKey(team);
      if (!byKey.has(key)) byKey.set(key, team);
    });
    return [...byKey.values()];
  }, [teams, editedTeams]);

  const hasUnsavedChanges = useMemo(() => editableTeams.some((team: GradeTeam) =>
    team.canEdit === true && isGradeModified(editedGrades[gradeKey(team)], team.calificacionDocente),
  ), [editableTeams, editedGrades]);

  useEffect(() => {
    if (!restoredDraft) return;
    const count = Object.keys(restoredDraft.grades).length;
    // ARK-241: el Toaster de LayoutApplication es un hermano posterior y se suscribe en su propio efecto,
    // que corre después de este; si se avisa aquí mismo, nadie lo escucha y se pierde. Se avisa en la siguiente vuelta.
    const timer = setTimeout(() => {
      toast.info(
        count === 1 ? "Recuperamos 1 nota que no habías guardado" : `Recuperamos ${count} notas que no habías guardado`,
        { id: "grade-draft-restored" },
      );
    }, 0);
    return () => clearTimeout(timer);
  }, [restoredDraft]);

  useEffect(() => {
    if (!isEditingGrades) return;
    const currentEditable = teams.filter((team: GradeTeam) => team.canEdit);
    // Filas que ya no se pueden editar (p. ej. se cerró la feria): se descarta lo que se traía de antes.
    const lockedKeys = teams.filter((team: GradeTeam) => !team.canEdit).map(gradeKey);
    if (currentEditable.length === 0 && lockedKeys.length === 0) return;
    setEditedTeams((previous) => {
      const next = { ...previous };
      currentEditable.forEach((team) => { next[gradeKey(team)] = team; });
      lockedKeys.forEach((key) => { delete next[key]; });
      return next;
    });
    setEditedGrades((previous) => {
      const next = { ...previous };
      currentEditable.forEach((team) => {
        const key = gradeKey(team);
        if (!(key in next)) next[key] = team.calificacionDocente == null ? "" : team.calificacionDocente.toFixed(2);
      });
      lockedKeys.forEach((key) => { delete next[key]; });
      return next;
    });
  }, [isEditingGrades, teams]);

  // BG-27: lo modificado y sin guardar queda en el navegador; se borra al guardarlo o descartarlo.
  useEffect(() => {
    if (!isEditingGrades) {
      clearGradeDraft();
      draftPersisted.current = false;
      return;
    }
    const grades: Record<string, string> = {};
    const snapshot: Record<string, GradeTeam> = {};
    editableTeams.forEach((team: GradeTeam) => {
      const key = gradeKey(team);
      const raw = editedGrades[key];
      if (team.canEdit && raw !== undefined && isGradeModified(raw, team.calificacionDocente)) {
        grades[key] = raw;
        snapshot[key] = team;
      }
    });
    if (Object.keys(grades).length === 0) {
      clearGradeDraft();
      draftPersisted.current = true;
      return;
    }
    draftPersisted.current = writeGradeDraft({ fair: selectedFair, nrc: selectedNRC, grades, teams: snapshot });
  }, [isEditingGrades, editableTeams, editedGrades, selectedFair, selectedNRC]);

  useEffect(() => {
    if (!isEditingGrades || !hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      // Las notas quedaron en el navegador y se recuperan al volver: no hace falta frenar la recarga.
      if (draftPersisted.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isEditingGrades, hasUnsavedChanges]);

  useEffect(() => {
    if (!isEditingGrades || !hasUnsavedChanges) return;
    const confirmInternalNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      if (!window.confirm("Tienes cambios sin guardar. ¿Quieres salir y descartarlos?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      setIsEditingGrades(false);
      setEditedGrades({});
      setEditedTeams({});
      setGradeResults({});
    };
    window.addEventListener("click", confirmInternalNavigation, true);
    return () => window.removeEventListener("click", confirmInternalNavigation, true);
  }, [isEditingGrades, hasUnsavedChanges]);

  const clearFilters = () => {
    setSelectedFair("");
    setSelectedNRC("");
    setFilterSearch("");
    setSortBy("team");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const exportToExcel = async () => {
    if (teams.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    setDownloading(true);
    toast("Preparando exportación de los resultados filtrados...");
    try {
      const query = new URLSearchParams({ final: "true", sortBy, sortOrder });
      if (selectedFair) query.set("editionId", selectedFair);
      if (selectedNRC) query.set("nrcId", selectedNRC);
      if (filterSearch.trim()) query.set("search", filterSearch.trim());
      const endpoint = `${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/download-grading-report-grouped?${query}`;
      const response = await customFetch(endpoint, { method: "GET", credentials: "include" });
      toast.dismiss();
      if (!response.ok) {
        let message = `Error ${response.status} al exportar a Excel`;
        try {
          const body = await response.json();
          message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message || message;
        } catch { /* La respuesta puede no incluir JSON. */ }
        throw new Error(message);
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const utf8Filename = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
      const plainFilename = /filename="([^"]+)"/i.exec(disposition)?.[1];
      const filename = utf8Filename
        ? decodeURIComponent(utf8Filename)
        : plainFilename || `calificaciones_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte de resultados filtrados exportado correctamente");
    } catch (exportError) {
      toast.dismiss();
      console.error("Error:", exportError);
      toast.error(exportError instanceof Error ? exportError.message : "No se pudo completar la exportación");
    } finally {
      setDownloading(false);
    }
  };

  const changeTab = (historical: boolean) => {
    if (historical === showHistorical) return;
    if (isEditingGrades) {
      if (hasUnsavedChanges && !window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?")) return;
      cancelEditMode(true);
    }
    setShowHistorical(historical);
  };

  const enterEditMode = () => {
    const drafts: Record<string, string> = {};
    teams.filter((team: GradeTeam) => team.canEdit).forEach((team: GradeTeam) => { drafts[gradeKey(team)] = team.calificacionDocente == null ? "" : team.calificacionDocente.toFixed(2); });
    setEditedGrades(drafts);
    setEditedTeams(Object.fromEntries(teams.filter((team: GradeTeam) => team.canEdit).map((team) => [gradeKey(team), team])));
    setIsEditingGrades(true);
  };
  const cancelEditMode = (force = false) => {
    if (!force && hasUnsavedChanges && !window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?")) return;
    setIsEditingGrades(false);
    setEditedGrades({});
    setEditedTeams({});
    setGradeResults({});
  };

  const saveGrades = async () => {
    const changed = editableTeams.filter((team: GradeTeam) =>
      team.canEdit === true && isGradeModified(editedGrades[gradeKey(team)], team.calificacionDocente),
    );
    if (changed.length === 0) { toast.info("No hay cambios para guardar"); return; }
    const valid: GradeTeam[] = [];
    const nextResults: Record<string, { ok: boolean; message: string }> = {};
    for (const team of changed) {
      const key = gradeKey(team);
      const value = editedGrades[gradeKey(team)]?.trim() ?? "";
      const score = Number(value);
      if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(value) || !Number.isFinite(score) || score < 0 || score > 5) {
        nextResults[key] = { ok: false, message: "Ingresa una nota entre 0 y 5, con máximo 2 decimales." };
      } else if (!team.videogameId) {
        nextResults[key] = { ok: false, message: "No se encontró el identificador del videojuego." };
      } else {
        valid.push(team);
      }
    }
    setGradeResults(nextResults);
    if (valid.length === 0) { toast.error("Corrige las filas señaladas para poder guardarlas."); return; }
    setSavingGrade(true);
    toast("Guardando notas...");
    try {
      const response = await customFetch(`${import.meta.env.VITE_ENDPOINT_BACKEND}/professors/team-evaluation/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations: valid.map((team) => ({ videogameId: Number(team.videogameId), score: Number(editedGrades[gradeKey(team)]) })) }),
      });
      let payload: any = null;
      try { payload = await response.json(); } catch { /* Report a useful error for non-JSON responses. */ }
      if (!response.ok) throw new Error(payload?.message || `Error ${response.status} al guardar las notas`);
      const results = Array.isArray(payload?.results) ? payload.results : [];
      for (const team of valid) {
        const key = gradeKey(team);
        const rowResult = results.find((item: any) => Number(item.videogameId) === Number(team.videogameId));
        if (rowResult?.success === true) nextResults[key] = { ok: true, message: "Guardada" };
        else nextResults[key] = { ok: false, message: rowResult?.message || rowResult?.error || "No se pudo guardar. Puedes corregir e intentar de nuevo." };
      }
      setGradeResults(nextResults);
      setEditedTeams((previous) => {
        const updated = { ...previous };
        valid.forEach((team) => {
          const key = gradeKey(team);
          if (nextResults[key]?.ok) updated[key] = { ...team, calificacionDocente: Number(editedGrades[key]) };
        });
        return updated;
      });
      toast.dismiss();
      const savedCount = Object.values(nextResults).filter((result) => result.ok).length;
      const failedCount = Object.values(nextResults).filter((result) => !result.ok).length;
      if (savedCount > 0) toast.success(`Se guardaron ${savedCount} nota(s)`);
      if (failedCount > 0) toast.error(`${failedCount} fila(s) requieren corrección o reintento.`);
      reloadProjects();
    } catch (saveError) {
      toast.dismiss();
      const message = saveError instanceof Error ? saveError.message : "No se pudieron guardar las notas";
      setGradeResults((previous) => {
        const updated = { ...previous };
        valid.forEach((team) => { updated[gradeKey(team)] = { ok: false, message: `No se confirmó el guardado: ${message}. Conserva la nota y vuelve a intentar.` }; });
        return updated;
      });
      toast.error(`No se pudo confirmar el guardado. Tus notas siguen en pantalla para reintentarlo. ${message}`);
    } finally { setSavingGrade(false); }
  };

  const updateDraftGrades = (update: (previous: Record<string, string>) => Record<string, string>) => {
    const next = update(editedGrades);
    setEditedGrades(next);
    setGradeResults((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => next[key] === editedGrades[key])));
  };

  return <div className="md:bg-background text-foreground min-h-screen p-4">
    <div className="mb-6 px-4"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><h1 className="text-xl font-medium">Panel de Calificaciones</h1><p className="opacity-70 text-sm mt-1">Gestiona y visualiza las calificaciones de tus estudiantes</p><p className="opacity-70 text-sm mt-1">{DEFAULT_FINAL_GRADE_WEIGHTING_TEXT}</p></div><div className="flex items-start sm:items-center">{isEditingGrades ? <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => cancelEditMode()} disabled={savingGrade}><X className="h-4 w-4 mr-1.5" /> Cancelar</Button><Button size="sm" onClick={saveGrades} disabled={savingGrade}>{savingGrade ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}{savingGrade ? "Guardando..." : "Guardar todo"}</Button></div> : <Button variant="outline" size="sm" onClick={enterEditMode} disabled={showHistorical || !selectedNRC || !teams.some((team: GradeTeam) => team.canEdit) || isLoading || initialLoading} title={showHistorical ? "Los históricos son de solo lectura" : !selectedNRC ? "Selecciona una feria y un NRC para editar sus notas" : undefined}><Edit className="h-4 w-4 mr-1.5" />{selectedNRC ? "Editar notas" : "Selecciona un NRC"}</Button>}<div className="ml-2"><Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" className="cursor-pointer" onClick={exportToExcel} aria-label="Exportar resultados filtrados" title={showHistorical ? "La exportación solo incluye la feria activa" : undefined} disabled={downloading || showHistorical}>{downloading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1.5" />}<span className="hidden sm:inline">{downloading ? "Exportando..." : "Exportar"}</span><span className="sm:hidden">Excel</span></Button></TooltipTrigger><TooltipContent side="top">Exportar los resultados filtrados a Excel</TooltipContent></Tooltip></div></div></div></div>
    {error && <div role="alert" className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"><div><strong>Error al actualizar el listado.</strong> La tabla conserva el último resultado válido y puede corresponder a los filtros anteriores. {error}</div><Button variant="outline" size="sm" className="cursor-pointer self-start sm:self-auto" onClick={retryLoad}>Reintentar</Button></div>}
    <div role="tablist" aria-label="Vista del panel" className="mb-4 flex gap-2"><Button role="tab" aria-selected={!showHistorical} variant={showHistorical ? "outline" : "default"} size="sm" className="cursor-pointer" onClick={() => changeTab(false)} disabled={savingGrade}>Feria activa</Button><Button role="tab" aria-selected={showHistorical} variant={showHistorical ? "default" : "outline"} size="sm" className="cursor-pointer" onClick={() => changeTab(true)} disabled={savingGrade}>Históricos</Button></div>
    <StudentGradeFilters selectedFair={selectedFair} setSelectedFair={setSelectedFair} setSelectedNRC={setSelectedNRC} availableFairs={availableFairs} selectedEdition={selectedEdition} availableNRCs={availableNRCs} selectedNRC={selectedNRC} initialLoading={initialLoading} filterSearch={filterSearch} setFilterSearch={setFilterSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} onClear={clearFilters} disabled={isEditingGrades || savingGrade} />
    <StudentGradeTableView teams={teams} filteredTeams={filteredTeams} initialLoading={initialLoading} isLoading={isLoading} noStudents={noStudents} isEditingGrades={isEditingGrades} editedGrades={editedGrades} setEditedGrades={updateDraftGrades} gradeResults={gradeResults} savingGrade={savingGrade} gradeInputRefs={gradeInputRefs} currentPage={currentPage} totalPages={paginationMetadata?.totalPages ?? 0} totalItems={paginationMetadata?.totalItems ?? teams.length} itemsPerPage={paginationMetadata?.itemsPerPage || 25} handlePreviousPage={handlePreviousPage} handleNextPage={handleNextPage} />
  </div>;
}
