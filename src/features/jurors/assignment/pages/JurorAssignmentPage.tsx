"use client";


import { apiFetch } from "@/lib/api";
import { fetchAllPages } from "@/lib/pagination";
import { batchErrors, batchFailureMessage, downloadCertificatePdf, runInBatches } from "@/lib/certificates";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserX,
  UserPlus,
  Shield,
  AlertTriangle,
  ChevronRight,
  History,
  Eye,
  HelpCircle,
  CheckCircle2,
  Filter,
  ChevronDown,
  Info,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import LayoutApplication from "@/layouts/LayoutApplication";
import type {
  JurorType,
  JurorCategory,
  DashboardFilter,
  Jurado,
  Team,
  AssignmentAuditLog,
  CurrentUser,
} from "@/features/jurors/types/jurors";
import {
  getJurorTypeLabel,
  getJurorCategoryLabel,
  getInitials,
  formatDate,
  getAssignmentKey,
  isColegioTeam,
  getPersonDisplayName,
} from "@/features/jurors/types/jurors";
import { JurorsListModal } from "@/features/jurors/assignment/components/JurorsListModal";
import { JurorAssignModal } from "@/features/jurors/assignment/components/JurorAssignModal";
import { AllTeamsModal } from "@/features/jurors/assignment/components/AllTeamsModal";
import { AuditModal } from "@/features/jurors/assignment/components/AuditModal";
import { auditLogPath, mergeAuditLogs, parseAuditPage } from "@/features/jurors/assignment/lib/auditLog";
import { AutomaticAssignmentModal } from "@/features/jurors/assignment/components/AutomaticAssignmentModal";
import { CreateJurorModal } from "@/features/jurors/assignment/components/CreateJurorModal";
import { EditJurorModal } from "@/features/jurors/assignment/components/EditJurorModal";
import { toast } from "sonner";
import {
  progressPercentage,
  useEvaluationProgress,
} from "@/api/evaluationProgress";
import { downloadJurorsExport } from "@/features/jurors/assignment/api/jurorsExport";
import {
  AssignmentWarningsError,
  getAssignmentWarnings,
} from "@/features/jurors/assignment/lib/assignmentWarnings";
import { useAssignmentWarnings } from "@/features/jurors/assignment/hooks/useAssignmentWarnings";
import { AssignmentWarningsDialog } from "@/features/jurors/assignment/components/AssignmentWarningsDialog";
import { BulkSubstituteDialog } from "@/features/jurors/assignment/components/BulkSubstituteDialog";
import { useWorkingEdition } from "@/hooks/useWorkingEdition";
import {
  confirmRemoveAllAssignmentsText,
  confirmRemoveJurorAssignmentsText,
} from "@/lib/workingEdition";

const API_BASE = import.meta.env.VITE_ENDPOINT_BACKEND;

let isRefreshingToken = false;
let refreshTokenPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await apiFetch(`${API_BASE}/auth/refresh`, {
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

  const response = await apiFetch(`${API_BASE}${path}`, {
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

    const warnings = getAssignmentWarnings(response.status, parsedBody);
    if (warnings) {
      throw new AssignmentWarningsError(errorMessage, warnings);
    }

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



function normalizeJurorCategory(value: unknown): JurorCategory | null {
  return value === "JUNIOR" || value === "SENIOR" ? value : null;
}

function normalizeJurorType(value: unknown): JurorType | null {
  if (value === "OFFICIAL" || value === "BACKUP") return value;
  if (value === "OFFICIAL") return "OFFICIAL";
  if (value === "BACKUP") return "BACKUP";
  return null;
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
    // [MODIFICADO]: Si el evaluador (ej. profesor) no tiene tipo ni categoría, se le asigna OFFICIAL y SENIOR por defecto.
    // [ANTES]: Terminaba siendo null, lo que impedía que se mostrara en el pool y fuera asignable.
    tipo:
      normalizeJurorType(raw.jurorType) ??
      normalizeJurorType(raw.tipo_jurado) ??
      normalizeJurorType(raw.tipo) ??
      existing?.tipo ??
      "OFFICIAL",
    jurorCategory:
      normalizeJurorCategory(raw.jurorCategory) ??
      normalizeJurorCategory(raw.categoria_jurado) ??
      existing?.jurorCategory ??
      "SENIOR",
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
    // [MODIFICADO]: Si el evaluador asignado (ej. profesor) no tiene tipo ni categoría, se le asigna OFFICIAL y SENIOR.
    // [ANTES]: Eran null.
    tipo:
      normalizeJurorType(rawAssignedJuror.jurorType) ??
      normalizeJurorType(rawAssignedJuror.tipo_jurado) ??
      normalizeJurorType(rawAssignedJuror.tipo) ??
      "OFFICIAL",
    jurorCategory:
      normalizeJurorCategory(rawAssignedJuror.jurorCategory) ??
      normalizeJurorCategory(rawAssignedJuror.categoria_jurado) ??
      normalizeJurorCategory(rawAssignedJuror.categoria) ??
      "SENIOR",
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

export function JurorAssignmentPage() {
  const [jurados, setJurados] = useState<Jurado[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showJuradoModal, setShowJuradoModal] = useState(false);
  const [showJuradosListModal, setShowJuradosListModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showAllTeamsModal, setShowAllTeamsModal] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  // HU-09: suplentes en lote
  const [showBulkSubstitutes, setShowBulkSubstitutes] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AssignmentAuditLog[]>([]);
  // ARK-262: el historial se carga por páginas ("Cargar más")
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loadingMoreAudit, setLoadingMoreAudit] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ARK-133: «quitar todas» solo afecta a la edición de trabajo; los textos la nombran
  const workingEdition = useWorkingEdition();
  // ARK-131: el motivo del bloqueo del back se muestra dentro del diálogo de asignación
  const [assignError, setAssignError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jurorSearch, setJurorSearch] = useState("");
  const [openJurorMenuId, setOpenJurorMenuId] = useState<string | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>("todos");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [reassignContext, setReassignContext] = useState<{
    teamId: number;
    currentJurorId: string;
    currentJurorName: string;
  } | null>(null);

  useEffect(() => {
    const inset = document.getElementById("sidebar-insert");
    if (inset) {
      inset.classList.remove("overflow-x-hidden");
      inset.classList.add("overflow-x-clip");
    }
    return () => {
      const inset = document.getElementById("sidebar-insert");
      if (inset) {
        inset.classList.remove("overflow-x-clip");
        inset.classList.add("overflow-x-hidden");
      }
    };
  }, []);

  const getFilterLabel = (filter: DashboardFilter): string => {
    switch (filter) {
      case "todos":
        return "Todos los equipos";
      case "asignados":
        return "Con jurados asignados";
      case "equipos-ok":
        return "Equipos completos";
      case "remanentes-uso":
        return "Con suplentes en uso";
      case "oficiales":
        return "Oficiales";
      case "remanentes":
        return "Suplentes";
      default:
        return "Todos los equipos";
    }
  };

  const [showCreateJurorModal, setShowCreateJurorModal] = useState(false);
  const [showEditJurorModal, setShowEditJurorModal] = useState(false);
  const [showStatsMobile, setShowStatsMobile] = useState(false);
  const [showAvailableJurorsMobile, setShowAvailableJurorsMobile] = useState(false);
  const [showUsoRapidoMobile, setShowUsoRapidoMobile] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [showUsoRapidoTooltip, setShowUsoRapidoTooltip] = useState(false);
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

  const assignmentWarnings = useAssignmentWarnings();

  const { progress: evaluationProgress, reload: reloadProgress } =
    useEvaluationProgress();

  const loadData = async () => {
    void reloadProgress();
    try {
      setIsLoading(true);
      setLoadError(null);

      const [jurorsResponse, teamsResponse, meResponse] = await Promise.all([
        // ARK-140: solo los jurados de la edición activa (HU-25: Confirmados y profesores
        // con NRC activo), con su tipo Oficial/Suplente de la edición. Los líderes de los
        // equipos llegan en `lider` del seguimiento.
        // ARK-156: se recorren las páginas; el backend acepta máximo 100 por página y la
        // edición puede tener más jurados.
        fetchAllPages(async (page, limit) => {
          const response = await apiRequest<any>(
            `/juror?includeInactive=false&limit=${limit}&page=${page}&participating=true`,
            { method: "GET" }
          );
          return {
            items: extractArray(response),
            totalPages: safeNumber(response?.metadata?.totalPages, 1),
          };
        }),
        apiRequest<any>("/juror/evaluation-tracking", {
          method: "GET",
        }),
        apiRequest<any>("/auth/me", { method: "GET" }).catch(() => null),
      ]);

      const incomingJurors = jurorsResponse.map((raw) =>
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

    setAssignError(null);
    setShowJuradoModal(true);
  };

  const closeJuradoModal = () => {
    setAssignError(null);
    setSelectedTeam(null);
    setReassignContext(null);
    setShowJuradoModal(false);
  };

  // HU-08: el back avisa con 409 ASSIGNMENT_WARNINGS; "Continuar" repite la petición con confirmWarnings
  const addJuradoToTeam = async (
    teamId: number,
    jurado: Jurado,
    confirmWarnings = false
  ) => {
    try {
      setIsSubmitting(true);
      setAssignError(null);

      await apiRequest("/juror/assignments", {
        method: "POST",
        body: JSON.stringify({
          teamId,
          jurorId: jurado.id,
          ...(confirmWarnings && { confirmWarnings: true }),
        }),
      });

      await loadData();
      closeJuradoModal();
    } catch (error) {
      if (
        assignmentWarnings.askToConfirm(error, () =>
          addJuradoToTeam(teamId, jurado, true)
        )
      ) {
        return;
      }
      console.error(error);
      setAssignError(
        error instanceof Error && error.message
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
    newJuror: Jurado,
    confirmWarnings = false
  ) => {
    try {
      setIsSubmitting(true);
      setAssignError(null);

      await apiRequest("/juror/assignments/reassign", {
        method: "PATCH",
        body: JSON.stringify({
          teamId,
          currentJurorId,
          newJurorId: newJuror.id,
          ...(confirmWarnings && { confirmWarnings: true }),
        }),
      });

      await loadData();
      closeJuradoModal();
    } catch (error) {
      if (
        assignmentWarnings.askToConfirm(error, () =>
          reassignJuradoOnTeam(teamId, currentJurorId, newJuror, true)
        )
      ) {
        return;
      }
      console.error(error);
      setAssignError(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo reasignar el jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeJuradoFromTeam = async (
    teamId: number,
    jurorId: string,
    confirmWarnings = false
  ) => {
    // Al confirmar advertencias el admin ya aceptó desasignar: no se pregunta dos veces
    if (!confirmWarnings) {
      const confirmed = window.confirm(
        "¿Seguro que deseas desasignar este jurado del equipo?"
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest("/juror/assignments", {
        method: "DELETE",
        body: JSON.stringify({
          teamId,
          jurorId,
          ...(confirmWarnings && { confirmWarnings: true }),
        }),
      });

      await loadData();
    } catch (error) {
      if (
        assignmentWarnings.askToConfirm(error, () =>
          removeJuradoFromTeam(teamId, jurorId, true)
        )
      ) {
        return;
      }
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
      confirmRemoveAllAssignmentsText(workingEdition?.title)
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      const result = await apiRequest<{ message?: string }>("/juror/assignments/all", {
        method: "DELETE",
      });
      if (result?.message) toast.success(result.message);

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

  // HU-07: la vista previa no guarda nada; el modal llama a esto solo después de confirmar
  const handleAutoAssignConfirmed = async () => {
    setShowAutoAssignModal(false);
    await loadData();
  };

  const sendAllJurorCerts = async () => {
    toast.message("Enviando correos, porfavor espere...")
    try {
      setIsSubmitting(true);
      // ARK-170: por tandas. Todos a la vez saturan la generación de PDF y agotan el tiempo.
      const results = await runInBatches(jurados, (j) =>
        apiRequest('/certificates/juror', {
          method: "POST",
          body: JSON.stringify({ userId: j.id }),
        })
      );
      const failed = batchErrors(results);
      const sent = results.length - failed.length;
      if (sent > 0) toast.success(`Certificados enviados: ${sent}`);
      if (failed.length > 0) toast.error(batchFailureMessage(failed));
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudieron enviar los certificados a los jurados."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const loadAuditLog = async () => {
    try {
      setIsSubmitting(true);

      const response = await apiRequest<any>(auditLogPath(1), { method: "GET" });
      const page = parseAuditPage(response, 1);

      setAuditLogs(page.logs);
      setAuditPage(page.page);
      setAuditTotal(page.totalItems);
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

  // ARK-262: la siguiente página del historial, agregada al final sin repetir registros
  const loadMoreAuditLogs = async () => {
    if (loadingMoreAudit) return;
    try {
      setLoadingMoreAudit(true);
      const next = auditPage + 1;
      const response = await apiRequest<unknown>(auditLogPath(next), { method: "GET" });
      const page = parseAuditPage(response, next);

      setAuditLogs((current) => mergeAuditLogs(current, page.logs));
      setAuditPage(page.page);
      setAuditTotal(page.totalItems);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar más registros del historial."
      );
    } finally {
      setLoadingMoreAudit(false);
    }
  };

  // Una sola petición: el back arma el nombre del archivo y el mensaje si no hay asignaciones
  const exportJurors = async () => {
    try {
      setIsSubmitting(true);
      await downloadJurorsExport();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error ? error.message : "No se pudo exportar la lista de jurados."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateJuror = () => {
    setCreateJurorForm({
      firstName: "",
      lastName: "",
      email: "",
      jurorCategory: "JUNIOR",
      tipo: "OFFICIAL",
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

  const handleSendJurorCert = async (jurado: Jurado) => {
    const lid = toast.loading(`Enviando correo a: ${jurado.email}`);
    try {
      await apiRequest('/certificates/juror', {
        method: "POST",
        body: JSON.stringify({
          userId: jurado.id
        })
      });
      toast.success(`Correo enviado a: ${jurado.email}`);
    } catch (error) {
      toast.error(`No se pudo enviar el correo a: ${jurado.email}`);
    } finally {
      toast.dismiss(lid);
    }
  }

  const handleDownloadJurorCert = async (jurado: Jurado) => {
    setOpenJurorMenuId(null);
    try {
      await downloadCertificatePdf(
        `/certificates/juror/${jurado.id}`,
        `certificado-jurado-${jurado.name}.pdf`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el certificado.");
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
      confirmRemoveJurorAssignmentsText(jurorName, workingEdition?.title)
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setOpenJurorMenuId(null);

      const result = await apiRequest<{ message?: string }>(`/juror/${jurorId}/assignments`, {
        method: "DELETE",
      });
      if (result?.message) toast.success(result.message);

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



  // ARK-262: nombres que ya conoce la pantalla; null si no los conoce (el modal muestra
  // «no disponible», nunca el identificador interno).
  const getJurorNameById = (id?: string | null) => {
    if (!id) return null;
    return jurados.find((item) => item.id === id)?.name || null;
  };

  const getTeamNameById = (id?: number | string | null) => {
    if (id === undefined || id === null) return null;
    const numericId = Number(id);
    const team = teams.find((item) => item.id === numericId);
    return team ? `${team.name} (${team.game})` : null;
  };

  const getActorNameById = (id?: string | null) => {
    if (!id) return null;
    if (currentUser?.id === id) return getPersonDisplayName(currentUser);
    return jurados.find((item) => item.id === id)?.name || null;
  };

  const breadcrumbs = [
    { label: "Asignación Manual de Jurados", href: "/jurados-assignment" },
  ];

  return (
    <LayoutApplication breadcrumbs={breadcrumbs}>
      <div className="md:bg-background text-foreground min-h-screen p-4 w-full">
        <div className="flex items-center justify-between gap-4 mb-6 md:mb-8 w-full px-4">
          <h1 className="text-xl font-medium text-foreground">
            Gestión Manual de Asignación de Jurados
          </h1>

          <div className="flex items-center gap-3">
            {/* Botón de Uso Rápido Flotante */}
            <div className="relative flex items-center">
              <button
                onClick={() => setShowUsoRapidoTooltip(!showUsoRapidoTooltip)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all shadow-sm whitespace-nowrap"
                title="Ver guía de uso rápido"
              >
                <Info className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Uso rápido</span>
              </button>

              {showUsoRapidoTooltip && (
                <>
                  {/* Backdrop invisible */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUsoRapidoTooltip(false)}
                  />

                  {/* Tooltip de Uso Rápido */}
                  <div className="absolute right-0 top-full mt-1.5 w-72 p-3.5 rounded-xl border border-border bg-popover text-popover-foreground text-[11px] shadow-lg z-50 animate-in fade-in duration-100 space-y-2">
                    <div className="font-semibold text-foreground border-b border-border pb-1.5 mb-1.5">
                      Guía de Uso Rápido
                    </div>
                    <div className="space-y-2 leading-relaxed text-muted-foreground font-medium">
                      <div>
                        1. Selecciona un equipo y pulsa{" "}
                        <span className="text-foreground font-semibold">
                          Agregar Jurado
                        </span>
                        .
                      </div>
                      <div>
                        2. Elige un jurado disponible. Puede estar asignado a otros
                        equipos.
                      </div>
                      <div>
                        3. Usa{" "}
                        <span className="text-foreground font-semibold">
                          Reasignar
                        </span>{" "}
                        o{" "}
                        <span className="text-foreground font-semibold">
                          Quitar
                        </span>{" "}
                        para ajustar en tiempo real.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Ícono de Ayuda con Tooltip Flotante Reactivo */}
            <div className="relative flex items-center">
              <HelpCircle
                onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                className="w-4 h-4 text-muted-foreground/50 hover:text-foreground cursor-pointer transition-colors"
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
                    <p className="leading-normal text-muted-foreground font-medium">
                      Administra la asignación manual durante la feria. Un jurado puede evaluar varios equipos, pero no puede repetirse dentro del mismo equipo.
                    </p>
                  </div>
                </>
              )}
            </div>
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

        <div className={`w-full ${showStatsMobile ? "grid" : "hidden"} md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 md:mb-6`}>
          {/* Tarjeta 1: Pool de Jurados (Disponibilidad) */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-200">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mb-1">
                <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Pool de Jurados</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {juradosOficialesDisponibles.length + juradosRemanentesDisponibles.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Disponibles sin asignar</p>
            </div>

            <div className="grid grid-cols-1 min-[350px]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  setDashboardFilter("oficiales");
                  setShowJuradosListModal(true);
                }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-accent text-xs font-medium text-foreground transition-colors"
              >
                <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span>{juradosOficialesDisponibles.length} Oficiales</span>
              </button>

              <button
                onClick={() => {
                  setDashboardFilter("remanentes");
                  setShowJuradosListModal(true);
                }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-accent text-xs font-medium text-foreground transition-colors"
              >
                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span>{juradosRemanentesDisponibles.length} Suplentes</span>
              </button>
            </div>
          </div>

          {/* Tarjeta 2: Cobertura de Asignaciones */}
          <div
            className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm"
          >
            <div>
              <div className="text-xs text-muted-foreground flex items-center justify-between font-medium mb-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>Asignaciones Totales</span>
                </div>
              </div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {totalAsignados} <span className="text-sm font-normal text-muted-foreground">/ {totalRequeridos}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalAsignados / (totalRequeridos || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-1 flex flex-col min-[350px]:flex-row md:flex-col lg:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Cupos cubiertos</span>
              {evaluationProgress && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 text-muted-foreground"
                  title={`${progressPercentage(evaluationProgress).toFixed(0)}% de evaluaciones completadas`}
                >
                  Evaluaciones {evaluationProgress.completed}/{evaluationProgress.assigned}
                </span>
              )}
              {remanentesEnUso > 0 ? (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-semibold"
                >
                  <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                  <span>{remanentesEnUso} suplentes en uso</span>
                </div>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 text-muted-foreground">
                  Sin suplentes
                </span>
              )}
            </div>
          </div>

          {/* Tarjeta 3: Estado de Equipos */}
          <div
            className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm"
          >
            <div>
              <div className="text-xs text-muted-foreground flex items-center justify-between font-medium mb-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Cobertura de Equipos</span>
                </div>
              </div>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {equiposCompletos} <span className="text-sm font-normal text-muted-foreground">/ {teams.length}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (equiposCompletos / (teams.length || 1)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-1 flex flex-col min-[350px]:flex-row md:flex-col lg:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Equipos completos</span>

              {teams.length - equiposCompletos > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-500 font-semibold">
                  Faltan {teams.length - equiposCompletos} equipos
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-500 font-semibold">
                  ¡Todo listo! ✨
                </span>
              )}
            </div>
          </div>
        </div>


        <div className="w-full grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 lg:mb-6 md:mb-4">
          <button
            onClick={() => setShowJuradosListModal(true)}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Lista de jurados</span>
          </button>

          <button
            onClick={() => sendAllJurorCerts()}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Enviar certificados a todos los jurados</span>
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

          <button
            onClick={() => setShowAutoAssignModal(true)}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Asignar automáticamente</span>
          </button>

          <button
            onClick={() => setShowBulkSubstitutes(true)}
            disabled={isLoading || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            <span>Asignar suplentes</span>
          </button>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-1.5 md:gap-3 lg:gap-6">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl flex items-center gap-2 flex-shrink-0">
                <Users className="w-5 md:w-7 h-5 md:h-7" />
                <span>Equipos ({filteredTeams.length}/{teams.length})</span>
              </h2>

              <div className="flex items-center gap-2 flex-shrink-0 relative">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Filtrar:</span>

                <div className="relative">
                  {/* Desktop Dropdown Button */}
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="hidden sm:flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent outline-none transition-all cursor-pointer min-w-[170px]"
                  >
                    <span>{getFilterLabel(dashboardFilter)}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Mobile Dropdown Button (Icon-only) */}
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-all cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Options List */}
                  {isFilterDropdownOpen && (
                    <>
                      {/* Click outside backdrop */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsFilterDropdownOpen(false)} />

                      <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-card p-1 shadow-xl z-20 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                        <button
                          onClick={() => {
                            setDashboardFilter("todos");
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${dashboardFilter === "todos" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"}`}
                        >
                          Todos los equipos
                        </button>
                        <button
                          onClick={() => {
                            setDashboardFilter("asignados");
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${dashboardFilter === "asignados" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"}`}
                        >
                          Con jurados asignados
                        </button>
                        <button
                          onClick={() => {
                            setDashboardFilter("equipos-ok");
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${dashboardFilter === "equipos-ok" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"}`}
                        >
                          Equipos completos
                        </button>
                        <button
                          onClick={() => {
                            setDashboardFilter("remanentes-uso");
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${dashboardFilter === "remanentes-uso" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent"}`}
                        >
                          Con suplentes en uso
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-xs text-muted-foreground font-medium">
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
                                  Con suplentes
                                </span>
                                <span className="md:hidden">Suplente</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                        {team.jurados.map((jurado) => (
                          <div
                            key={getAssignmentKey(team.id, jurado.id)}
                            className={`border rounded-xl p-2.5 md:p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 group hover:border-primary/50 transition-all ${jurado.tipo === "OFFICIAL"
                              ? "bg-card border-blue-500/30"
                              : "bg-card border-amber-500/30"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border flex items-center justify-center bg-muted text-xs md:text-sm font-medium flex-shrink-0">
                                {getInitials(jurado.name)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-xs md:text-sm font-medium truncate text-foreground">
                                  {jurado.name}
                                </div>
                                <div className="text-[11px] md:text-xs text-muted-foreground">
                                  {getJurorCategoryLabel(jurado.jurorCategory)} •{" "}
                                  {getJurorTypeLabel(jurado.tipo)}
                                </div>
                                <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                                  {jurado.email}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 xl:flex gap-1.5 flex-shrink-0 xl:justify-end justify-center border-t xl:border-t-0 pt-2 xl:pt-0 border-border/30 w-full xl:w-auto mt-2 xl:mt-0">
                              <button
                                onClick={() =>
                                  openJuradoModal(team, false, {
                                    currentJurorId: jurado.id,
                                    currentJurorName: jurado.name,
                                  })
                                }
                                disabled={isSubmitting}
                                className="w-full xl:w-auto text-center px-2 py-1.5 rounded-lg border hover:bg-accent bg-background/50 transition-all disabled:opacity-50 text-[11px] md:text-xs font-semibold whitespace-nowrap text-foreground shadow-sm"
                                title="Reasignar jurado"
                              >
                                Reasignar
                              </button>

                              <button
                                onClick={() => void removeJuradoFromTeam(team.id, jurado.id)}
                                disabled={isSubmitting}
                                className="w-full xl:w-auto text-center px-2 py-1.5 rounded-lg border hover:bg-accent bg-background/50 transition-all disabled:opacity-50 text-[11px] md:text-xs font-semibold whitespace-nowrap text-foreground shadow-sm"
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

          <div className={`lg:col-span-1 order-1 lg:order-2 lg:sticky lg:top-6 self-start lg:mb-0 transition-all duration-200 ${showAvailableJurorsMobile ? "mb-6" : "mb-1.5"}`}>
            {/* Toggle Button for Available Jurors on Mobile/Tablet */}
            <button
              onClick={() => setShowAvailableJurorsMobile(!showAvailableJurorsMobile)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground transition-all lg:hidden ${showAvailableJurorsMobile ? "mb-3" : "mb-0"}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Disponibilidad de Jurados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  {juradosOficialesDisponibles.length + juradosRemanentesDisponibles.length} libres
                </span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showAvailableJurorsMobile ? "rotate-90" : ""}`} />
              </div>
            </button>

            {/* Collapsible Panel Content */}
            <div className={`space-y-4 md:space-y-6 ${showAvailableJurorsMobile ? "block animate-in fade-in duration-200" : "hidden lg:block"}`}>
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
                  <span>Jurados Suplentes</span>
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
                      No hay jurados suplentes disponibles
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showJuradosListModal && (
          <JurorsListModal
            juradosFiltrados={juradosFiltrados}
            jurorSearch={jurorSearch}
            onJurorSearchChange={setJurorSearch}
            openJurorMenuId={openJurorMenuId}
            onOpenJurorMenuIdChange={setOpenJurorMenuId}
            isSubmitting={isSubmitting}
            onClose={() => setShowJuradosListModal(false)}
            onExport={exportJurors}
            onOpenCreateJuror={handleOpenCreateJuror}
            onEditJuror={handleEditJuror}
            onResendConfirmation={handleResendConfirmation}
            onSendJuradoCert={handleSendJurorCert}
            onDownloadJuradoCert={handleDownloadJurorCert}
            onRemoveTeamsFromJuror={handleRemoveTeamsFromJuror}
            onToggleJurorType={toggleJurorType}
            onDeleteJuror={handleDeleteJuror}
          />
        )}

        {showJuradoModal && selectedTeam && (
          <JurorAssignModal
            selectedTeam={selectedTeam}
            juradosDisponiblesParaModal={juradosDisponiblesParaModal}
            reassignContext={reassignContext}
            isSubmitting={isSubmitting}
            errorMessage={assignError}
            onClose={closeJuradoModal}
            onAssign={addJuradoToTeam}
            onReassign={reassignJuradoOnTeam}
          />
        )}

        {showAllTeamsModal && (
          <AllTeamsModal
            teams={teams}
            onClose={() => setShowAllTeamsModal(false)}
          />
        )}

        {showAutoAssignModal && (
          <AutomaticAssignmentModal
            onClose={() => setShowAutoAssignModal(false)}
            onConfirmed={handleAutoAssignConfirmed}
          />
        )}

        {showAuditModal && (
          <AuditModal
            auditLogs={auditLogs}
            totalItems={auditTotal}
            loadingMore={loadingMoreAudit}
            onLoadMore={() => void loadMoreAuditLogs()}
            onClose={() => setShowAuditModal(false)}
            getJurorNameById={getJurorNameById}
            getTeamNameById={getTeamNameById}
            getActorNameById={getActorNameById}
          />
        )}

        {showCreateJurorModal && (
          <CreateJurorModal
            form={createJurorForm}
            onFormChange={setCreateJurorForm}
            isSubmitting={isSubmitting}
            onClose={() => setShowCreateJurorModal(false)}
            onSubmit={handleCreateJurorSubmit}
          />
        )}

        {showEditJurorModal && editingJuror && (
          <EditJurorModal
            editingJuror={editingJuror}
            form={editJurorForm}
            onFormChange={setEditJurorForm}
            isSubmitting={isSubmitting}
            onClose={() => {
              setShowEditJurorModal(false);
              setEditingJuror(null);
            }}
            onSubmit={handleEditJurorSubmit}
          />
        )}

        <BulkSubstituteDialog
          open={showBulkSubstitutes}
          onOpenChange={setShowBulkSubstitutes}
          onAssigned={() => void loadData()}
        />

        <AssignmentWarningsDialog
          warnings={assignmentWarnings.warnings}
          onContinue={assignmentWarnings.continueWithWarnings}
          onCancel={assignmentWarnings.cancel}
        />

      </div>
    </LayoutApplication>
  );
}
