import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { RefObject } from "react";
import { FAIR_GRADE_RULE_REASON, gradeKey, type GradeTeam } from "@/features/results/types/studentGradeTable";
import { isGradeModified } from "@/lib/gradeDrafts";

interface Props {
  teams: GradeTeam[];
  filteredTeams: GradeTeam[];
  initialLoading: boolean;
  isLoading: boolean;
  noStudents: boolean;
  isEditingGrades: boolean;
  editedGrades: Record<string, string>;
  setEditedGrades: (update: (previous: Record<string, string>) => Record<string, string>) => void;
  gradeResults: Record<string, { ok: boolean; message: string }>;
  savingGrade: boolean;
  gradeInputRefs: RefObject<Map<string, HTMLInputElement>>;
  currentPage: number;
  totalPages: number;
  /** Total de equipos del filtro en todas las páginas (`metadata.totalItems` del back, BG-63). */
  totalItems: number;
  itemsPerPage: number;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
}

export default function StudentGradeTableView({ teams, filteredTeams, initialLoading, isLoading, noStudents, isEditingGrades, editedGrades, setEditedGrades, gradeResults, savingGrade, gradeInputRefs, currentPage, totalPages, totalItems, itemsPerPage, handlePreviousPage, handleNextPage }: Props) {
  // BG-63: el pie cuenta el rango de esta página sobre el total real del back. Las columnas de nota van
  // justo después del equipo para que se vean a 1280 px sin desplazar la tabla.
  const firstItem = (currentPage - 1) * itemsPerPage + 1;
  const lastItem = firstItem + teams.length - 1;
  return <>
    <div className="rounded-md border bg-[var(--card)] shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[var(--color-primary)] [&_th]:!text-white dark:bg-blue-900/30 dark:text-[var(--card-foreground)] border-b border-border">
          <TableRow><TableHead>Código del equipo</TableHead><TableHead>Equipo</TableHead><TableHead className="text-center">Calificación Feria</TableHead><TableHead className="text-center">Calificación Docente</TableHead><TableHead>Feria</TableHead><TableHead>NRC</TableHead><TableHead>Videojuego</TableHead><TableHead>Integrantes</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {initialLoading || isLoading ? Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell><TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-12" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-48" /></TableCell></TableRow>
          )) : noStudents || teams.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="h-48 text-center"><div className="flex flex-col items-center justify-center text-center"><div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4 mx-auto"><AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" /></div><p className="font-semibold text-lg mb-1">No hay proyectos registrados para estos filtros</p><p className="text-sm opacity-70">Verifica los proyectos asociados a las ferias y NRC seleccionados.</p></div></TableCell></TableRow>
          ) : filteredTeams.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm opacity-70">No se encontraron equipos con esos criterios de búsqueda.</TableCell></TableRow>
          ) : filteredTeams.map((team, index) => {
            const key = gradeKey(team);
            const isDirty = team.canEdit === true && isGradeModified(editedGrades[key], team.calificacionDocente);
            const result = gradeResults[key];
            return <TableRow key={`${team.editionId ?? "edition"}-${team.teamCode}-${team.videogameId ?? "game"}`} className={`hover:bg-muted/50 transition-colors ${isDirty ? "bg-amber-500/10" : ""}`}>
              <TableCell className="font-medium">{team.teamCode}</TableCell><TableCell>{team.teamName}</TableCell>
              <TableCell className="text-center">{team.rejected ? <span className="font-medium text-destructive" title="La inscripción del equipo está rechazada: no tiene nota de feria mientras lo esté">Rechazado</span> : team.calificacionFeria != null ? team.calificacionFeria.toFixed(2) : <span className="text-orange-600 font-medium">Nota en proceso</span>}{team.fairGradeRule && team.fairGradeRule !== "STANDARD" && <span className="mx-auto mt-1 block max-w-[14rem] whitespace-normal text-xs text-muted-foreground">{FAIR_GRADE_RULE_REASON[team.fairGradeRule]}</span>}</TableCell>
              <TableCell className="text-center">{isEditingGrades && team.canEdit ? <div className="flex flex-col items-center gap-1"><Input ref={(element) => { if (element) gradeInputRefs.current.set(key, element); else gradeInputRefs.current.delete(key); }} type="number" min="0" max="5" step="0.01" value={editedGrades[key] ?? ""} onChange={(event) => setEditedGrades((previous) => ({ ...previous, [key]: event.target.value }))} aria-invalid={result?.ok === false} className={`w-24 h-8 text-center ${result?.ok === false ? "border-destructive" : ""}`} autoFocus={index === 0} disabled={savingGrade} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); const nextTeam = filteredTeams.slice(index + 1).find((candidate) => candidate.canEdit); if (nextTeam) gradeInputRefs.current.get(gradeKey(nextTeam))?.focus(); } }} />{isDirty && !result && <span className="text-xs text-amber-700 dark:text-amber-300">Modificada</span>}{result && <span role="status" className={`text-xs ${result.ok ? "text-emerald-600" : "text-destructive"}`}>{result.ok ? "Guardada" : result.message}</span>}</div> : <span className={team.calificacionDocente != null ? "" : "text-orange-600 font-medium"}>{team.calificacionDocente != null ? team.calificacionDocente.toFixed(2) : team.source === "historical" ? <span className="text-muted-foreground">Sin dato histórico</span> : "Pendiente"}{!team.canEdit && <span className="block text-xs opacity-60">Solo lectura</span>}</span>}</TableCell>
              <TableCell>{team.editionLabel}</TableCell><TableCell>{team.source === "historical" && !team.nrc ? <span className="text-muted-foreground" title="Este snapshot histórico se creó antes de guardar los NRC asociados.">No registrado</span> : team.nrc || "-"}</TableCell>
              <TableCell>{team.videogame}</TableCell>
              <TableCell><div className="text-sm opacity-80">{Array.isArray(team.integrantes) ? team.integrantes.join(", ") : team.integrantes || "-"}</div></TableCell>
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
    {!initialLoading && !isLoading && teams.length > 0 && <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 text-sm opacity-70"><div>Mostrando {firstItem}-{lastItem} de {totalItems} equipo(s)</div><div className="flex items-center gap-4"><span className="whitespace-nowrap">Página {currentPage} de {totalPages}</span><div className="flex shrink-0 gap-1"><Button size="icon" variant="outline" className="h-8 w-8" aria-label="Página anterior" onClick={handlePreviousPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="h-8 w-8" aria-label="Página siguiente" onClick={handleNextPage} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button></div></div></nav>}
  </>;
}
