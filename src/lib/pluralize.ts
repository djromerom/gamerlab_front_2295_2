export function editionsCountLabel(count: number): string {
  const plural = count !== 1;
  return `Mostrando ${count} ${plural ? "ediciones" : "edición"} registrada${plural ? "s" : ""}`;
}
