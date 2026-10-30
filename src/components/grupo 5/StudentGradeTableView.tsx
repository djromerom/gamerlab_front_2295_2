import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { RefObject } from "react";
import { gradeKey, type GradeTeam } from "./student-grade-table-types";

interface Props {
  teams: GradeTeam[];
  filteredTeams: GradeTeam[];
  initialLoading: boolean;
  isLoading: boolean;
  noStudents: boolean;
  isEditingGrades: boolean;
  editedGrades: Record<string, string>;
  setEditedGrades: (update: (previous: Record<string, string>) => Record<string, string>) => void;
  savingGrade: boolean;
  gradeInputRefs: RefObject<Map<string, HTMLInputElement>>;
  currentPage: number;
  totalPages: number;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
}

export default function StudentGradeTableView({ teams, filteredTeams, initialLoading, isLoading, noStudents, isEditingGrades, editedGrades, setEditedGrades, savingGrade, gradeInputRefs, currentPage, totalPages, handlePreviousPage, handleNextPage }: Props) {
  return <>
    <div className="rounded-md border bg-[var(--card)] shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[var(--color-primary)] [&_th]:!text-white dark:bg-blue-900/30 dark:text-[var(--card-foreground)] border-b border-border">
          <TableRow><TableHead>Team Code</TableHead><TableHead>Feria</TableHead><TableHead>NRC</TableHead><TableHead>Equipo</TableHead><TableHead>Integrantes</TableHead><TableHead>Videojuego</TableHead><TableHead className="text-center">Calificación Feria</TableHead><TableHead className="text-center">Calificación Docente</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {initialLoading || isLoading ? Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-12" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-48" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell><TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell></TableRow>
          )) : noStudents || teams.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="h-48 text-center"><div className="flex flex-col items-center justify-center text-center"><div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4 mx-auto"><AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" /></div><p className="font-semibold text-lg mb-1">No hay proyectos registrados para estos filtros</p><p className="text-sm opacity-70">Verifica los proyectos asociados a las ferias y NRC seleccionados.</p></div></TableCell></TableRow>
          ) : filteredTeams.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm opacity-70">No se encontraron equipos con esos criterios de búsqueda.</TableCell></TableRow>
          ) : filteredTeams.map((team, index) => {
            const key = gradeKey(team);
            return <TableRow key={`${team.editionId ?? "edition"}-${team.teamCode}-${team.videogameId ?? "game"}`} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">{team.teamCode}</TableCell><TableCell>{team.editionLabel}</TableCell><TableCell>{team.source === "historical" && !team.nrc ? <span className="text-muted-foreground" title="Este snapshot histórico se creó antes de guardar los NRC asociados.">No registrado</span> : team.nrc || "-"}</TableCell><TableCell>{team.teamName}</TableCell>
              <TableCell><div className="text-sm opacity-80">{Array.isArray(team.integrantes) ? team.integrantes.join(", ") : team.integrantes || "-"}</div></TableCell>
              <TableCell>{team.videogame}</TableCell>
              <TableCell className="text-center">{team.calificacionFeria != null ? team.calificacionFeria.toFixed(1) : <span className="text-orange-600 font-medium">Pendiente</span>}</TableCell>
              <TableCell className="text-center">{isEditingGrades && team.canEdit ? <div className="flex items-center justify-center gap-2"><Input ref={(element) => { if (element) gradeInputRefs.current.set(key, element); else gradeInputRefs.current.delete(key); }} type="number" min="0" max="5" step="0.1" value={editedGrades[key] ?? ""} onChange={(event) => setEditedGrades((previous) => ({ ...previous, [key]: event.target.value }))} className="w-20 h-8 text-center" autoFocus={index === 0} disabled={savingGrade} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); const nextTeam = filteredTeams.slice(index + 1).find((candidate) => candidate.canEdit); if (nextTeam) gradeInputRefs.current.get(gradeKey(nextTeam))?.focus(); } }} /></div> : <span className={team.calificacionDocente != null ? "" : "text-orange-600 font-medium"}>{team.calificacionDocente != null ? team.calificacionDocente.toFixed(1) : team.source === "historical" ? <span className="text-muted-foreground">Sin dato histórico</span> : "Pendiente"}{!team.canEdit && <span className="block text-xs opacity-60">Solo lectura</span>}</span>}</TableCell>
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
    {!initialLoading && !isLoading && teams.length > 0 && <div className="flex items-center justify-between px-2 text-sm opacity-70"><div>Mostrando {filteredTeams.length} de {teams.length} equipo(s) en la página {currentPage}</div><div className="flex items-center gap-4"><span>Página {currentPage} de {totalPages}</span><div className="flex gap-1"><Button size="icon" variant="outline" className="h-8 w-8" onClick={handlePreviousPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="h-8 w-8" onClick={handleNextPage} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button></div></div></div>}
  </>;
}
