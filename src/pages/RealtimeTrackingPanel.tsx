"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CircleHelp, RefreshCw } from "lucide-react";
import { AppSidebar } from "@/components/grupo 9/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fetchEvaluationTracking,
  type EvaluationTrackingLevel,
  type EvaluationTrackingResult,
} from "@/fetchs/evaluationTracking";

const levels: EvaluationTrackingLevel[] = ["N0", "N1", "N2", "N3", "N4"];
type SortMode = "counted" | "received" | "present" | "name";

const REFRESH_SECONDS = 10;

const columnHelp = {
  group: "Nombre del grupo, con su código y su videojuego.",
  level: "Nivel del grupo, tomado de su código (N0 a N4).",
  assigned: "Jurados asignados al grupo, incluidos los suplentes que se le sumen.",
  present: "De los jurados asignados, incluidos los suplentes, cuántos ya registraron su llegada a la feria.",
  received: "Evaluaciones enviadas para el grupo.",
  counted: "Evaluaciones del grupo que se tienen en cuenta en el seguimiento.",
};

const hourHelp = (hour: number) =>
  `Evaluaciones que tenía el grupo a las ${hour}:00, acumuladas desde el inicio. El primer número son las que cuentan y el segundo, las recibidas.`;

// Popover y no Tooltip: el Tooltip de Radix no abre con un toque en celular.
function ColumnHeader({ label, help, className = "text-center" }: { label: string; help: string; className?: string }) {
  return (
    <th scope="col" className={`p-3 ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        <Popover>
          <PopoverTrigger
            aria-label={`Qué significa ${label}`}
            className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <CircleHelp className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent collisionPadding={16} className="w-64 max-w-[calc(100vw-2rem)] p-3 text-xs leading-relaxed">
            {help}
          </PopoverContent>
        </Popover>
      </span>
    </th>
  );
}

const formatBogotaTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));

const isElevenOrLater = () => {
  const colombiaHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Bogota",
    }).format(new Date()),
  );
  return colombiaHour >= 11;
};

const shouldHighlightAtEleven = (selectedDate: string) => {
  if (!selectedDate) return isElevenOrLater();

  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [month, day, year] = todayParts.split("/");
  const todayInBogota = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  if (selectedDate < todayInBogota) return true;
  if (selectedDate > todayInBogota) return false;
  return isElevenOrLater();
};

export function RealtimeTrackingPanel() {
  const [data, setData] = useState<EvaluationTrackingResult | null>(null);
  const [level, setLevel] = useState<EvaluationTrackingLevel | "">("");
  const [date, setDate] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("counted");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchEvaluationTracking(level || undefined, date || undefined);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el seguimiento");
    } finally {
      setIsLoading(false);
    }
  }, [date, level]);

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => void loadData(), REFRESH_SECONDS * 1000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const visibleGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const groups = [...(data?.groups ?? [])].filter((group) => {
      if (!normalizedSearch) return true;
      return `${group.teamCode} ${group.teamName} ${group.videogame}`
        .toLowerCase()
        .includes(normalizedSearch);
    });

    return groups.sort((first, second) => {
      if (sortMode === "received") return first.evaluationsReceived - second.evaluationsReceived || first.teamName.localeCompare(second.teamName);
      if (sortMode === "present") return first.presentJurors - second.presentJurors || first.teamName.localeCompare(second.teamName);
      if (sortMode === "name") return first.teamName.localeCompare(second.teamName);
      return first.evaluationsCounted - second.evaluationsCounted || first.teamName.localeCompare(second.teamName);
    });
  }, [data?.groups, search, sortMode]);

  const hourCount = data?.hours.length ?? 5;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 z-20" />
            <nav aria-label="breadcrumb">
              <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <li><Link to="/inicio" className="hover:text-foreground">Inicio</Link></li>
                <li><ChevronRight className="size-3.5" /></li>
                <li className="text-foreground">Panel de Seguimiento</li>
              </ol>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 pb-10">
          <div className="mb-6">
            <h1 className="text-xl font-medium">Seguimiento por hora</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Muestra cuántas evaluaciones lleva cada grupo de la feria activa, para detectar a tiempo los que van
              atrasados. Se actualiza solo cada {REFRESH_SECONDS} segundos.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Ordenar:</span> con «Menos evaluaciones cuentan», el orden
                inicial, los grupos con menos evaluaciones salen primero. Puedes cambiarlo en la lista de orden.
              </li>
              <li>
                <span className="font-medium text-foreground">Filtrar por nivel:</span> abre «Todos los niveles» y elige
                un nivel para ver solo sus grupos.
              </li>
              <li>
                <span className="font-medium text-foreground">Columnas:</span> pulsa el ícono de ayuda junto a cada
                título para ver qué cuenta.
                <span className="md:hidden"> Desliza la tabla hacia los lados para ver las horas.</span>
              </li>
            </ul>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_160px_180px_180px_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar grupo, código o videojuego" />
            <select aria-label="Filtrar por nivel" value={level} onChange={(event) => setLevel(event.target.value as EvaluationTrackingLevel | "")}
              className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Todos los niveles</option>
              {levels.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Ordenar grupos" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="counted">Menos evaluaciones cuentan</option>
              <option value="received">Menos recibidas</option>
              <option value="present">Menos presentes</option>
              <option value="name">Nombre del grupo</option>
            </select>
            <Input aria-label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <button type="button" onClick={() => void loadData()} disabled={isLoading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm hover:bg-accent disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>

          {data && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                Fecha: {data.date} · Última actualización: {formatBogotaTime(data.generatedAt)}
              </p>
              <p>
                <span className="mr-1 inline-block size-2 rounded-full bg-red-500" />
                Menos de 3 evaluaciones al corte de las 11:00
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
              {error}{data ? " Se mantiene la última información disponible." : ""}
            </div>
          )}

          {isLoading && !data ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">Cargando seguimiento...</div>
          ) : visibleGroups.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">No hay grupos para este filtro</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <ColumnHeader label="Grupo" help={columnHelp.group} className="min-w-[220px]" />
                    <ColumnHeader label="Nivel" help={columnHelp.level} className="" />
                    <ColumnHeader label="Asignados" help={columnHelp.assigned} />
                    <ColumnHeader label="Presentes" help={columnHelp.present} />
                    <ColumnHeader label="Recibidas" help={columnHelp.received} />
                    <ColumnHeader label="Cuentan" help={columnHelp.counted} />
                    {data?.hours.map((hour) => <ColumnHeader key={hour} label={`${hour}:00`} help={hourHelp(hour)} />)}
                  </tr>
                </thead>
                <tbody>
                  {visibleGroups.map((group) => {
                    const highlight = shouldHighlightAtEleven(date) && group.belowMinimumAt11;
                    return (
                      <tr key={group.teamId} className={`border-b last:border-0 ${highlight ? "bg-red-500/10" : "hover:bg-muted/30"}`}>
                        <td className="p-3">
                          <div className="font-medium">{group.teamName}</div>
                          <div className="text-xs text-muted-foreground">{group.teamCode} · {group.videogame}</div>
                        </td>
                        <td className="p-3">{group.level ?? "Sin nivel"}</td>
                        <td className="p-3 text-center">{group.assignedJurors}</td>
                        <td className="p-3 text-center">{group.presentJurors}</td>
                        <td className="p-3 text-center">{group.evaluationsReceived}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-muted px-2 py-1">
                            {group.evaluationsCounted}
                          </span>
                        </td>
                        {Array.from({ length: hourCount }, (_, index) => data?.hours[index]).map((hour, index) => {
                          const bucket = group.byHour.find((item) => item.hour === hour);
                          return (
                            <td key={`${hour}-${index}`} className="p-3 text-center">
                              <span>{bucket?.counted ?? 0}</span>
                              <span className="text-muted-foreground"> / {bucket?.received ?? 0}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
