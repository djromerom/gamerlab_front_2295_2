"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  RefreshCw,
  UserX,
  UserPlus,
  Shield,
  AlertTriangle,
  ChevronRight,
  Download,
  MoreVertical,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/grupo 9/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const API_BASE = "http://localhost:3000";

type JurorType = "oficial" | "remanente";
type JurorStatus = "disponible" | "ausente";
type JurorRole = "principal" | "auxiliar";

interface Jurado {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatar: string;
  specialty: string;
  tipo: JurorType;
  status: JurorStatus;
  rol?: JurorRole;
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
  leaderName: string;
  leaderEmail: string;
  jurados: Jurado[];
  requiredJurados: number;
}

let isRefreshingToken = false;
let refreshTokenPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
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
  }

  return [];
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
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

function mapJurorFromApi(raw: any, previousJurados: Jurado[]): Jurado {
  const firstName = safeString(raw.firstName ?? raw.name ?? raw.fullName);
  const lastName = safeString(raw.lastName);
  const email = safeString(raw.email);
  const existing = previousJurados.find(
    (j) => j.id === String(raw.id ?? email ?? firstName)
  );

  const fallbackName = safeString(raw.nombre ?? raw.name ?? raw.fullName);
  const split = !firstName && fallbackName ? splitName(fallbackName) : null;

  const resolvedFirstName = firstName || split?.firstName || "";
  const resolvedLastName = lastName || split?.lastName || "";
  const name = buildFullName(resolvedFirstName, resolvedLastName, email);

  return {
    id: String(raw.id ?? email ?? name),
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    name,
    email,
    avatar:
      existing?.avatar ??
      safeString(raw.avatar ?? raw.photoUrl ?? raw.profilePicture, ""),
    specialty:
      existing?.specialty ??
      safeString(raw.specialty ?? raw.area ?? raw.expertise, "Sin especialidad"),
    tipo: existing?.tipo ?? "oficial",
    status: existing?.status ?? "disponible",
    rol: existing?.rol,
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
  const assignedEmail = safeString(rawAssignedJuror.email);

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
      rol: "principal",
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
    specialty: "Sin especialidad",
    tipo: "oficial",
    status: "disponible",
    rol: "principal",
    evaluatedCount: 0,
    evaluatedGameNames: [],
    unevaluatedCount: 0,
    unevaluatedGameNames: [],
  };
}

function mapTeamFromApi(raw: any, allJurados: Jurado[], previousTeams: Team[]): Team {
  const rawAssigned = extractArray(
    raw.juradosAsignados ??
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

  const teamId = Number(raw.id ?? raw.teamId ?? 0);

  const mappedJurados = rawAssigned.map((item) =>
    mapTeamAssignedJuror(item, allJurados, previousTeams, teamId)
  );

  return {
    id: teamId,
    name: safeString(raw.nombre ?? raw.name ?? raw.teamName, "Equipo sin nombre"),
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
    leaderName: safeString(
      leader.nombre ?? leader.name ?? leader.fullName,
      "Sin líder"
    ),
    leaderEmail: safeString(leader.email, ""),
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
  const [asignarComoAuxiliar, setAsignarComoAuxiliar] = useState(false);
  const [showJuradosListModal, setShowJuradosListModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jurorSearch, setJurorSearch] = useState("");
  const [openJurorMenuId, setOpenJurorMenuId] = useState<string | null>(null);

  const [showCreateJurorModal, setShowCreateJurorModal] = useState(false);
  const [showEditJurorModal, setShowEditJurorModal] = useState(false);
  const [editingJuror, setEditingJuror] = useState<Jurado | null>(null);

  const [createJurorForm, setCreateJurorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [editJurorForm, setEditJurorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [jurorsResponse, teamsResponse] = await Promise.all([
        apiRequest<any>("/juror?includeInactive=false&limit=100&page=1", {
          method: "GET",
        }),
        apiRequest<any>("/teams/incomplete-jurors", {
          method: "GET",
        }),
      ]);

      const incomingJurors = extractArray(jurorsResponse).map((raw) =>
        mapJurorFromApi(raw, jurados)
      );

      const incomingTeams = extractArray(teamsResponse).map((raw) =>
        mapTeamFromApi(raw, incomingJurors, teams)
      );

      setJurados(incomingJurors);
      setTeams(incomingTeams);
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

  const getJuradosDisponibles = (tipo?: JurorType) => {
    const asignados = teams.flatMap((team) => team.jurados.map((jurado) => jurado.id));

    return jurados.filter((jurado) => {
      const disponible =
        jurado.status === "disponible" && !asignados.includes(jurado.id);

      if (tipo) {
        return disponible && jurado.tipo === tipo;
      }

      return disponible;
    });
  };

  const juradosOficialesDisponibles = useMemo(
    () => getJuradosDisponibles("oficial"),
    [jurados, teams]
  );

  const juradosRemanentesDisponibles = useMemo(
    () => getJuradosDisponibles("remanente"),
    [jurados, teams]
  );

  const juradosAusentes = useMemo(
    () => jurados.filter((jurado) => jurado.status === "ausente"),
    [jurados]
  );

  const totalAsignados = useMemo(
    () =>
      teams.reduce(
        (sum, team) =>
          sum +
          team.jurados.filter((jurado) => !jurado.rol || jurado.rol === "principal")
            .length,
        0
      ),
    [teams]
  );

  const totalRequeridos = useMemo(
    () => teams.reduce((sum, team) => sum + team.requiredJurados, 0),
    [teams]
  );

  const equiposCompletos = useMemo(
    () =>
      teams.filter(
        (team) =>
          team.jurados.filter(
            (jurado) => !jurado.rol || jurado.rol === "principal"
          ).length >= team.requiredJurados
      ).length,
    [teams]
  );

  const remanentesEnUso = useMemo(
    () =>
      teams.flatMap((team) => team.jurados).filter((jurado) => jurado.tipo === "remanente")
        .length,
    [teams]
  );

  const auxiliaresEnUso = useMemo(
    () =>
      teams.flatMap((team) => team.jurados).filter((jurado) => jurado.rol === "auxiliar")
        .length,
    [teams]
  );

  const juradosFiltrados = useMemo(() => {
    const term = jurorSearch.trim().toLowerCase();

    if (!term) return jurados;

    return jurados.filter((jurado) => {
      return (
        jurado.name.toLowerCase().includes(term) ||
        jurado.email.toLowerCase().includes(term)
      );
    });
  }, [jurados, jurorSearch]);

  const juradosDisponiblesParaModal = useMemo(() => {
    if (!selectedTeam) return [];

    const teamAssignedIds = new Set(selectedTeam.jurados.map((jurado) => jurado.id));

    return jurados.filter((jurado) => {
      const notAssignedAnywhere = !teams
        .flatMap((team) => team.jurados)
        .some((assigned) => assigned.id === jurado.id);

      const alreadyInThisTeam = teamAssignedIds.has(jurado.id);

      return (
        jurado.status === "disponible" &&
        !alreadyInThisTeam &&
        notAssignedAnywhere
      );
    });
  }, [jurados, teams, selectedTeam]);

  const openJuradoModal = (team: Team, esAuxiliar = false) => {
    setSelectedTeam(team);
    setAsignarComoAuxiliar(esAuxiliar);
    setShowJuradoModal(true);
  };

  const closeJuradoModal = () => {
    setSelectedTeam(null);
    setAsignarComoAuxiliar(false);
    setShowJuradoModal(false);
  };

  const assignJuradosAutomatically = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("/juror/evaluations-assignment", { method: "GET" });
      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo ejecutar la asignación automática."
      );
    } finally {
      setIsSubmitting(false);
    }
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

      setTeams((prevTeams) =>
        prevTeams.map((team) => {
          if (team.id !== teamId) return team;

          const juradosPrincipales = team.jurados.filter(
            (item) => !item.rol || item.rol === "principal"
          );

          const rol: JurorRole =
            asignarComoAuxiliar || juradosPrincipales.length >= team.requiredJurados
              ? "auxiliar"
              : "principal";

          return {
            ...team,
            jurados: [...team.jurados, { ...jurado, rol }],
          };
        })
      );

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

  const removeJuradoFromTeam = async (teamId: number, jurorId: string) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas remover este jurado del equipo?"
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

      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === teamId
            ? {
              ...team,
              jurados: team.jurados.filter((jurado) => jurado.id !== jurorId),
            }
            : team
        )
      );
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo remover el jurado del equipo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const markJuradoAsAusent = async (jurorId: string) => {
    const confirmed = window.confirm(
      "¿Marcar este jurado como ausente? Se removerá de todos los equipos y podrás reemplazarlo con un remanente."
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await apiRequest(`/juror/${jurorId}/assignments`, {
        method: "DELETE",
      });

      setJurados((prevJurados) =>
        prevJurados.map((item) =>
          item.id === jurorId ? { ...item, status: "ausente" } : item
        )
      );

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          jurados: team.jurados.filter((item) => item.id !== jurorId),
        }))
      );
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error
          ? error.message
          : "No se pudo marcar el jurado como ausente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const restoreJurado = (jurorId: string) => {
    setJurados((prevJurados) =>
      prevJurados.map((jurado) =>
        jurado.id === jurorId ? { ...jurado, status: "disponible" } : jurado
      )
    );
  };

  const resetAllAssignments = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar todas las asignaciones?"
    );
    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await apiRequest("/juror/assignments/all", {
        method: "DELETE",
      });

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          jurados: [],
        }))
      );
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

  const exportJurorsToCsv = () => {
    const headers = [
      "Nombres",
      "Apellidos",
      "Nombre completo",
      "Correo",
      "Tipo",
      "Estado",
      "Último ingreso",
      "Evaluados",
      "Pendientes",
    ];

    const rows = jurados.map((jurado) => [
      jurado.firstName,
      jurado.lastName,
      jurado.name,
      jurado.email,
      jurado.tipo,
      jurado.status,
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
    });
    setOpenJurorMenuId(null);
    setShowCreateJurorModal(true);
  };

  const handleCreateJurorSubmit = async () => {
    if (
      !createJurorForm.firstName.trim() ||
      !createJurorForm.lastName.trim() ||
      !createJurorForm.email.trim()
    ) {
      window.alert("Debes completar nombres, apellidos y correo electrónico.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest("/juror", {
        method: "POST",
        body: JSON.stringify({
          firstName: createJurorForm.firstName.trim(),
          lastName: createJurorForm.lastName.trim(),
          email: createJurorForm.email.trim(),
        }),
      });

      setShowCreateJurorModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error ? error.message : "No se pudo crear el jurado."
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
    });
    setShowEditJurorModal(true);
  };

  const handleEditJurorSubmit = async () => {
    if (!editingJuror) return;

    if (!editJurorForm.firstName.trim() || !editJurorForm.lastName.trim()) {
      window.alert("Debes completar nombres y apellidos.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest(`/juror/${editingJuror.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: editJurorForm.firstName.trim(),
          lastName: editJurorForm.lastName.trim(),
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

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          jurados: team.jurados.filter((jurado) => jurado.id !== jurorId),
        }))
      );
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

      setJurados((prevJurados) =>
        prevJurados.filter((jurado) => jurado.id !== jurorId)
      );

      setTeams((prevTeams) =>
        prevTeams.map((team) => ({
          ...team,
          jurados: team.jurados.filter((jurado) => jurado.id !== jurorId),
        }))
      );
    } catch (error) {
      console.error(error);
      window.alert(
        error instanceof Error ? error.message : "No se pudo eliminar el jurado."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleJurorType = (jurorId: string) => {
    setJurados((prevJurados) =>
      prevJurados.map((jurado) =>
        jurado.id === jurorId
          ? {
            ...jurado,
            tipo: jurado.tipo === "oficial" ? "remanente" : "oficial",
          }
          : jurado
      )
    );

    setTeams((prevTeams) =>
      prevTeams.map((team) => ({
        ...team,
        jurados: team.jurados.map((jurado) =>
          jurado.id === jurorId
            ? {
              ...jurado,
              tipo: jurado.tipo === "oficial" ? "remanente" : "oficial",
            }
            : jurado
        ),
      }))
    );

    setOpenJurorMenuId(null);
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
                  <span className="text-foreground">Asignación de Jurados</span>
                </li>
              </ol>
            </nav>
          </div>
        </header>

        <div className="bg-background text-foreground min-h-screen p-4">
          <div className="px-4 py-2">
            <h1 className="text-xl font-medium mb-2">
              Gestión de Jurados - Asignación de Equipos
            </h1>

            <p className="text-muted-foreground mb-8 text-sm md:text-base">
              Asigna jurados oficiales automáticamente y usa jurados remanentes
              como respaldo. También puedes agregar auxiliares por equipo.
            </p>

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

            <div className="max-w-7xl grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 flex items-center gap-1 text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Oficiales</span>
                </div>
                <div className="text-xl md:text-2xl">
                  {juradosOficialesDisponibles.length}
                </div>
                <div className="text-xs text-muted-foreground">disponibles</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Remanentes</span>
                </div>
                <div className="text-xl md:text-2xl">
                  {juradosRemanentesDisponibles.length}
                </div>
                <div className="text-xs text-muted-foreground">disponibles</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Asignados</div>
                <div className="text-xl md:text-2xl">
                  {totalAsignados}/{totalRequeridos}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Equipos OK</div>
                <div className="text-xl md:text-2xl">
                  {equiposCompletos}/{teams.length}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Rem. en uso</div>
                <div className="text-xl md:text-2xl">{remanentesEnUso}</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Auxiliares</div>
                <div className="text-xl md:text-2xl">{auxiliaresEnUso}</div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3 md:p-4">
                <div className="text-xs mb-1 text-muted-foreground">Ausentes</div>
                <div className="text-xl md:text-2xl">{juradosAusentes.length}</div>
              </div>
            </div>

            <div className="max-w-7xl flex flex-wrap gap-3 md:gap-4 mb-8 md:mb-12">
              <button
                onClick={() => setShowJuradosListModal(true)}
                disabled={isLoading || isSubmitting}
                className="inline-flex items-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 md:px-6 py-2 md:py-3 text-sm md:text-base disabled:opacity-50"
              >
                <Users className="w-4 md:w-5 h-4 md:h-5" />
                Lista de Jurados
              </button>

              <button
                onClick={assignJuradosAutomatically}
                disabled={isLoading || isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base disabled:opacity-50"
              >
                <RefreshCw className="w-4 md:w-5 h-4 md:h-5" />
                <span className="hidden sm:inline">Asignar Jurados Oficiales</span>
                <span className="sm:hidden">Asignar</span>
              </button>

              <button
                onClick={resetAllAssignments}
                disabled={isLoading || isSubmitting}
                className="inline-flex items-center gap-2 rounded-md border bg-card hover:bg-accent text-foreground px-4 md:px-6 py-2 md:py-3 text-sm md:text-base disabled:opacity-50"
              >
                <UserX className="w-4 md:w-5 h-4 md:h-5" />
                Limpiar Todo
              </button>
            </div>

            <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
              <div className="lg:col-span-3 order-2 lg:order-1">
                <h2 className="text-xl md:text-2xl mb-4 md:mb-6 flex items-center gap-2">
                  <Users className="w-6 md:w-7 h-6 md:h-7" />
                  Equipos ({teams.length})
                </h2>

                {teams.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                    No hay equipos cargados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {teams.map((team) => {
                      const juradosPrincipales = team.jurados.filter(
                        (jurado) => !jurado.rol || jurado.rol === "principal"
                      );
                      const juradosAuxiliares = team.jurados.filter(
                        (jurado) => jurado.rol === "auxiliar"
                      );
                      const isComplete =
                        juradosPrincipales.length >= team.requiredJurados;
                      const isEmpty = team.jurados.length === 0;
                      const hasRemanentes = team.jurados.some(
                        (jurado) => jurado.tipo === "remanente"
                      );
                      const hasAuxiliares = juradosAuxiliares.length > 0;

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
                                  {juradosPrincipales.length}/{team.requiredJurados}
                                  {hasAuxiliares && (
                                    <span className="ml-1">
                                      +{juradosAuxiliares.length}
                                    </span>
                                  )}
                                </div>

                                {hasRemanentes && (
                                  <div className="px-2 py-1 rounded-full text-xs border border-amber-500/30 text-amber-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="hidden md:inline">
                                      Con remanentes
                                    </span>
                                    <span className="md:hidden">Remanente</span>
                                  </div>
                                )}

                                {hasAuxiliares && (
                                  <div className="px-2 py-1 rounded-full text-xs border flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span className="hidden md:inline">
                                      Con auxiliares
                                    </span>
                                    <span className="md:hidden">Aux.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                            {team.jurados.map((jurado) => (
                              <div
                                key={getAssignmentKey(team.id, jurado.id)}
                                className={`border rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 group hover:border-primary/50 transition-all ${jurado.rol === "auxiliar"
                                    ? "bg-card border-cyan-500/30"
                                    : jurado.tipo === "oficial"
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
                                      {jurado.specialty} •{" "}
                                      {jurado.rol === "auxiliar"
                                        ? "Auxiliar"
                                        : jurado.tipo === "oficial"
                                          ? "Oficial"
                                          : "Remanente"}
                                    </span>
                                    <span className="md:hidden">
                                      {jurado.rol === "auxiliar"
                                        ? "Auxiliar"
                                        : jurado.tipo === "oficial"
                                          ? "Oficial"
                                          : "Remanente"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] md:text-xs text-muted-foreground truncate">
                                    {jurado.email}
                                  </div>
                                </div>

                                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button
                                    onClick={() => void markJuradoAsAusent(jurado.id)}
                                    disabled={isSubmitting}
                                    className="p-1.5 md:p-2 rounded-lg border hover:bg-accent transition-all disabled:opacity-50"
                                    title="Marcar ausente"
                                  >
                                    <UserX className="w-3 md:w-4 h-3 md:h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {Array.from({
                              length: Math.max(
                                0,
                                team.requiredJurados - juradosPrincipales.length
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

                            {isComplete && (
                              <button
                                onClick={() => openJuradoModal(team, true)}
                                disabled={isSubmitting}
                                className="w-full h-12 md:h-16 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-accent/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                              >
                                <UserPlus className="w-4 md:w-5 h-4 md:h-5" />
                                <span className="hidden md:inline">Agregar Auxiliar</span>
                                <span className="md:hidden">+ Auxiliar</span>
                              </button>
                            )}
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
                    <Shield className="w-5 h-5" />
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
                              {jurado.specialty}
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
                    <AlertTriangle className="w-5 h-5" />
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
                              {jurado.specialty}
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

                {juradosAusentes.length > 0 && (
                  <div>
                    <h3 className="text-sm md:text-base mb-2 md:mb-3 flex items-center gap-1.5">
                      <UserX className="w-4 md:w-5 h-4 md:h-5" />
                      <span>Ausentes ({juradosAusentes.length})</span>
                    </h3>

                    <div className="space-y-1.5 md:space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {juradosAusentes.map((jurado) => (
                        <div
                          key={jurado.id}
                          className="bg-card border border-border rounded-lg p-2 md:p-2.5 group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-border grayscale flex items-center justify-center bg-muted text-[10px] md:text-xs font-medium">
                              {getInitials(jurado.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] md:text-xs font-medium truncate">
                                {jurado.name}
                              </div>
                              <div className="text-muted-foreground text-[10px] md:text-xs">
                                {jurado.tipo === "oficial" ? "Oficial" : "Remanente"}
                              </div>
                            </div>
                            <button
                              onClick={() => restoreJurado(jurado.id)}
                              className="px-1.5 py-0.5 rounded border hover:bg-accent text-[10px] md:text-xs opacity-0 group-hover:opacity-100 transition-all"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    Cerrar
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
                              Tipo: {jurado.tipo === "oficial" ? "Oficial" : "Remanente"} · Estado:{" "}
                              {jurado.status === "disponible" ? "Disponible" : "Ausente"}
                            </div>

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
                                  Editor
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
                                  onClick={() => toggleJurorType(jurado.id)}
                                  className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                                >
                                  {jurado.tipo === "oficial"
                                    ? "Marcar como remanente"
                                    : "Marcar como oficial"}
                                </button>

                                <button
                                  onClick={() => void markJuradoAsAusent(jurado.id)}
                                  className="w-full text-left rounded-xl px-3 py-3 hover:bg-accent text-sm"
                                >
                                  Marcar ausente
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
                      {asignarComoAuxiliar ? "Agregar Auxiliar" : "Asignar Jurado"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Equipo: {selectedTeam.name} · Videojuego: {selectedTeam.game}
                    </p>
                  </div>

                  <button
                    onClick={closeJuradoModal}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <div className="mb-4 rounded-xl border border-border bg-card p-4">
                    <div className="text-sm font-medium">{selectedTeam.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {
                        selectedTeam.jurados.filter(
                          (jurado) => !jurado.rol || jurado.rol === "principal"
                        ).length
                      }
                      /{selectedTeam.requiredJurados} jurados principales
                    </div>
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
                            Tipo: {jurado.tipo === "oficial" ? "Oficial" : "Remanente"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Último ingreso: {formatDate(jurado.lastSignInAt)}
                          </div>
                        </div>

                        <button
                          onClick={() => void addJuradoToTeam(selectedTeam.id, jurado)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" />
                          {asignarComoAuxiliar ? "Agregar Auxiliar" : "Asignar"}
                        </button>
                      </div>
                    ))}

                    {juradosDisponiblesParaModal.length === 0 && (
                      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                        No hay jurados disponibles para asignar.
                      </div>
                    )}
                  </div>
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
                      Complete los datos del nuevo jurado.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateJurorModal(false)}
                    className="text-muted-foreground hover:text-foreground text-3xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="px-5 pb-6 md:px-8 md:pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-y-5 gap-x-5 mt-4 items-center">
                    <label className="text-foreground text-sm md:text-base font-medium">
                      Nombres
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
                      Apellidos
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
                      Correo electrónico
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
                    className="text-muted-foreground hover:text-foreground text-3xl leading-none"
                  >
                    ×
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
      </SidebarInset>
    </SidebarProvider>
  );
}