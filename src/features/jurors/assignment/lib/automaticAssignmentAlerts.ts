import type { AutoAssignmentAlert } from "@/features/jurors/assignment/api/automaticAssignment";

export type AlertSeverity = "danger" | "data" | "warning" | "info";

/** Cómo se muestra cada `alerts[].code` de la asignación automática (orden = de más a menos grave). */
const ALERT_GROUPS: { code: string; title: string; severity: AlertSeverity; hint?: string }[] = [
  {
    code: "SCHOOL_WITHOUT_SENIOR_JURORS",
    title: "No alcanzan los jurados senior para los colegios",
    severity: "danger",
  },
  {
    code: "UNREADABLE_TEAM_LEVEL",
    title: "Grupos sin nivel en el código (no reciben jurados)",
    severity: "data",
    hint: "El código del grupo debe empezar por N<número>-, por ejemplo N1-AYP-06.",
  },
  {
    code: "JUROR_MISSING_CATEGORY",
    title: "Jurados sin categoría (no reciben grupos)",
    severity: "data",
    hint: "Se corrige en Personal → Jurados.",
  },
  { code: "TEAM_INCOMPLETE", title: "Grupos que quedan incompletos", severity: "warning" },
  { code: "TEAM_WITHOUT_SENIOR", title: "Grupos universitarios sin jurado senior", severity: "warning" },
  {
    code: "JUROR_FIXED_MIXED_LEVELS",
    title: "Jurados con grupos de varios niveles (no se les agregan más)",
    severity: "info",
  },
];

export interface AlertGroup {
  code: string;
  title: string;
  severity: AlertSeverity;
  hint?: string;
  alerts: AutoAssignmentAlert[];
}

/** Agrupa las alertas por `code`, en el orden de gravedad; los códigos desconocidos van al final. */
export function groupAlerts(alerts: AutoAssignmentAlert[]): AlertGroup[] {
  const knownCodes = new Set(ALERT_GROUPS.map((group) => group.code));
  const groups: AlertGroup[] = ALERT_GROUPS.map((group) => ({
    ...group,
    alerts: alerts.filter((alert) => alert.code === group.code),
  })).filter((group) => group.alerts.length > 0);

  const others = alerts.filter((alert) => !knownCodes.has(alert.code));
  if (others.length > 0) {
    groups.push({ code: "OTHER", title: "Otras alertas", severity: "info", alerts: others });
  }
  return groups;
}
