/**
 * Fecha de una edición con el formato de «Información»: "Jueves 14 de mayo".
 * `withYear` agrega el año (ediciones pasadas): "Jueves 15 de mayo de 2025".
 */
export function formatEditionDate(
  isoString?: string | null,
  options: { withYear?: boolean } = {},
): string {
  if (!isoString) return "Por Definir";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Fecha Inválida";
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(options.withYear ? { year: "numeric" } : {}),
  }).format(date);
  return formatted.replace(",", "").replace(/^\w/, (c) => c.toUpperCase());
}
