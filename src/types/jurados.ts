export type JurorType = "OFFICIAL" | "BACKUP";
export type JurorCategory = "JUNIOR" | "SENIOR";
export type DashboardFilter =
  | "todos"
  | "oficiales"
  | "remanentes"
  | "asignados"
  | "equipos-ok"
  | "remanentes-uso";

export type AssignmentAuditAction =
  | "ASSIGN"
  | "UNASSIGN"
  | "REASSIGN"
  | "UNASSIGN_ALL"
  | "UNASSIGN_ALL_FROM_EVALUATOR";

export interface Jurado {
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

export interface Team {
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

export interface AssignmentAuditLog {
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

export interface CurrentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function getJurorTypeLabel(value?: JurorType | null): string {
  if (value === "OFFICIAL") return "Oficial";
  if (value === "BACKUP") return "Remanente";
  return "Sin tipo";
}

export function getJurorCategoryLabel(value?: JurorCategory | null): string {
  if (value === "JUNIOR") return "Junior";
  if (value === "SENIOR") return "Senior";
  return "Sin categoría";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(value?: string): string {
  if (!value) return "Sin registro";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getAssignmentKey(teamId: number, jurorId: string): string {
  return `${teamId}-${jurorId}`;
}

export function isColegioTeam(team: Team): boolean {
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

export function normalizeAuditAction(value?: string): string {
  const labels: Record<string, string> = {
    ASSIGN: "Asignación",
    UNASSIGN: "Desasignación",
    REASSIGN: "Reasignación",
    UNASSIGN_ALL: "Limpieza total",
    UNASSIGN_ALL_FROM_EVALUATOR: "Limpieza por jurado",
  };

  return value ? labels[value] ?? value : "Sin acción";
}

export function getPersonDisplayName(person?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null): string {
  if (!person) return "N/A";
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || person.email || "N/A";
}
