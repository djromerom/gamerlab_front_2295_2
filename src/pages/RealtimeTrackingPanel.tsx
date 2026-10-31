"use client";


import { apiFetch } from "@/lib/api";
import {
  progressPercentage,
  useEvaluationProgress,
} from "@/fetchs/evaluationProgress";
import { AppSidebar } from "@/components/grupo 9/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChevronRight, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_ENDPOINT_BACKEND;

type JurorType = "OFFICIAL" | "BACKUP" | "oficial" | "remanente" | string;

interface Jurado {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  tipo?: JurorType | null;
  jurorType?: JurorType | null;
  rol?: string;
}

interface Team {
  id: number | string;
  name: string;
  game: string;
  semester: string;
  jurados: Jurado[];
  requiredJurados: number;
  evaluacionesRecibidas?: number;
  evaluacionesRequeridas?: number;
}

function extractArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.teams)) return payload.teams;
  }

  return [];
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeJurorType(jurado: Jurado): string {
  const value = jurado.tipo ?? jurado.jurorType;

  if (value === "OFFICIAL" || value === "oficial") return "Oficial";
  if (value === "BACKUP" || value === "remanente") return "Remanente";

  return "Sin tipo";
}

function mapTeamFromApi(raw: any): Team {
  const rawJurados = extractArray(
    raw.juradosAsignados ??
      raw.jurados ??
      raw.assignedJurors ??
      raw.jurors ??
      raw.assigned_jurors ??
      [],
  );

  const jurados: Jurado[] = rawJurados.map((jurado: any) => {
    const firstName = safeString(jurado.firstName);
    const lastName = safeString(jurado.lastName);
    const email = safeString(jurado.email ?? jurado.correo);
    const fallbackName = safeString(
      jurado.nombre ?? jurado.name ?? jurado.fullName,
    );

    const fullName =
      `${firstName} ${lastName}`.trim() || fallbackName || email || "Jurado";

    return {
      id: String(
        jurado.id ?? jurado.jurorId ?? jurado.userId ?? email ?? fullName,
      ),
      name: fullName,
      email,
      avatar: safeString(
        jurado.avatar ?? jurado.photoUrl ?? jurado.profilePicture,
      ),
      tipo: jurado.jurorType ?? jurado.tipo_jurado ?? jurado.tipo ?? null,
      jurorType: jurado.jurorType ?? null,
      rol: jurado.rol,
    };
  });

  return {
    id: raw.id ?? raw.teamId ?? raw.id_equipo ?? 0,
    name: safeString(
      raw.nombre ?? raw.name ?? raw.teamName ?? raw.equipo,
      "Equipo sin nombre",
    ),
    game: safeString(
      raw.videojuego ??
        raw.game ??
        raw.gameName ??
        raw.videogameName ??
        raw.videogame?.name ??
        raw.projectName,
      "Sin videojuego",
    ),
    semester: safeString(
      raw.semester ?? raw.level ?? raw.nivel ?? raw.course,
      "Sin semestre",
    ),
    jurados,
    requiredJurados: safeNumber(
      raw.requiredJurados ?? raw.requiredJurors ?? raw.jurorSlots,
      3,
    ),
    evaluacionesRecibidas: safeNumber(
      // [MODIFICADO]: Se agregó raw.juradosQueEvaluaron para leer correctamente la cantidad de evaluaciones desde el backend.
      // [ANTES]: El frontend ignoraba la propiedad juradosQueEvaluaron que envía el backend.
      raw.evaluacionesRecibidas ??
        raw.evaluationsReceived ??
        raw.completedEvaluations ??
        raw.evaluatedCount ??
        raw.juradosQueEvaluaron,
      0,
    ),
    evaluacionesRequeridas: safeNumber(
      raw.evaluacionesRequeridas ??
        raw.evaluationsRequired ??
        raw.requiredEvaluations ??
        raw.requiredJurados ??
        raw.requiredJurors,
      3,
    ),
  };
}

function getTeamEvaluationStatus(team: Team) {
  const received = team.evaluacionesRecibidas ?? 0;
  const required = team.evaluacionesRequeridas ?? team.requiredJurados;

  if (received >= required) return "completed";
  if (received > 0) return "progress";
  return "pending";
}

export function RealtimeTrackingPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchSeguimiento, setSearchSeguimiento] = useState("");
  const [semestreFiltro, setSemestreFiltro] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const { progress: evaluationProgress, reload: reloadProgress } =
    useEvaluationProgress();

  const loadTeams = async () => {
    try {
      setLoadError(null);

      const response = await apiFetch(`${API_BASE}/juror/evaluation-tracking`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.status === 403) {
        setLoadError("No tienes permisos para ver el panel de seguimiento.");
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const payload = await response.json();
      const mappedTeams = extractArray(payload).map(mapTeamFromApi);

      setTeams(mappedTeams);
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error(error);
      setLoadError("No se pudo cargar el panel de seguimiento.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams();

    const interval = window.setInterval(() => {
      void loadTeams();
      void reloadProgress();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [reloadProgress]);

  const filteredBySemester = useMemo(() => {
    return teams.filter(
      (team) => semestreFiltro === "todos" || team.semester === semestreFiltro,
    );
  }, [teams, semestreFiltro]);

  const filteredTeams = useMemo(() => {
    const search = searchSeguimiento.trim().toLowerCase();

    if (!search) return filteredBySemester;

    return filteredBySemester.filter((team) => {
      const teamMatch =
        team.name.toLowerCase().includes(search) ||
        team.game.toLowerCase().includes(search) ||
        team.semester.toLowerCase().includes(search);

      const jurorMatch = team.jurados.some((jurado) =>
        jurado.name.toLowerCase().includes(search),
      );

      return teamMatch || jurorMatch;
    });
  }, [filteredBySemester, searchSeguimiento]);

  const completedTeams = filteredTeams.filter(
    (team) => getTeamEvaluationStatus(team) === "completed",
  );

  const progressTeams = filteredTeams.filter(
    (team) => getTeamEvaluationStatus(team) === "progress",
  );

  const pendingTeams = filteredTeams.filter(
    (team) => getTeamEvaluationStatus(team) === "pending",
  );

  const teamsWithoutJurors = filteredBySemester.filter(
    (team) => team.jurados.length === 0,
  );

  const incompleteAssignments = filteredBySemester.filter(
    (team) =>
      team.jurados.length > 0 && team.jurados.length < team.requiredJurados,
  );

  const semesters = Array.from(
    new Set(teams.map((team) => team.semester)),
  ).sort();

  const renderTeamCard = (
    team: Team,
    status: "completed" | "progress" | "pending",
  ) => {
    const received = team.evaluacionesRecibidas ?? 0;
    const required = team.evaluacionesRequeridas ?? team.requiredJurados;

    const statusStyles = {
      completed: {
        card: "border-green-500/40",
        badge: "bg-green-500/10 text-green-500 border-green-500/30",
        label: "Completado",
      },
      progress: {
        card: "border-yellow-500/40",
        badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
        label: "En progreso",
      },
      pending: {
        card: "border-red-500/40",
        badge: "bg-red-500/10 text-red-500 border-red-500/30",
        label: "Pendiente",
      },
    };

    const styles = statusStyles[status];

    return (
      <div
        key={team.id}
        className={`bg-card border ${styles.card} rounded-2xl p-4 md:p-6 transition-all`}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-medium truncate">
              {team.game}
            </h3>

            <p className="text-muted-foreground text-sm truncate">
              Equipo: {team.name}
            </p>

            <p className="text-xs text-muted-foreground truncate">
              {team.semester}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full border bg-muted text-xs">
              {received}/{required} evaluaciones
            </span>

            <span className="inline-block px-3 py-1 rounded-full border bg-muted text-xs">
              {team.jurados.length}/{team.requiredJurados} jurados
            </span>

            <span
              className={`inline-block px-3 py-1 rounded-full border text-xs ${styles.badge}`}
            >
              {styles.label}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs md:text-sm mb-3 text-muted-foreground">
            Jurados asignados
          </h4>

          {team.jurados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
              {team.jurados.map((jurado) => {
                const typeLabel = normalizeJurorType(jurado);
                const isOfficial = typeLabel === "Oficial";

                return (
                  <div
                    key={jurado.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isOfficial
                        ? "border-blue-500/30 bg-card"
                        : "border-amber-500/30 bg-card"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-border bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {getInitials(jurado.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs md:text-sm font-medium truncate">
                        {jurado.name}
                      </div>

                      <div
                        className={`text-xs ${
                          isOfficial ? "text-blue-500" : "text-amber-500"
                        }`}
                      >
                        {typeLabel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-yellow-500 text-sm">
              No hay jurados asignados a este equipo.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 z-20" />

            <nav aria-label="breadcrumb">
              <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5">
                <li className="items-center gap-1.5 hidden md:block">
                  <Link
                    to="/inicio"
                    className="hover:text-foreground transition-colors"
                  >
                    Inicio
                  </Link>
                </li>

                <li
                  role="presentation"
                  aria-hidden="true"
                  className="hidden md:inline"
                >
                  <ChevronRight className="size-3.5" />
                </li>

                <li className="inline-flex items-center gap-1.5">
                  <span className="text-foreground">Panel de Seguimiento</span>
                </li>
              </ol>
            </nav>
          </div>
        </header>

        <div className="bg-background text-foreground min-h-screen p-4">
          <div className="px-4 py-2">
            <div className="max-w-7xl">
              <div className="mb-8">
                <h1 className="text-xl font-medium mb-2">
                  Panel de Seguimiento
                </h1>

                <p className="text-muted-foreground mb-6 text-sm md:text-base">
                  Monitorea el estado de las evaluaciones de todos los equipos
                  en tiempo real para identificar equipos pendientes, equipos
                  sin jurados o jurados con evaluaciones por completar durante
                  la feria.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => void loadTeams()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 md:px-6 py-2 md:py-3 text-sm md:text-base disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Actualizar
                  </button>

                  {lastUpdatedAt && (
                    <p className="text-muted-foreground text-xs">
                      Última actualización:{" "}
                      {lastUpdatedAt.toLocaleTimeString("es-CO")}
                    </p>
                  )}
                </div>
              </div>

              {loadError && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-card p-4 text-sm text-red-500">
                  {loadError}
                </div>
              )}

              <div className="mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />

                    <input
                      type="text"
                      placeholder="Buscar por equipo, videojuego o jurado..."
                      value={searchSeguimiento}
                      onChange={(event) =>
                        setSearchSeguimiento(event.target.value)
                      }
                      className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 rounded-lg border border-border bg-card text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <select
                    value={semestreFiltro}
                    onChange={(event) => setSemestreFiltro(event.target.value)}
                    className="px-4 py-2 md:py-3 rounded-lg border border-border bg-card text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer min-w-[200px]"
                  >
                    <option value="todos">Todos los semestres</option>

                    {semesters.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                  <div className="text-muted-foreground text-xs mb-1">
                    Total equipos
                  </div>

                  <div className="text-xl md:text-2xl">
                    {filteredBySemester.length}
                  </div>
                </div>

                <div className="bg-card border border-green-500/30 rounded-xl p-3 md:p-4">
                  <div className="text-green-500 text-xs mb-1">Completados</div>

                  <div className="text-xl md:text-2xl">
                    {completedTeams.length}
                  </div>
                </div>

                <div className="bg-card border border-yellow-500/30 rounded-xl p-3 md:p-4">
                  <div className="text-yellow-500 text-xs mb-1">
                    En progreso
                  </div>

                  <div className="text-xl md:text-2xl">
                    {progressTeams.length}
                  </div>
                </div>

                <div className="bg-card border border-red-500/30 rounded-xl p-3 md:p-4">
                  <div className="text-red-500 text-xs mb-1">Pendientes</div>

                  <div className="text-xl md:text-2xl">
                    {pendingTeams.length}
                  </div>
                </div>

                <div className="bg-card border border-orange-500/30 rounded-xl p-3 md:p-4">
                  <div className="text-orange-500 text-xs mb-1">
                    Sin jurados
                  </div>

                  <div className="text-xl md:text-2xl">
                    {teamsWithoutJurors.length}
                  </div>
                </div>
              </div>

              {evaluationProgress && (
                <div className="bg-card border border-border rounded-xl p-3 md:p-4 mb-6 md:mb-8">
                  <div className="text-muted-foreground text-xs mb-1">
                    Progreso de evaluación
                  </div>
                  <div className="text-xl md:text-2xl">
                    {evaluationProgress.completed} / {evaluationProgress.assigned}
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage(evaluationProgress)}%` }}
                    />
                  </div>
                </div>
              )}

              {incompleteAssignments.length > 0 && (
                <div className="mb-8 rounded-xl border border-orange-500/40 bg-card p-4 text-sm text-orange-500">
                  Hay {incompleteAssignments.length} equipo(s) con asignaciones
                  incompletas.
                </div>
              )}

              {isLoading ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  Cargando panel de seguimiento...
                </div>
              ) : (
                <div className="space-y-8">
                  {completedTeams.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl text-green-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Completados ({completedTeams.length})
                      </h3>

                      <div className="space-y-3 md:space-y-4">
                        {completedTeams.map((team) =>
                          renderTeamCard(team, "completed"),
                        )}
                      </div>
                    </div>
                  )}

                  {progressTeams.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl text-yellow-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                        En progreso ({progressTeams.length})
                      </h3>

                      <div className="space-y-3 md:space-y-4">
                        {progressTeams.map((team) =>
                          renderTeamCard(team, "progress"),
                        )}
                      </div>
                    </div>
                  )}

                  {pendingTeams.length > 0 && (
                    <div>
                      <h3 className="text-lg md:text-xl text-red-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        Pendientes ({pendingTeams.length})
                      </h3>

                      <div className="space-y-3 md:space-y-4">
                        {pendingTeams.map((team) =>
                          renderTeamCard(team, "pending"),
                        )}
                      </div>
                    </div>
                  )}

                  {filteredTeams.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                      No se encontraron equipos con los filtros seleccionados.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
