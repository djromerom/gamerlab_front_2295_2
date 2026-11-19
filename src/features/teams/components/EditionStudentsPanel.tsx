import { pageLabel } from "@/lib/pagination";
import React, { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  fetchEditionStudents,
  type EditionStudentsList,
  type ParticipationVideogameStatus,
} from "@/features/teams/api/editionStudents";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

const VIDEOGAME_STATUS_LABEL: Record<ParticipationVideogameStatus, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
};

const videogameVariant: Record<ParticipationVideogameStatus, BadgeVariant> = {
  PENDIENTE: "warning",
  CONFIRMADO: "success",
  RECHAZADO: "destructive",
};

const ACCOUNT_LABEL: Record<string, string> = {
  CONFIRMADO: "Verificada",
  PENDIENTE: "Sin verificar",
  EXPIRADO: "Enlace vencido",
};

const accountVariant: Record<string, BadgeVariant> = {
  CONFIRMADO: "success",
  PENDIENTE: "warning",
  EXPIRADO: "destructive",
};

const PAGE_SIZES = [10, 20, 50, 100];
const selectClass = "h-10 rounded-md border border-input bg-background px-2 text-sm";

interface EditionStudentsPanelProps {
  /** undefined = edición activa (la decide el back). */
  editionId?: number;
}

/**
 * ARK-129 (HU-26): estudiantes inscritos en la edición elegida con su equipo y su estado.
 * Por edición: el videojuego del equipo y si el integrante está activo. Global: la cuenta.
 */
export const EditionStudentsPanel: React.FC<EditionStudentsPanelProps> = ({ editionId }) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [videogameStatus, setVideogameStatus] = useState<ParticipationVideogameStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [list, setList] = useState<EditionStudentsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Cambiar la edición o un filtro vuelve a la primera página
  useEffect(() => setPage(1), [editionId, debouncedSearch, videogameStatus, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEditionStudents({
      editionId,
      search: debouncedSearch,
      videogameStatus: videogameStatus || undefined,
      page,
      limit,
    })
      .then((result) => !cancelled && setList(result))
      .catch((err: unknown) => {
        if (cancelled) return;
        setList(null);
        setError(err instanceof Error ? err.message : "No se pudo cargar la lista de estudiantes.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [editionId, debouncedSearch, videogameStatus, page, limit]);

  const summary = list?.summary;
  const metadata = list?.metadata;

  return (
    <div className="space-y-4 px-4 pb-6">
      {summary && (
        <div className="flex flex-wrap gap-2 text-sm" aria-label="Resumen de la edición">
          <Badge variant="outline">{summary.total} inscritos</Badge>
          <Badge variant="outline">{summary.active} activos</Badge>
          {summary.inactive > 0 && <Badge variant="outline">{summary.inactive} inactivos</Badge>}
          {(Object.keys(VIDEOGAME_STATUS_LABEL) as ParticipationVideogameStatus[]).map((s) => (
            <Badge key={s} variant={videogameVariant[s]}>
              {VIDEOGAME_STATUS_LABEL[s]}: {summary.byVideogameStatus[s] ?? 0}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border rounded px-3 h-10 min-w-0">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full min-w-0 placeholder:text-muted-foreground"
            placeholder="Buscar nombre, correo, código o equipo..."
            aria-label="Buscar estudiante"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Estado del videojuego"
          className={selectClass}
          value={videogameStatus}
          onChange={(e) => setVideogameStatus(e.target.value as ParticipationVideogameStatus | "")}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(VIDEOGAME_STATUS_LABEL) as ParticipationVideogameStatus[]).map((s) => (
            <option key={s} value={s}>
              Videojuego {VIDEOGAME_STATUS_LABEL[s].toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && list && !list.edition && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No hay una edición activa. Elige una edición para consultar sus estudiantes.</AlertDescription>
        </Alert>
      )}

      <Card className={`rounded-lg overflow-hidden bg-card ${loading ? "opacity-75" : ""}`}>
        <Table>
          <TableHeader className="bg-card border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead>Estudiante</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>En la edición</TableHead>
              <TableHead>Videojuego</TableHead>
              <TableHead>Cuenta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !list ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Cargando...
                  </span>
                </TableCell>
              </TableRow>
            ) : !list || list.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay estudiantes inscritos con estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              list.data.map((student) => (
                <TableRow key={student.memberId}>
                  <TableCell>
                    <div className="font-medium">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{student.email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{student.studentCode}</TableCell>
                  <TableCell>
                    <div className="text-sm">{student.team.teamName}</div>
                    <div className="text-xs text-muted-foreground">{student.team.teamCode}</div>
                  </TableCell>
                  <TableCell className="text-sm">{student.isLeader ? "Líder" : "Integrante"}</TableCell>
                  <TableCell>
                    <Badge variant={student.isActive ? "success" : "secondary"}>
                      {student.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.videogameStatus ? (
                      <Badge variant={videogameVariant[student.videogameStatus]}>
                        {VIDEOGAME_STATUS_LABEL[student.videogameStatus]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.accountStatus ? (
                      <Badge variant={accountVariant[student.accountStatus] ?? "outline"}>
                        {ACCOUNT_LABEL[student.accountStatus] ?? student.accountStatus}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin cuenta</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {metadata && metadata.totalItems > 0 && (
          <div className="flex flex-wrap justify-between items-center gap-2 p-4 text-sm border-t border-border">
            <label className="flex items-center gap-2">
              Filas
              <select
                aria-label="Filas por página"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-3">
              <span>
                Página {pageLabel(metadata.currentPage, metadata.totalPages)}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Página anterior"
                onClick={() => setPage((p) => p - 1)}
                disabled={metadata.currentPage <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Página siguiente"
                onClick={() => setPage((p) => p + 1)}
                disabled={metadata.currentPage >= metadata.totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        «En la edición» y «Videojuego» son de esta edición. «Cuenta» es global: indica si el estudiante verificó su
        correo y no cambia entre ediciones. Solo tiene cuenta el líder del equipo.
      </p>
    </div>
  );
};
