"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CircleHelp, Clock3, LifeBuoy, RefreshCw } from "lucide-react";
import { AppSidebar } from "@/layouts/AppSidebar";
import { PanelBackground } from "@/components/background/PanelBackground";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { JurorPresenceSection } from "@/features/jurors/presence/components/JurorPresenceSection";
import { SubstituteNoticesSection } from "@/features/jurors/substitutes/components/SubstituteNoticesSection";
import {
  fetchEvaluationTracking,
  type EvaluationTrackingLevel,
  type EvaluationTrackingResult,
} from "@/features/grading/api/evaluationTracking";
import { filterGroupsByLevel } from "@/features/grading/lib/trackingLevelFilter";
import { AbsentJurorItem } from "@/features/jurors/presence/components/AbsentJurorItem";
import { AbsentJurorResponseDialog } from "@/features/jurors/presence/components/AbsentJurorResponseDialog";
import { NotComingJurorsSection } from "@/features/jurors/presence/components/NotComingJurorsSection";
import {
  fetchAbsenceAlert,
  fetchAbsencePanel,
  fetchFairSchedule,
  updateFairSchedule,
  type AbsenceAlertResult,
  type AbsencePanelResult,
  type FairSchedule,
  type JurorAttendanceState,
} from "@/features/jurors/presence/api/absenceAlert";

const REFRESH_SECONDS = 10;
const levels: EvaluationTrackingLevel[] = ["N0", "N1", "N2", "N3", "N4"];
type SortMode = "counted" | "received" | "present" | "name";
const attendanceOptions: Array<{ value: "" | JurorAttendanceState; label: string }> = [
  { value: "", label: "Todos los estados" },
  { value: "NO_CHECK_IN", label: "Sin check-in" },
  { value: "PRESENT", label: "Presentes" },
  { value: "ABSENT", label: "Ausentes" },
];

const attendanceLabel: Record<JurorAttendanceState, string> = {
  NO_CHECK_IN: "Sin check-in",
  PRESENT: "Presente",
  ABSENT: "Ausente",
};

const formatBogotaTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));

const isElevenOrLater = () => {
  const colombiaHour = Number(new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "America/Bogota",
  }).format(new Date()));
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

const columnHelp = {
  group: "Nombre del grupo, con su código y videojuego.",
  level: "Nivel del grupo.",
  assigned: "Jurados asignados al grupo.",
  present: "Jurados asignados que ya llegaron.",
  received: "Evaluaciones de jurados enviadas al grupo. No incluye la nota del profesor.",
  counted: "Evaluaciones de jurados que cuentan para el seguimiento (las 3 primeras). No incluye la nota del profesor.",
};

function ColumnHeader({ label, help }: { label: string; help: string }) {
  return (
    <th scope="col" className="p-3 text-center">
      <span className="inline-flex items-center gap-1">
        {label}
        <Popover>
          <PopoverTrigger aria-label={`Qué significa ${label}`} className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
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

export function RealtimeTrackingPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "Administrador";
  const [alert, setAlert] = useState<AbsenceAlertResult | null>(null);
  const [panel, setPanel] = useState<AbsencePanelResult | null>(null);
  const [attendance, setAttendance] = useState<"" | JurorAttendanceState>("");
  const [search, setSearch] = useState("");
  const [tracking, setTracking] = useState<EvaluationTrackingResult | null>(null);
  const [level, setLevel] = useState<EvaluationTrackingLevel | "">("");
  const [date, setDate] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("counted");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<FairSchedule>({
    fairDate: null,
    startTime: "08:00",
    alertTime: "10:00",
    controlTime: "11:00",
    closeTime: "12:00",
  });
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [responseJuror, setResponseJuror] = useState<{ jurorId: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [alertResult, panelResult] = await Promise.all([
        fetchAbsenceAlert(),
        fetchAbsencePanel(attendance || undefined),
      ]);
      setAlert(alertResult);
      setPanel(panelResult);
      const trackingResult = await fetchEvaluationTracking(level || undefined, date || undefined);
      setTracking(trackingResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el seguimiento.");
    } finally {
      setIsLoading(false);
    }
  }, [attendance, date, level]);

  const openSchedule = useCallback(async () => {
    setScheduleError(null);
    try {
      const result = await fetchFairSchedule();
      setSchedule(result.schedule);
      setShowSchedule(true);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "No se pudo cargar el cronograma.");
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = window.setInterval(() => void loadData(), REFRESH_SECONDS * 1000);
    return () => window.clearInterval(interval);
  }, [loadData]);

  const saveSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    setScheduleError(null);
    setScheduleSaved(false);
    if (!(schedule.startTime < schedule.alertTime &&
      schedule.alertTime < schedule.controlTime &&
      schedule.controlTime < schedule.closeTime)) {
      setScheduleError("El orden debe ser: inicio < alerta < control < cierre.");
      return;
    }
    setIsSavingSchedule(true);
    try {
      const result = await updateFairSchedule({ ...schedule, editionId: alert?.edition.id });
      setSchedule(result.schedule);
      setScheduleSaved(true);
      await loadData();
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "No se pudo guardar el cronograma.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const openResponses = (juror: { jurorId: string; name: string }) => setResponseJuror(juror);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return filterGroupsByLevel(panel?.data ?? [], level).filter((group) =>
      !query || `${group.teamCode} ${group.teamName} ${group.videogame}`.toLowerCase().includes(query),
    ).sort((first, second) => {
      if (sortMode === "name") return first.teamName.localeCompare(second.teamName);
      const firstTracking = tracking?.groups.find((group) => group.teamId === first.teamId);
      const secondTracking = tracking?.groups.find((group) => group.teamId === second.teamId);
      if (sortMode === "received") return (firstTracking?.evaluationsReceived ?? 0) - (secondTracking?.evaluationsReceived ?? 0) || first.teamName.localeCompare(second.teamName);
      if (sortMode === "present") return first.presentJurors - second.presentJurors || first.teamName.localeCompare(second.teamName);
      return (firstTracking?.evaluationsCounted ?? 0) - (secondTracking?.evaluationsCounted ?? 0) || first.teamName.localeCompare(second.teamName);
    });
  }, [level, panel?.data, search, sortMode, tracking?.groups]);

  const alertIsDefinitive = alert?.phase === "CONTROL" || alert?.phase === "CLOSED";
  const canConfigure = isAdmin && alert?.edition.writable !== false;

  return (
    <SidebarProvider>
      <PanelBackground />
      <AppSidebar />
      {/* ARK-248 (BG-58): sin min-w-0 el flex item crece al ancho de la tabla por hora y la página entera
          hace scroll horizontal; así la tabla hace scroll dentro de su contenedor. */}
      <SidebarInset className="min-w-0 max-md:bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 z-20" />
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link to="/inicio" className="hover:text-foreground">Inicio</Link></li>
              <li><ChevronRight className="size-3.5" /></li>
              <li className="text-foreground">Panel de Seguimiento</li>
            </ol>
          </nav>
        </header>

        {/* SidebarInset ya es el <main> de la página */}
        <section className="mx-auto w-full max-w-[1600px] px-4 pb-10">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-medium">Seguimiento por hora</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Asistencia y cobertura de evaluaciones. Se actualiza automáticamente cada {REFRESH_SECONDS} segundos.
              </p>
            </div>
            {isAdmin && (
              <button type="button" onClick={() => void openSchedule()} disabled={!canConfigure}
                className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-4 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">
                <Clock3 className="size-4" /> Configurar cronograma
              </button>
            )}
          </div>

          {alert?.phase === "NOT_CONFIGURED" && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
              Falta configurar el cronograma de la feria.
              {isAdmin && " Usa «Configurar cronograma» para añadirlo."}
            </div>
          )}

          {alert && alert.alertActive && (
            <div className={`mb-4 rounded-md border p-4 ${alertIsDefinitive ? "border-red-500/50 bg-red-500/10" : "border-blue-500/40 bg-blue-500/10"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    {alertIsDefinitive ? "Alerta definitiva de inasistencia" : "Alerta informativa de inasistencia"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alertIsDefinitive ? "Los jurados sin llegada se consideran ausentes." : "Entrega esta lista al profesor para seguimiento manual."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* HU-14 (ARK-214): de la alerta a la sugerencia de suplentes */}
                  {isAdmin && (
                    <Link to="/contingencia-suplentes"
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90">
                      <LifeBuoy className="size-4" /> Sugerir suplentes
                    </Link>
                  )}
                  <div className="rounded-lg bg-background px-4 py-2 text-center">
                    <div className="text-2xl font-bold">{alert.totals.missing}</div>
                    <div className="text-xs text-muted-foreground">jurados faltan</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    {alertIsDefinitive ? "Jurados ausentes" : "Jurados sin check-in"} ({alert.missingJurors.length})
                  </h3>
                  {alert.missingJurors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay jurados pendientes.</p>
                  ) : (
                    <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border bg-background p-2 text-sm">
                      {/* HU-44: cada ausente con sus grupos y cuántos le faltan por calificar */}
                      {alert.missingJurors.map((juror) => (
                        <AbsentJurorItem key={juror.jurorId} juror={juror}>
                          {isAdmin && (
                            <button type="button" onClick={() => openResponses(juror)}
                              aria-label={`Registrar respuesta de ${juror.name}`}
                              className="rounded border px-2 py-1 text-xs hover:bg-muted">
                              Registrar respuesta
                            </button>
                          )}
                        </AbsentJurorItem>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Grupos que más evaluaciones necesitan</h3>
                  {alert.groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todos los grupos tienen tres evaluaciones o más.</p>
                  ) : (
                    <ol className="max-h-64 space-y-1 overflow-y-auto rounded-md border bg-background p-2 text-sm">
                      {alert.groups.map((group) => (
                        <li key={group.teamId} className="flex justify-between gap-2 rounded px-2 py-1.5 hover:bg-muted/40">
                          <span>{group.teamCode} · {group.teamName}</span>
                          <span className="font-medium">Faltan {group.missingEvaluations}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>
          )}

          {alert && !alert.alertActive && alert.phase !== "NOT_CONFIGURED" && (
            <div className="mb-4 flex items-center justify-between rounded-md border p-4">
              <span className="text-sm">Jurados faltantes</span>
              <span className="text-2xl font-bold">{alert.totals.missing}</span>
            </div>
          )}

          {/* HU-44 (ARK-294): los que avisaron que no vendrán, a cualquier hora */}
          {alert && (
            <NotComingJurorsSection jurors={alert.notComingJurors ?? []} isAdmin={isAdmin}
              onRegisterResponse={openResponses} />
          )}

          {/* HU-23: el back solo da la presencia al Administrador (HU-12 podrá abrirla a profesores senior) */}
          {isAdmin && <JurorPresenceSection canConfigure={alert?.edition.writable !== false} />}
          {/* HU-22 (A1): suplentes con el aviso «Te asignaron grupos» sin leer */}
          {isAdmin && <SubstituteNoticesSection />}

          {/* En una fila los filtros miden ~1090 px: con la barra lateral abierta solo caben desde 2xl */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(220px,1fr)_150px_190px_180px_180px_auto]">
            <Input aria-label="Buscar grupo" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar grupo, código o videojuego" />
            <select aria-label="Filtrar por nivel" value={level}
              onChange={(event) => setLevel(event.target.value as EvaluationTrackingLevel | "")}
              className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Todos los niveles</option>
              {levels.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select aria-label="Ordenar grupos" value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="counted">Menos evaluaciones cuentan</option>
              <option value="received">Menos recibidas</option>
              <option value="present">Menos presentes</option>
              <option value="name">Nombre del grupo</option>
            </select>
            <select aria-label="Filtrar por asistencia" value={attendance}
              onChange={(event) => setAttendance(event.target.value as "" | JurorAttendanceState)}
              className="h-9 rounded-md border bg-background px-3 text-sm">
              {attendanceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <Input aria-label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <button type="button" onClick={() => void loadData()} disabled={isLoading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm hover:bg-accent disabled:opacity-50">
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} /> Actualizar
            </button>
          </div>

          {panel && (
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <span><strong>{panel.totals.present}</strong> presentes</span>
              <span><strong>{panel.totals.missing}</strong> faltantes</span>
              <span><strong>{panel.totals.total}</strong> jurados</span>
              <span className="text-muted-foreground">Última actualización: {formatBogotaTime(panel.generatedAt)}</span>
            </div>
          )}

          {tracking && (
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-red-500" />
              Menos de 3 evaluaciones al corte de las 11:00
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
              {error}{alert || panel ? " Se mantiene la última información disponible." : ""}
            </div>
          )}

          {isLoading && !panel ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">Cargando seguimiento...</div>
          ) : visibleGroups.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">No hay grupos para este filtro</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <ColumnHeader label="Grupo" help={columnHelp.group} />
                    <ColumnHeader label="Nivel" help={columnHelp.level} />
                    <ColumnHeader label="Asignados" help={columnHelp.assigned} />
                    <ColumnHeader label="Presentes" help={columnHelp.present} />
                    <ColumnHeader label="Recibidas" help={columnHelp.received} />
                    <ColumnHeader label="Cuentan" help={columnHelp.counted} />
                    <th className="p-3 text-center">Faltan evaluaciones</th>
                    <th className="p-3">Jurados y asistencia</th>
                    {(tracking?.hours ?? []).map((hour) => <ColumnHeader key={hour} label={`${hour}:00`} help={`Evaluaciones acumuladas del grupo hasta las ${hour}:00.`} />)}
                  </tr>
                </thead>
                <tbody>
                  {visibleGroups.map((group) => {
                    const tracked = tracking?.groups.find((item) => item.teamId === group.teamId);
                    const highlight = shouldHighlightAtEleven(date) && tracked?.belowMinimumAt11;
                    return (
                    <tr key={group.teamId} className={`border-b align-top last:border-0 ${highlight ? "bg-red-500/10" : "hover:bg-muted/30"}`}>
                      {/* La tabla hace scroll dentro de su contenedor: anchos mínimos para que no se aplaste */}
                      <td className="p-3">
                        <div className="min-w-48 font-medium">{group.teamName}</div>
                        <div className="text-xs text-muted-foreground">{group.teamCode} · {group.videogame}</div>
                      </td>
                      <td className="p-3">{group.level ?? "Sin nivel"}</td>
                      <td className="p-3 text-center">{group.assignedJurors}</td>
                      <td className="p-3 text-center">{group.presentJurors}</td>
                      <td className="p-3 text-center">{tracking?.groups.find((item) => item.teamId === group.teamId)?.evaluationsReceived ?? 0}</td>
                      <td className="p-3 text-center">{tracking?.groups.find((item) => item.teamId === group.teamId)?.evaluationsCounted ?? 0}</td>
                      <td className="p-3 text-center">{group.missingEvaluations}</td>
                      <td className="p-3">
                        <div className="min-w-60 space-y-1">
                          {(group.jurors ?? []).map((juror) => (
                            <div key={juror.jurorId} className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/30 px-2 py-1">
                              <span>{juror.name}{juror.type === "BACKUP" ? " · Suplente" : ""}</span>
                              <span className="text-xs">{attendanceLabel[juror.state]}</span>
                            </div>
                          ))}
                          {group.jurors?.length === 0 && <span className="text-muted-foreground">Sin jurados en este estado</span>}
                        </div>
                      </td>
                      {(tracking?.hours ?? []).map((hour) => {
                        const bucket = tracked?.byHour.find((item) => item.hour === hour);
                        return <td key={hour} className="whitespace-nowrap p-3 text-center">{bucket?.counted ?? 0} / {bucket?.received ?? 0}</td>;
                      })}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {showSchedule && isAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"
              aria-label="Configurar cronograma">
              <form onSubmit={saveSchedule} className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold">Cronograma de la feria</h2>
                  <button type="button" onClick={() => setShowSchedule(false)} className="text-sm">Cerrar</button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-sm">Fecha de la feria
                    <Input type="date" required value={schedule.fairDate ?? ""}
                      onChange={(event) => setSchedule({ ...schedule, fairDate: event.target.value })} />
                  </label>
                  {(["startTime", "alertTime", "controlTime", "closeTime"] as const).map((field) => (
                    <label key={field} className="text-sm">
                      {{ startTime: "Inicio", alertTime: "Alerta", controlTime: "Control", closeTime: "Cierre" }[field]}
                      <Input type="time" required value={schedule[field]}
                        onChange={(event) => setSchedule({ ...schedule, [field]: event.target.value })} />
                    </label>
                  ))}
                </div>
                {scheduleError && <p className="mt-3 text-sm text-red-600">{scheduleError}</p>}
                {scheduleSaved && <p className="mt-3 text-sm text-green-600">Cronograma guardado.</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowSchedule(false)} className="h-9 rounded-md border px-4 text-sm">Cancelar</button>
                  <button type="submit" disabled={isSavingSchedule} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50">
                    Guardar cronograma
                  </button>
                </div>
              </form>
            </div>
          )}
          {responseJuror && isAdmin && (
            <AbsentJurorResponseDialog juror={responseJuror} onClose={() => setResponseJuror(null)}
              onSaved={loadData} />
          )}
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
