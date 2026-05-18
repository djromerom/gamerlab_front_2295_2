"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserX,
  UserPlus,
  Shield,
  AlertTriangle,
  ChevronRight,
  Download,
  MoreVertical,
  History,
  Eye,
  X,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import LayoutAplication from "@/layouts/LayoutAplication";

const API_BASE = import.meta.env.VITE_ENDPOINT_BACKEND;
type JurorType = "OFFICIAL" | "BACKUP";
type JurorCategory = "JUNIOR" | "SENIOR";
type DashboardFilter =
  | "todos"
  | "oficiales"
  | "remanentes"
  | "asignados"
  | "equipos-ok"
  | "remanentes-uso";

type AssignmentAuditAction =
  | "ASSIGN"
  | "UNASSIGN"
  | "REASSIGN"
  | "UNASSIGN_ALL"
  | "UNASSIGN_ALL_FROM_EVALUATOR";

interface Jurado {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatar: string;
  tipo: JurorType | null;
  jurorCategory?: JurorCategory | null;
  lastSignInAt?: string;
  confirmationStatusId?: number | null;
  evaluatedCount: number;
  evaluatedGameNames: string[];
  unevaluatedCount: number;
  unevaluatedGameNames: string[];
}

interface Team {
  id: number;
  name: string;
  game: string;
  semester: string;
  level?: number | null;
  leaderName: string;
  leaderEmail: string;
  jurados: Jurado[];
  requiredJurados: number;
}

interface AssignmentAuditLog {
  id?: number | string;
  action?: AssignmentAuditAction | string;
  teamId?: number | string | null;
  jurorId?: string | null;
  previousJurorId?: string | null;
  newJurorId?: string | null;
  actorUserId?: string | null;
  notes?: string | null;
  createdAt?: string;
  creado_en?: string;
  timestamp?: string;
}

interface CurrentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

let isRefreshingToken = false;
let refreshTokenPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error refrescando token:", error);
    return false;
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Cache-Control", "no-cache");
  headers.set("Pragma", "no-cache");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && retryOnUnauthorized) {
    if (!isRefreshingToken) {
      isRefreshingToken = true;
      refreshTokenPromise = refreshAccessToken().finally(() => {
        isRefreshingToken = false;
      });
    }

    const refreshOk = await refreshTokenPromise;

    if (!refreshOk) {
      throw new Error("Sesión expirada. No se pudo refrescar el token.");
    }

    return apiRequest<T>(path, options, false);
  }

  const rawText = await response.text();
  let parsedBody: unknown = null;

  if (rawText) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof parsedBody === "string"
        ? parsedBody
        : (parsedBody as { message?: string })?.message ||
        `Error ${response.status}`;

    throw new Error(errorMessage);
  }

  if (!rawText) {
    return null as T;
  }

  return parsedBody as T;
}

function extractArray(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.rows)) return obj.rows;
    if (Array.isArray(obj.jurors)) return obj.jurors;
    if (Array.isArray(obj.jurados)) return obj.jurados;
    if (Array.isArray(obj.teams)) return obj.teams;
    if (Array.isArray(obj.logs)) return obj.logs;
  }

  return [];
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function buildFullName(firstName: string, lastName: string, email: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || email || "Sin nombre";
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(""),
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value?: string): string {
  if (!value) return "Sin registro";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getAssignmentKey(teamId: number, jurorId: string): string {
  return `${teamId}-${jurorId}`;
}

function normalizeJurorCategory(value: unknown): JurorCategory | null {
  return value === "JUNIOR" || value === "SENIOR" ? value : null;
}

function normalizeJurorType(value: unknown): JurorType | null {
  if (value === "OFFICIAL" || value === "BACKUP") return value;
  if (value === "OFFICIAL") return "OFFICIAL";
  if (value === "BACKUP") return "BACKUP";
  return null;
}

function getJurorTypeLabel(value?: JurorType | null): string {
  if (value === "OFFICIAL") return "Oficial";
  if (value === "BACKUP") return "Remanente";
  return "Sin tipo";
}

function getJurorCategoryLabel(value?: JurorCategory | null): string {
  if (value === "JUNIOR") return "Junior";
  if (value === "SENIOR") return "Senior";
  return "Sin categoría";
}

function getPersonDisplayName(person?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null): string {
  if (!person) return "N/A";
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || person.email || "N/A";
}

function normalizeAuditAction(value?: string): string {
  const labels: Record<string, string> = {
    ASSIGN: "Asignación",
    UNASSIGN: "Desasignación",
    REASSIGN: "Reasignación",
    UNASSIGN_ALL: "Limpieza total",
    UNASSIGN_ALL_FROM_EVALUATOR: "Limpieza por jurado",
  };

  return value ? labels[value] ?? value : "Sin acción";
}

function getFilterLabel(filter: DashboardFilter): string {
  const labels: Record<DashboardFilter, string> = {
    todos: "Todos",
    oficiales: "Oficiales disponibles",
    remanentes: "Remanentes disponibles",
    asignados: "Equipos con jurados asignados",
    "equipos-ok": "Equipos completos",
    "remanentes-uso": "Equipos con remanentes en uso",
  };

  return labels[filter];
}

function isColegioTeam(team: Team): boolean {
  const normalizedSemester = team.semester.toLowerCase();
  const normalizedName = team.name.toLowerCase();
  const normalizedGame = team.game.toLowerCase();

  return (
    team.level === 0 ||
    normalizedSemester.includes("colegio") ||
    normalizedSemester.includes("n0") ||
    normalizedName.includes("colegio") ||
    normalizedGame.includes("colegio")
  );
}

function canAssignJurorToTeam(jurado: Jurado, team: Team): boolean {
  if (!jurado.jurorCategory) return false;

  if (isColegioTeam(team) && jurado.jurorCategory === "JUNIOR") {
    return false;
  }

  return true;
}

function mapJurorFromApi(raw: any, previousJurados: Jurado[]): Jurado {
  const firstName = safeString(raw.firstName ?? raw.name ?? raw.fullName);
  const lastName = safeString(raw.lastName);
  const email = safeString(raw.email ?? raw.correo);
  const id = String(raw.id ?? raw.id_usuario ?? email ?? firstName);
  const existing = previousJurados.find(
    (j) => j.id === id || j.email === email
  );

  const fallbackName = safeString(raw.nombre ?? raw.name ?? raw.fullName);
  const split = !firstName && fallbackName ? splitName(fallbackName) : null;

  const resolvedFirstName = firstName || split?.firstName || "";
  const resolvedLastName = lastName || split?.lastName || "";
  const name = buildFullName(resolvedFirstName, resolvedLastName, email);

  return {
    id,
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    name,
    email,
    avatar:
      existing?.avatar ??
      safeString(raw.avatar ?? raw.photoUrl ?? raw.profilePicture, ""),
    tipo:
      normalizeJurorType(raw.jurorType) ??
      normalizeJurorType(raw.tipo_jurado) ??
      normalizeJurorType(raw.tipo) ??
      existing?.tipo ??
      null,
    jurorCategory:
      normalizeJurorCategory(raw.jurorCategory) ??
      normalizeJurorCategory(raw.categoria_jurado) ??
      existing?.jurorCategory ??
      null,
    lastSignInAt:
      safeString(raw.lastSignInAt ?? raw.lastLogin ?? raw.lastSeen, "") ||
      undefined,
    confirmationStatusId:
      typeof raw.confirmationStatusId === "number"
        ? raw.confirmationStatusId
        : existing?.confirmationStatusId ?? null,
    evaluatedCount: safeNumber(raw.evaluatedCount, 0),
    evaluatedGameNames: Array.isArray(raw.evaluatedGameNames)
      ? raw.evaluatedGameNames.map((item) => String(item))
      : [],
    unevaluatedCount: safeNumber(raw.unevaluatedCount, 0),
    unevaluatedGameNames: Array.isArray(raw.unevaluatedGameNames)
      ? raw.unevaluatedGameNames.map((item) => String(item))
      : [],
  };
}

function mapTeamAssignedJuror(
  rawAssignedJuror: any,
  allJurados: Jurado[],
  previousTeams: Team[],
  teamId: number
): Jurado {
  const assignedId = String(
    rawAssignedJuror.id ?? rawAssignedJuror.jurorId ?? rawAssignedJuror.userId ?? ""
  );
  const assignedName = safeString(
    rawAssignedJuror.nombre ?? rawAssignedJuror.name ?? rawAssignedJuror.fullName
  );
  const assignedEmail = safeString(rawAssignedJuror.email ?? rawAssignedJuror.correo);

  const fromGlobal =
    allJurados.find((jurado) => jurado.id === assignedId) ??
    allJurados.find((jurado) => jurado.email === assignedEmail);

  const fromPrevious =
    previousTeams
      .find((team) => team.id === teamId)
      ?.jurados.find((jurado) => jurado.id === assignedId) ?? null;

  if (fromPrevious) {
    return { ...fromPrevious };
  }

  if (fromGlobal) {
    return {
      ...fromGlobal,
    };
  }

  const split = splitName(assignedName);

  return {
    id: assignedId || assignedEmail || assignedName,
    firstName: split.firstName,
    lastName: split.lastName,
    name: assignedName || assignedEmail || "Jurado",
    email: assignedEmail,
    avatar: "",
    tipo:
      normalizeJurorType(rawAssignedJuror.jurorType) ??
      normalizeJurorType(rawAssignedJuror.tipo_jurado) ??
      normalizeJurorType(rawAssignedJuror.tipo) ??
      null,
    jurorCategory:
      normalizeJurorCategory(rawAssignedJuror.jurorCategory) ??
      normalizeJurorCategory(rawAssignedJuror.categoria_jurado) ??
      normalizeJurorCategory(rawAssignedJuror.categoria),
    evaluatedCount: 0,
    evaluatedGameNames: [],
    unevaluatedCount: 0,
    unevaluatedGameNames: [],
  };
}

function mapTeamFromApi(raw: any, allJurados: Jurado[], previousTeams: Team[]): Team {
  const rawAssigned = extractArray(
    raw.juradosAsignados ??
    raw.jurados ??
    raw.assignedJurors ??
    raw.jurors ??
    raw.assigned_jurors ??
    []
  );

  const leader =
    raw.lider ??
    raw.leader ??
    raw.teamLeader ??
    raw.captain ??
    raw.team_owner ??
    {};

  const teamId = Number(raw.id ?? raw.teamId ?? raw.teamIdNumber ?? raw.id_equipo ?? 0);
  const level = parseOptionalNumber(raw.level ?? raw.nivel ?? raw.teamLevel);

  const mappedJurados = rawAssigned.map((item) =>
    mapTeamAssignedJuror(item, allJurados, previousTeams, teamId)
  );

  return {
    id: teamId,
    name: safeString(raw.nombre ?? raw.name ?? raw.teamName ?? raw.equipo, "Equipo sin nombre"),
    game: safeString(
      raw.videojuego ??
      raw.game ??
      raw.gameName ??
      raw.videogameName ??
      raw.videogame?.name ??
      raw.projectName,
      "Sin videojuego"
    ),
    semester: safeString(
      raw.semester ?? raw.level ?? raw.nivel ?? raw.course ?? "Sin semestre"
    ),
    level,
    leaderName: safeString(
      leader.nombre ?? leader.name ?? leader.fullName,
      "Sin líder"
    ),
    leaderEmail: safeString(leader.email ?? leader.correo, ""),
    jurados: mappedJurados,
    requiredJurados: safeNumber(
      raw.requiredJurados ?? raw.requiredJurors ?? raw.jurorSlots,
      3
    ),
  };
}

export function JuradosAssignment() {
  const [jurados, setJurados] = useState<Jurado[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showJuradoModal, setShowJuradoModal] = useState(false);
  const [showJuradosListModal, setShowJuradosListModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showAllTeamsModal, setShowAllTeamsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AssignmentAuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jurorSearch, setJurorSearch] = useState("");
  const [openJurorMenuId, setOpenJurorMenuId] = useState<string | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>("todos");
  const [reassignContext, setReassignContext] = useState<{
    teamId: number;
    currentJurorId: string;
    currentJurorName: string;
  } | null>(null);

  const [showCreateJurorModal, setShowCreateJurorModal] = useState(false);
  const [showEditJurorModal, setShowEditJurorModal] = useState(false);
  const [showStatsMobile, setShowStatsMobile] = useState(false);
  const [showUsoRapidoMobile, setShowUsoRapidoMobile] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [editingJuror, setEditingJuror] = useState<Jurado | null>(null);

  const [createJurorForm, setCreateJurorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jurorCategory: "" as "" | JurorCategory,
    tipo: "" as "" | JurorType,
  });

  const [editJurorForm, setEditJurorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jurorCategory: "" as "" | JurorCategory,
    tipo: "" as "" | JurorType,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [jurorsResponse, teamsResponse, meResponse] = await Promise.all([
        apiRequest<any>("/juror?includeInactive=false&limit=100&page=1", {
          method: "GET",
        }),
        apiRequest<any>("/juror/evaluation-tracking", {
          method: "GET",
        }),
        apiRequest<any>("/auth/me", { method: "GET" }).catch(() => null),
      ]);

      const incomingJurors = extractArray(jurorsResponse).map((raw) =>
        mapJurorFromApi(raw, jurados)
      );

      const incomingTeams = extractArray(teamsResponse).map((raw) =>
        mapTeamFromApi(raw, incomingJurors, teams)
      );

      setJurados(incomingJurors);
      setTeams(incomingTeams);
      if (meResponse) {
        setCurrentUser({
          id: String(meResponse.id ?? ""),
          firstName: safeString(meResponse.firstName),
          lastName: safeString(meResponse.lastName),
          email: safeString(meResponse.email),
        });
      }
    } catch (error) {
      console.error(error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Bloquear scroll de la página cuando algún modal esté abierto
  useEffect(() => {
    const isAnyModalOpen =
      showJuradoModal ||
      showJuradosListModal ||
      showAuditModal ||
      showAllTeamsModal ||
      showCreateJurorModal ||
      showEditJurorModal;

    if (isAnyModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [
    showJuradoModal,
    showJuradosListModal,
    showAuditModal,
    showAllTeamsModal,
    showCreateJurorModal,
    showEditJurorModal,
  ]);

  // Cerrar el tooltip de ayuda al hacer scroll o después de 20 segundos
  useEffect(() => {
    if (!showHelpTooltip) return;

    // Temporizador de 20 segundos
    const timer = setTimeout(() => {
      setShowHelpTooltip(false);
    }, 6500);

    // Evento de scroll para cerrar el tooltip
    const handleScroll = () => {
      setShowHelpTooltip(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showHelpTooltip]);

  const getJuradosDisponibles = (tipo?: JurorType) => {
    return jurados.filter((jurado) => {
      const usable = Boolean(jurado.jurorCategory) && Boolean(jurado.tipo);

      if (tipo) {
        return usable && jurado.tipo === tipo;
      }

      return usable;
    });
  };

  const juradosOficialesDisponibles = useMemo(
    () => getJuradosDisponibles("OFFICIAL"),
    [jurados, teams]
  );

  const juradosRemanentesDisponibles = useMemo(
    () => getJuradosDisponibles("BACKUP"),
    [jurados, teams]
  );

  const totalAsignados = useMemo(
    () => teams.reduce((sum, team) => sum + team.jurados.length, 0),
    [teams]
  );

  const totalRequeridos = useMemo(
    () => teams.reduce((sum, team) => sum + team.requiredJurados, 0),
    [teams]
  );

  const equiposCompletos = useMemo(
    () => teams.filter((team) => team.jurados.length >= team.requiredJurados).length,
    [teams]
  );

  const remanentesEnUso = useMemo(
    () =>
      teams.flatMap((team) => team.jurados).filter((jurado) => jurado.tipo === "BACKUP")
        .length,
    [teams]
  );


  const filteredTeams = useMemo(() => {
    if (dashboardFilter === "todos") return teams;

    if (dashboardFilter === "asignados") {
      return teams.filter((team) => team.jurados.length > 0);
    }

    if (dashboardFilter === "equipos-ok") {
      return teams.filter((team) => team.jurados.length >= team.requiredJurados);
    }

    if (dashboardFilter === "remanentes-uso") {
      return teams.filter((team) =>
        team.jurados.some((jurado) => jurado.tipo === "BACKUP")
      );
    }

    return teams;
  }, [teams, dashboardFilter]);

  const juradosFiltrados = useMemo(() => {
    const term = jurorSearch.trim().toLowerCase();

    return jurados.filter((jurado) => {
      const matchesTerm =
        !term ||
        jurado.name.toLowerCase().includes(term) ||
        jurado.email.toLowerCase().includes(term);

      const matchesDashboard =
        dashboardFilter === "todos" ||
        (dashboardFilter === "oficiales" && jurado.tipo === "OFFICIAL") ||
        (dashboardFilter === "remanentes" && jurado.tipo === "BACKUP") ||
        !["oficiales", "remanentes"].includes(dashboardFilter);

      return matchesTerm && matchesDashboard;
    });
  }, [jurados, jurorSearch, dashboardFilter]);

  const juradosDisponiblesParaModal = useMemo(() => {
    if (!selectedTeam) return [];

    const teamAssignedIds = new Set(selectedTeam.jurados.map((jurado) => jurado.id));

    return jurados.filter((jurado) => {
      const alreadyInThisTeam = teamAssignedIds.has(jurado.id);

      return (
        !alreadyInThisTeam &&
        Boolean(jurado.jurorCategory) &&
        Boolean(jurado.tipo) &&
        canAssignJurorToTeam(jurado, selectedTeam)
      );
    });
  }, [jurados, selectedTeam]);

  const openJuradoModal = (
    team: Team,
    _esAuxiliar = false,
    reassignData?: {
      currentJurorId: string;
      currentJurorName: string;
    }
  ) => {
    setSelectedTeam(team);

    if (reassignData) {
      setReassignContext({
        teamId: team.id,
        currentJurorId: reassignData.currentJurorId,
        currentJurorName: reassignData.currentJurorName,
      });
    } else {
      setReassignContext(null);
    }

    setShowJuradoModal(true);
  };

  const closeJuradoModal = () => {
    setSelectedTeam(null);
    setReassignContext(null);
    setShowJuradoModal(false);
  };

  const addJuradoToTeam = async (teamId: number, jurado: Jurado) => {
    try {
      setIsSubmitting(true);

      await apiRequest("/juror/assignments", {
        method: "POST",
        body: JSON.stringify({
          teamId,
          jurorId: jurado.id,
        }),
      });

      await loadData();
      closeJuradoModal();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo asignar el jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reassignJuradoOnTeam = async (
    teamId: number,
    currentJurorId: string,
    newJuror: Jurado
  ) => {
    try {
      setIsSubmitting(true);

      await apiRequest("/juror/assignments/reassign", {
        method: "PATCH",
        body: JSON.stringify({
          teamId,
          currentJurorId,
          newJurorId: newJuror.id,
        }),
      });

      await loadData();
      closeJuradoModal();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo reasignar el jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeJuradoFromTeam = async (teamId: number, jurorId: string) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas desasignar este jurado del equipo?"
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await apiRequest("/juror/assignments", {
        method: "DELETE",
        body: JSON.stringify({
          teamId,
          jurorId,
        }),
      });

      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo desasignar el jurado del equipo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAllAssignments = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar todas las asignaciones manuales?"
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await apiRequest("/juror/assignments/all", {
        method: "DELETE",
      });

      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudieron limpiar las asignaciones."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      setIsSubmitting(true);

      const response = await apiRequest<any>(
        "/juror/assignments/audit?page=1&limit=20",
        { method: "GET" }
      );

      setAuditLogs(extractArray(response) as AssignmentAuditLog[]);
      setShowAuditModal(true);
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el historial de cambios."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportJurorsToCsv = () => {
    const headers = [
      "Nombres",
      "Apellidos",
      "Nombre completo",
      "Correo",
      "Tipo operativo",
      "Categoría",
      "Último ingreso",
      "Evaluados",
      "Pendientes",
    ];

    const rows = jurados.map((jurado) => [
      jurado.firstName,
      jurado.lastName,
      jurado.name,
      jurado.email,
      getJurorTypeLabel(jurado.tipo),
      getJurorCategoryLabel(jurado.jurorCategory),
      formatDate(jurado.lastSignInAt),
      jurado.evaluatedGameNames.join(" | "),
      jurado.unevaluatedGameNames.join(" | "),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jurados.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenCreateJuror = () => {
    setCreateJurorForm({
      firstName: "",
      lastName: "",
      email: "",
      jurorCategory: "",
      tipo: "",
    });
    setOpenJurorMenuId(null);
    setShowCreateJurorModal(true);
  };

  const handleCreateJurorSubmit = async () => {
    if (
      !createJurorForm.firstName.trim() ||
      !createJurorForm.lastName.trim() ||
      !createJurorForm.email.trim() ||
      !createJurorForm.jurorCategory ||
      !createJurorForm.tipo
    ) {
      window.alert("Debes completar nombres, apellidos, correo electrónico, categoría y tipo de jurado.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest<any>("/juror", {
        method: "POST",
        body: JSON.stringify({
          firstName: createJurorForm.firstName.trim(),
          lastName: createJurorForm.lastName.trim(),
          email: createJurorForm.email.trim(),
          jurorCategory: createJurorForm.jurorCategory,
          jurorType: createJurorForm.tipo,
        }),
      });

      setShowCreateJurorModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo crear el jurado. Si aparece en la lista, el error puede estar relacionado con el envío del correo de confirmación."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJuror = (jurado: Jurado) => {
    setOpenJurorMenuId(null);
    setEditingJuror(jurado);
    setEditJurorForm({
      firstName: jurado.firstName,
      lastName: jurado.lastName,
      email: jurado.email,
      jurorCategory: jurado.jurorCategory ?? "",
      tipo: jurado.tipo ?? "",
    });
    setShowEditJurorModal(true);
  };

  const handleEditJurorSubmit = async () => {
    if (!editingJuror) return;

    if (
      !editJurorForm.firstName.trim() ||
      !editJurorForm.lastName.trim() ||
      !editJurorForm.jurorCategory ||
      !editJurorForm.tipo
    ) {
      window.alert("Debes completar nombres, apellidos, categoría y tipo de jurado.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest(`/juror/${editingJuror.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: editJurorForm.firstName.trim(),
          lastName: editJurorForm.lastName.trim(),
          jurorCategory: editJurorForm.jurorCategory,
          jurorType: editJurorForm.tipo,
        }),
      });

      setShowEditJurorModal(false);
      setEditingJuror(null);
      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async (email: string) => {
    try {
      setIsSubmitting(true);
      setOpenJurorMenuId(null);

      await apiRequest("/juror/resend-confirmation", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      window.alert("Correo reenviado correctamente.");
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo reenviar el correo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTeamsFromJuror = async (jurorId: string, jurorName: string) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas quitar todos los equipos asignados a ${jurorName}?`
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setOpenJurorMenuId(null);

      await apiRequest(`/juror/${jurorId}/assignments`, {
        method: "DELETE",
      });

      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudieron quitar los equipos del jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJuror = async (jurorId: string, jurorName: string) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${jurorName}?`
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setOpenJurorMenuId(null);

      await apiRequest(`/juror/${jurorId}`, {
        method: "DELETE",
      });

      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error ? error.message : "No se pudo eliminar el jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleJurorType = async (jurado: Jurado) => {
    if (!jurado.tipo) {
      window.alert("Este jurado no tiene tipo operativo asignado.");
      return;
    }

    const nextTipo: JurorType = jurado.tipo === "OFFICIAL" ? "BACKUP" : "OFFICIAL";

    try {
      setIsSubmitting(true);
      setOpenJurorMenuId(null);

      await apiRequest(`/juror/${jurado.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          jurorType: nextTipo,
        }),
      });

      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el tipo operativo del jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const DashboardCard = ({
    label,
    value,
    detail,
    icon,
    onClick,
  }: {
    label: string;
    value: string | number;
    detail: string;
    icon?: any;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-card border border-border rounded-xl p-3 md:p-4 hover:bg-accent transition-colors w-full h-full flex flex-col justify-between gap-1.5"
    >
      <div className="w-full">
        <div className="text-xs mb-1 flex items-center gap-1 text-muted-foreground whitespace-nowrap">
          {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
          <span>{label}</span>
        </div>
        <div className="text-xl md:text-2xl font-semibold mt-0.5">{value}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-auto">{detail}</div>
    </button>
  );

  const getJurorNameById = (id?: string | null) => {
    if (!id) return "N/A";
    const jurado = jurados.find((item) => item.id === id);
    return jurado?.name || id;
  };

  const getTeamNameById = (id?: number | string | null) => {
    if (id === undefined || id === null) return "N/A";
    const numericId = Number(id);
    const team = teams.find((item) => item.id === numericId);
    return team ? `${team.name} (${team.game})` : String(id);
  };

  const getActorNameById = (id?: string | null) => {
    if (!id) return "N/A";
    if (currentUser?.id === id) return getPersonDisplayName(currentUser);
    const jurado = jurados.find((item) => item.id === id);
    return jurado?.name || id;
  };

  const breadcrumbs = [
    { label: "Asignación Manual de Jurados", href: "/jurados-assignment" },
  ];

  return (
    <LayoutAplication breadcrumbs={breadcrumbs}>
      <div className="bg-background text-foreground min-h-screen w-full py-6 px-4 md:px-6">
        <div className="flex items-center justify-between gap-4 mb-6 md:mb-8 w-full">
          <h1 className="text-xl font-medium text-foreground">
            Gestión Manual de Asignación de Jurados
          </h1>

          {/* Ícono de Ayuda con Tooltip Flotante Reactivo */}
          <div className="relative flex items-center">
            <HelpCircle
              onClick={() => setShowHelpTooltip(!showHelpTooltip)}
              className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-foreground cursor-pointer transition-colors"
              aria-label="Información de ayuda"
            />

            {showHelpTooltip && (
              <>
                {/* Backdrop invisible para cerrar al hacer clic afuera en móvil y escritorio */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHelpTooltip(false)}
                />

                {/* Tooltip flotante premium discreto */}
                <div className="absolute right-0 top-full mt-1.5 w-60 p-2.5 rounded-xl border border-border bg-popover text-popover-foreground text-[11px] shadow-lg z-50 animate-in fade-in duration-100">
                  <p className="leading-normal text-muted-foreground">
                    Administra la asignación manual durante la feria. Un jurado puede evaluar varios equipos, pero no puede repetirse dentro del mismo equipo.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Cargando información...
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-card p-4 text-sm text-red-500">
            {loadError}
          </div>
        )}

        <div className="w-full mb-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {/* Header del Uso Rápido (Alternancia en Móvil) */}
          <button
            type="button"
            onClick={() => setShowUsoRapidoMobile(!showUsoRapidoMobile)}
            className="w-full text-left font-medium text-foreground flex items-center justify-between outline-none focus:outline-none md:cursor-default"
          >
            <span>Uso rápido</span>
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 md:hidden ${showUsoRapidoMobile ? "rotate-90" : ""
                }`}
            />
          </button>

          {/* Contenido (Desplegable en móvil, siempre visible en desktop) */}
          <div className={`flex flex-col gap-2 mt-2 ${showUsoRapidoMobile ? "block" : "hidden"} md:block`}>
            <div>1. Selecciona un equipo y pulsa <span className="text-foreground font-medium">Agregar Jurado</span>.</div>
            <div>2. Elige un jurado disponible para ese equipo. Puede estar asignado a otros equipos.</div>
            <div>3. Usa <span className="text-foreground font-medium">Reasignar</span> o <span className="text-foreground font-medium">Quitar</span> para ajustar en tiempo real.</div>
          </div>
        </div>

        {/* Botón Desplegable de Métricas para Móviles */}
        <button
          type="button"
          onClick={() => setShowStatsMobile(!showStatsMobile)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-all mb-4 md:hidden"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">Ver Estadísticas y Métricas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
              {totalAsignados}/{totalRequeridos} asignados
            </span>
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showStatsMobile ? "rotate-90" : ""
                }`}
            />
          </div>
        </button>

        <div className={`w-full ${showStatsMobile ? "grid" : "hidden"} md:grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8`}>
          <DashboardCard
            label="Oficiales"
            value={juradosOficialesDisponibles.length}
            detail="ver disponibles"
            icon={<Shield className="w-3 h-3" />}
            onClick={() => {
              setDashboardFilter("oficiales");
              setShowJuradosListModal(true);
            }}
          />

          <DashboardCard
            label="Remanentes"
            value={juradosRemanentesDisponibles.length}
            detail="ver disponibles"
            icon={<AlertTriangle className="w-3 h-3 flex-shrink-0" />}
            onClick={() => {
              setDashboardFilter("remanentes");
              setShowJuradosListModal(true);
            }}
          />

          <DashboardCard
            label="Jurados asignados"
            value={`${totalAsignados}/${totalRequeridos}`}
            detail="cupos cubiertos"
            onClick={() => setDashboardFilter("asignados")}
          />

          <DashboardCard
            label="Equipos completos"
            value={`${equiposCompletos}/${teams.length}`}
            detail="con cupos cubiertos"
            onClick={() => setDashboardFilter("equipos-ok")}
          />

          <DashboardCard
            label="Remanentes en uso"
            value={remanentesEnUso}
            detail="asignados como respaldo"
            onClick={() => setDashboardFilter("remanentes-uso")}
          />

        </div>

        {dashboardFilter !== "todos" && (
          <div className="w-full mb-4 flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
            <span className="text-muted-foreground">
              Filtro activo: <span className="text-foreground font-medium">{getFilterLabel(dashboardFilter)}</span>
            </span>

            <button
              onClick={() => setDashboardFilter("todos")}
              className="rounded-md border px-3 py-1.5 hover:bg-accent"
            >
              Ver todos
            </button>
          </div>
        )}

        <div className="w-full grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          <button
            onClick={() => setShowJuradosListModal(true)}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Lista de jurados</span>
          </button>

          <button
            onClick={() => void loadAuditLog()}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span>Historial de cambios</span>
          </button>

          <button
            onClick={() => setShowAllTeamsModal(true)}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>Ver todos los equipos</span>
          </button>

          <button
            onClick={resetAllAssignments}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <UserX className="w-4 h-4 flex-shrink-0" />
            <span>Limpiar todo</span>
          </button>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <h2 className="text-xl md:text-2xl mb-4 md:mb-6 flex items-center gap-2">
              <Users className="w-6 md:w-7 h-6 md:h-7" />
              Equipos ({filteredTeams.length}/{teams.length})
            </h2>

            {filteredTeams.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                No hay equipos para este filtro.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {filteredTeams.map((team) => {
                  const isComplete = team.jurados.length >= team.requiredJurados;
                  const isEmpty = team.jurados.length === 0;
                  const hasRemanentes = team.jurados.some(
                    (jurado) => jurado.tipo === "BACKUP"
                  );

                  return (
                    <div
                      key={team.id}
                      className={`bg-card border rounded-2xl p-4 md:p-6 transition-all ${isComplete
                        ? hasRemanentes
                          ? "border-amber-500/50"
                          : "border-green-500/50"
                        : isEmpty
                          ? "border-red-500/30"
                          : "border-yellow-500/30"
                        }`}
                    >
                      <div className="mb-3 md:mb-4 pb-3 md:pb-4 border-b border-border">
                        <div className="flex items-start justify-between gap-2 mb-2">
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
                            <p className="text-xs text-muted-foreground truncate">
                              Líder: {team.leaderName}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 items-end flex-shrink-0">
                            <div className="px-2 md:px-3 py-1 rounded-full text-xs border bg-muted">
                              {team.jurados.length}/{team.requiredJurados}
                            </div>

                            {isColegioTeam(team) && (
                              <div className="px-2 py-1 rounded-full text-xs border border-blue-500/30 text-blue-500">
                                Colegio
                              </div>
                            )}

                            {hasRemanentes && (
                              <div className="px-2 py-1 rounded-full text-xs border border-amber-500/30 text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                <span className="hidden md:inline">
                                  Con remanentes
                                </span>
                                <span className="md:hidden">Remanente</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                        {team.jurados.map((jurado) => (
                          <div
                            key={getAssignmentKey(team.id, jurado.id)}
                            className={`border rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 group hover:border-primary/50 transition-all ${jurado.tipo === "OFFICIAL"
                              ? "bg-card border-blue-500/30"
                              : "bg-card border-amber-500/30"
                              }`}
                          >
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border flex items-center justify-center bg-muted text-xs md:text-sm font-medium flex-shrink-0">
                              {getInitials(jurado.name)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-xs md:text-sm font-medium truncate">
                                {jurado.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="hidden md:inline">
                                  {getJurorCategoryLabel(jurado.jurorCategory)} •{" "}
                                  {getJurorTypeLabel(jurado.tipo)}
                                </span>
                                <span className="md:hidden">
                                  {getJurorCategoryLabel(jurado.jurorCategory)} •{" "}
                                  {getJurorTypeLabel(jurado.tipo)}
                                </span>
                              </div>
                              <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                                {jurado.email}
                              </div>
                            </div>

                            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() =>
                                  openJuradoModal(team, false, {
                                    currentJurorId: jurado.id,
                                    currentJurorName: jurado.name,
                                  })
                                }
                                disabled={isSubmitting}
                                className="px-2 py-1.5 rounded-lg border hover:bg-accent transition-all disabled:opacity-50 text-[10px] md:text-xs"
                                title="Reasignar jurado"
                              >
                                Reasignar
                              </button>

                              <button
                                onClick={() => void removeJuradoFromTeam(team.id, jurado.id)}
                                disabled={isSubmitting}
                                className="px-2 py-1.5 rounded-lg border hover:bg-accent transition-all disabled:opacity-50 text-[10px] md:text-xs"
                                title="Desasignar jurado"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ))}

                        {Array.from({
                          length: Math.max(
                            0,
                            team.requiredJurados - team.jurados.length
                          ),
                        }).map((_, idx) => (
                          <button
                            key={`empty-${team.id}-${idx}`}
                            onClick={() => openJuradoModal(team, false)}
                            disabled={isSubmitting}
                            className="w-full h-12 md:h-16 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-accent/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                          >
                            <UserPlus className="w-4 md:w-5 h-4 md:h-5" />
                            <span className="hidden md:inline">Agregar Jurado</span>
                            <span className="md:hidden">Agregar</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4 md:space-y-6 order-1 lg:order-2">
            <div>
              <h3 className="text-base md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span>Jurados Oficiales</span>
              </h3>

              <div className="bg-card border border-border rounded-xl p-3 mb-3">
                <p className="text-xs text-muted-foreground">
                  Disponibles:{" "}
                  <span className="font-bold text-lg text-foreground">
                    {juradosOficialesDisponibles.length}
                  </span>
                </p>
              </div>

              <div className="space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {juradosOficialesDisponibles.map((jurado) => (
                  <div
                    key={jurado.id}
                    className="bg-card border border-border rounded-xl p-2 md:p-3 transition-all"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-border flex items-center justify-center bg-muted text-xs font-medium">
                        {getInitials(jurado.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-medium truncate">
                          {jurado.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getJurorCategoryLabel(jurado.jurorCategory)} • {getJurorTypeLabel(jurado.tipo)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {juradosOficialesDisponibles.length === 0 && (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No hay jurados oficiales disponibles
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base md:text-xl mb-3 md:mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>Jurados Remanentes</span>
              </h3>

              <div className="bg-card border border-border rounded-xl p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Disponibles:{" "}
                  <span className="font-bold text-lg text-foreground">
                    {juradosRemanentesDisponibles.length}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Úsalos solo si un oficial no llega
                </p>
              </div>

              <div className="space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {juradosRemanentesDisponibles.map((jurado) => (
                  <div
                    key={jurado.id}
                    className="bg-card border border-border rounded-xl p-2 md:p-3 transition-all"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-border flex items-center justify-center bg-muted text-xs font-medium">
                        {getInitials(jurado.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-medium truncate">
                          {jurado.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getJurorCategoryLabel(jurado.jurorCategory)} • {getJurorTypeLabel(jurado.tipo)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {juradosRemanentesDisponibles.length === 0 && (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No hay jurados remanentes disponibles
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showJuradosListModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
                <div>
                  <h2 className="text-lg md:text-xl font-medium">
                    Lista de Jurados
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Gestión completa de jurados registrados
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowJuradosListModal(false);
                    setOpenJurorMenuId(null);
                  }}
                  className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-6">
                <div className="mb-4">
                  <input
                    type="text"
                    value={jurorSearch}
                    onChange={(e) => setJurorSearch(e.target.value)}
                    placeholder="Buscar jurado por nombre o correo"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={exportJurorsToCsv}
                    disabled={isSubmitting}
                    className="h-16 w-20 rounded-2xl border border-border bg-card hover:bg-accent flex items-center justify-center disabled:opacity-50"
                    title="Descargar"
                  >
                    <Download className="w-6 h-6" />
                  </button>

                  <button
                    onClick={handleOpenCreateJuror}
                    disabled={isSubmitting}
                    className="h-16 px-6 rounded-2xl border border-border bg-card hover:bg-accent flex items-center justify-center gap-3 disabled:opacity-50"
                    title="Agregar jurado"
                  >
                    <UserPlus className="w-6 h-6" />
                  </button>
                </div>

                <div className="max-h-[58vh] overflow-y-auto space-y-3 pr-1">
                  {juradosFiltrados.map((jurado) => (
                    <div
                      key={jurado.id}
                      className="relative rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center bg-muted text-sm font-medium flex-shrink-0">
                          {getInitials(jurado.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{jurado.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {jurado.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Último ingreso: {formatDate(jurado.lastSignInAt)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Tipo: {getJurorTypeLabel(jurado.tipo)} · Categoría: {getJurorCategoryLabel(jurado.jurorCategory)}
                          </div>

                          {!jurado.jurorCategory && (
                            <div className="mt-2 rounded-lg border border-yellow-500/30 px-3 py-2 text-xs text-yellow-600">
                              Este jurado no puede asignarse hasta tener categoría JUNIOR/SENIOR.
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border p-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                Evaluados
                              </div>
                              <div className="text-lg font-medium">
                                {jurado.evaluatedCount}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 break-words">
                                {jurado.evaluatedGameNames.length > 0
                                  ? jurado.evaluatedGameNames.join(", ")
                                  : "Sin videojuegos evaluados"}
                              </div>
                            </div>

                            <div className="rounded-xl border border-border p-3">
                              <div className="text-xs text-muted-foreground mb-1">
                                Pendientes
                              </div>
                              <div className="text-lg font-medium">
                                {jurado.unevaluatedCount}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 break-words">
                                {jurado.unevaluatedGameNames.length > 0
                                  ? jurado.unevaluatedGameNames.join(", ")
                                  : "Sin pendientes"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenJurorMenuId((prev) =>
                                prev === jurado.id ? null : jurado.id
                              )
                            }
                            className="h-10 w-10 rounded-xl border border-border hover:bg-accent flex items-center justify-center"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openJurorMenuId === jurado.id && (
                            <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-border bg-background shadow-xl p-2">
                              <button
                                onClick={() => handleEditJuror(jurado)}
                                className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                              >
                                Editar
                              </button>

                              <button
                                onClick={() => void handleResendConfirmation(jurado.email)}
                                className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                              >
                                Reenviar correo
                              </button>

                              <button
                                onClick={() =>
                                  void handleRemoveTeamsFromJuror(jurado.id, jurado.name)
                                }
                                className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                              >
                                Quitar equipos
                              </button>

                              <button
                                onClick={() => void toggleJurorType(jurado)}
                                className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                              >
                                {jurado.tipo === "OFFICIAL"
                                  ? "Marcar como remanente"
                                  : "Marcar como oficial"}
                              </button>

                              <button
                                onClick={() =>
                                  void handleDeleteJuror(jurado.id, jurado.name)
                                }
                                className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm text-red-500"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {juradosFiltrados.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                      No se encontraron jurados con ese filtro.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showJuradoModal && selectedTeam && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
                <div>
                  <h2 className="text-lg md:text-xl font-medium">
                    {reassignContext ? "Reasignar Jurado" : "Asignar Jurado"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Equipo: {selectedTeam.name} · Videojuego: {selectedTeam.game}
                  </p>
                  {reassignContext && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reemplazando a: {reassignContext.currentJurorName}
                    </p>
                  )}
                </div>

                <button
                  onClick={closeJuradoModal}
                  className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-6">
                <div className="mb-4 rounded-xl border border-border bg-card p-4">
                  <div className="text-sm font-medium">{selectedTeam.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedTeam.jurados.length}/{selectedTeam.requiredJurados} jurados asignados
                  </div>
                  {isColegioTeam(selectedTeam) && (
                    <div className="mt-2 text-xs text-blue-500">
                      Equipo de colegio: los jurados Junior no aparecerán como opción disponible.
                    </div>
                  )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                  {juradosDisponiblesParaModal.map((jurado) => (
                    <div
                      key={jurado.id}
                      className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                    >
                      <div className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center bg-muted text-sm font-medium flex-shrink-0">
                        {getInitials(jurado.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{jurado.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {jurado.email}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Tipo: {getJurorTypeLabel(jurado.tipo)} · Categoría: {getJurorCategoryLabel(jurado.jurorCategory)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Último ingreso: {formatDate(jurado.lastSignInAt)}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          reassignContext
                            ? void reassignJuradoOnTeam(
                              selectedTeam.id,
                              reassignContext.currentJurorId,
                              jurado
                            )
                            : void addJuradoToTeam(selectedTeam.id, jurado)
                        }
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        {reassignContext ? "Reasignar" : "Asignar"}
                      </button>
                    </div>
                  ))}

                  {juradosDisponiblesParaModal.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                      No hay jurados disponibles para asignar. Recuerda que deben tener categoría JUNIOR/SENIOR.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}



        {showAllTeamsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
                <div>
                  <h2 className="text-lg md:text-xl font-medium">Todos los equipos y jurados asignados</h2>
                  <p className="text-sm text-muted-foreground">Vista completa de equipos cargados desde la base de datos.</p>
                </div>

                <button
                  onClick={() => setShowAllTeamsModal(false)}
                  className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-6 max-h-[72vh] overflow-y-auto space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 border-b border-border pb-3 mb-3">
                      <div>
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-muted-foreground">Videojuego: {team.game}</div>
                        <div className="text-xs text-muted-foreground">Líder: {team.leaderName}</div>
                      </div>
                      <div className="rounded-full border px-3 py-1 text-xs w-fit">
                        {team.jurados.length}/{team.requiredJurados} jurados
                      </div>
                    </div>

                    {team.jurados.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Este equipo no tiene jurados asignados.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {team.jurados.map((jurado) => (
                          <div key={getAssignmentKey(team.id, jurado.id)} className="rounded-xl border border-border p-3">
                            <div className="font-medium text-sm">{jurado.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{jurado.email}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {getJurorCategoryLabel(jurado.jurorCategory)} · {getJurorTypeLabel(jurado.tipo)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAuditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-6">
                <div>
                  <h2 className="text-lg md:text-xl font-medium">
                    Historial de cambios manuales
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Registro de asignaciones, desasignaciones y reasignaciones.
                  </p>
                </div>

                <button
                  onClick={() => setShowAuditModal(false)}
                  className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                    No hay registros de auditoría.
                  </div>
                ) : (
                  auditLogs.map((log, index) => (
                    <div
                      key={log.id ?? index}
                      className="rounded-xl border border-border bg-card p-4 text-sm"
                    >
                      <div className="font-medium">
                        Acción: {normalizeAuditAction(String(log.action ?? ""))}
                      </div>

                      <div className="text-muted-foreground mt-1">
                        Equipo: {getTeamNameById(log.teamId)}
                      </div>

                      <div className="text-muted-foreground">
                        Jurado: {getJurorNameById(log.jurorId ?? log.newJurorId)}
                      </div>

                      {log.previousJurorId && (
                        <div className="text-muted-foreground">
                          Jurado anterior: {getJurorNameById(log.previousJurorId)}
                        </div>
                      )}

                      {log.newJurorId && (
                        <div className="text-muted-foreground">
                          Jurado nuevo: {getJurorNameById(log.newJurorId)}
                        </div>
                      )}

                      <div className="text-muted-foreground">
                        Usuario que realizó el cambio: {getActorNameById(log.actorUserId)}
                      </div>

                      <div className="text-muted-foreground">
                        Fecha: {formatDate(String(log.createdAt ?? log.creado_en ?? log.timestamp ?? ""))}
                      </div>

                      {log.notes && (
                        <div className="text-muted-foreground mt-1">
                          Nota: {String(log.notes)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showCreateJurorModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-xl">
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2 md:px-8 md:pt-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                    Agregar Nuevo Jurado
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base mt-2">
                    Complete todos los datos del nuevo jurado. La categoría y el tipo son obligatorios.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateJurorModal(false)}
                  className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pb-6 md:px-8 md:pb-8">
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-y-5 gap-x-5 mt-4 items-center">
                  <label className="text-foreground text-sm md:text-base font-medium">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={createJurorForm.firstName}
                    onChange={(e) =>
                      setCreateJurorForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <label className="text-foreground text-sm md:text-base font-medium">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={createJurorForm.lastName}
                    onChange={(e) =>
                      setCreateJurorForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <label className="text-foreground text-sm md:text-base font-medium leading-tight">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    value={createJurorForm.email}
                    onChange={(e) =>
                      setCreateJurorForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <label className="text-foreground text-sm md:text-base font-medium leading-tight">
                    Categoría *
                  </label>
                  <select
                    value={createJurorForm.jurorCategory}
                    onChange={(e) =>
                      setCreateJurorForm((prev) => ({
                        ...prev,
                        jurorCategory: e.target.value as "" | JurorCategory,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                  </select>

                  <label className="text-foreground text-sm md:text-base font-medium leading-tight">
                    Tipo operativo *
                  </label>
                  <select
                    value={createJurorForm.tipo}
                    onChange={(e) =>
                      setCreateJurorForm((prev) => ({
                        ...prev,
                        tipo: e.target.value as "" | JurorType,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="OFFICIAL">Oficial</option>
                    <option value="BACKUP">Remanente</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setShowCreateJurorModal(false)}
                    className="h-11 px-5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-sm md:text-base font-semibold"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => void handleCreateJurorSubmit()}
                    disabled={isSubmitting}
                    className="h-11 px-5 rounded-xl bg-[#b7c6f7] hover:opacity-90 text-[#1b1b1b] text-sm md:text-base font-semibold disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditJurorModal && editingJuror && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-xl">
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2 md:px-8 md:pt-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                    Editar Jurado
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-xl">
                    Modifique los datos del jurado. El correo electrónico no se puede editar.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowEditJurorModal(false);
                    setEditingJuror(null);
                  }}
                  className="rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all p-2 flex items-center justify-center"
                  aria-label="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pb-6 md:px-8 md:pb-8">
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-y-5 gap-x-5 mt-4 items-center">
                  <label className="text-foreground text-sm md:text-base font-medium">
                    Nombres
                  </label>
                  <input
                    type="text"
                    value={editJurorForm.firstName}
                    onChange={(e) =>
                      setEditJurorForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <label className="text-foreground text-sm md:text-base font-medium">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={editJurorForm.lastName}
                    onChange={(e) =>
                      setEditJurorForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  />

                  <label className="text-foreground text-sm md:text-base font-medium leading-tight">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={editJurorForm.email}
                    disabled
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base text-muted-foreground outline-none opacity-80"
                  />

                  <label className="text-foreground text-sm md:text-base font-medium leading-tight">
                    Categoría
                  </label>
                  <select
                    value={editJurorForm.jurorCategory}
                    onChange={(e) =>
                      setEditJurorForm((prev) => ({
                        ...prev,
                        jurorCategory: e.target.value as "" | JurorCategory,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                  </select>

                  <label className="text-foreground text-sm md:text-base font-medium leading-tight">
                    Tipo operativo
                  </label>
                  <select
                    value={editJurorForm.tipo}
                    onChange={(e) =>
                      setEditJurorForm((prev) => ({
                        ...prev,
                        tipo: e.target.value as "" | JurorType,
                      }))
                    }
                    className="h-11 md:h-12 rounded-xl border border-border bg-card px-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="OFFICIAL">Oficial</option>
                    <option value="BACKUP">Remanente</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => {
                      setShowEditJurorModal(false);
                      setEditingJuror(null);
                    }}
                    className="h-11 px-5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-sm md:text-base font-semibold"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => void handleEditJurorSubmit()}
                    disabled={isSubmitting}
                    className="h-11 px-5 rounded-xl bg-[#b7c6f7] hover:opacity-90 text-[#1b1b1b] text-sm md:text-base font-semibold disabled:opacity-50"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutAplication>
  );
}