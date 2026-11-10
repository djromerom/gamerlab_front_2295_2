import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, QrCode, RefreshCw, Search } from "lucide-react";
import LayoutAplication from "@/layouts/LayoutAplication";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JurorAttendanceTable } from "@/components/staff/JurorAttendanceTable";
import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH, type JurorAttendanceResult } from "@/fetchs/jurorAttendance";
import { useJurorAttendance, type AttendanceTab } from "@/hooks/useJurorAttendance";
import { useLockViewportZoom } from "@/hooks/useLockViewportZoom";

const TABS: { value: AttendanceTab; label: string; count: (t: JurorAttendanceResult["totals"]) => number }[] = [
  { value: "ALL", label: "Todos", count: (t) => t.total },
  { value: "MISSING", label: "Faltan", count: (t) => t.missing },
  { value: "PRESENT", label: "Presentes", count: (t) => t.present },
];

const formatUpdated = (date: Date) =>
  new Intl.DateTimeFormat("es-CO", { timeStyle: "medium", timeZone: "America/Bogota" }).format(date);

function emptyMessage(result: JurorAttendanceResult, searching: boolean) {
  if (result.totals.total === 0 && !searching) return "La edición no tiene jurados confirmados.";
  return "No hay jurados para este filtro.";
}

/**
 * HU-29: quién de los jurados de la edición activa ya llegó y quién falta.
 * La ven el Administrador y el Staff, en solo lectura (la llegada se registra en Check-in).
 */
const JurorAttendancePage: React.FC = () => {
  useLockViewportZoom();
  const { tab, setTab, search, setSearch, setPage, result, error, loading, updatedAt, reload } = useJurorAttendance();
  const searching = search.trim().length >= SEARCH_MIN_LENGTH;
  const metadata = result?.metadata;

  return (
    <LayoutAplication breadcrumbs={[{ label: "Asistencia de jurados", href: "/asistencia-jurados" }]}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Asistencia de jurados</h1>
            <p className="text-muted-foreground">
              {result ? `${result.edition.title} · ` : ""}Se actualiza sola cada 10 segundos.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
            <Link to="/check-in-jurados">
              <QrCode className="mr-2 h-4 w-4" /> Registrar llegada
            </Link>
          </Button>
        </div>

        {error && !result && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No se pudo cargar la asistencia</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {error && result && (
          <Alert role="status" className="border-amber-500 text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No se pudo actualizar</AlertTitle>
            <AlertDescription>
              {error.message} Se muestra la última lista{updatedAt ? ` (${formatUpdated(updatedAt)})` : ""}.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                variant={tab === t.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(t.value)}
              >
                {t.label}
                {result && <span className="ml-1 opacity-80">({t.count(result.totals)})</span>}
              </Button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={SEARCH_MAX_LENGTH}
              placeholder="Buscar por nombre o apellido"
              aria-label="Buscar jurado por nombre o apellido"
              className="pl-9 text-base"
            />
          </div>
        </div>

        {loading && !result ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando asistencia...
          </div>
        ) : result ? (
          <>
            <JurorAttendanceTable jurors={result.data} emptyMessage={emptyMessage(result, searching)} />
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                {updatedAt && `Actualizado a las ${formatUpdated(updatedAt)}`}
                <Button variant="ghost" size="icon" aria-label="Actualizar ahora" onClick={() => void reload()}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </span>
              {metadata && metadata.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span>
                    Página {metadata.currentPage} de {metadata.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Página anterior"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={metadata.currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Página siguiente"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={metadata.currentPage >= metadata.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </LayoutAplication>
  );
};

export default JurorAttendancePage;
