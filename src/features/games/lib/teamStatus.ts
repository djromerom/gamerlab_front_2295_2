import type { TeamStatus } from "@/types/team";

const LABEL: Record<TeamStatus, string> = {
  CONFIRMADO: "Confirmado",
  PENDIENTE: "Pendiente",
  RECHAZADO: "Rechazado",
};

/** BG-66 (ARK-266): «Confirmado» en vez de «CONFIRMADO» en el detalle público de un equipo. */
export function teamStatusLabel(status: TeamStatus | string | null | undefined): string {
  if (!status) return "Sin estado";
  return LABEL[status as TeamStatus] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
