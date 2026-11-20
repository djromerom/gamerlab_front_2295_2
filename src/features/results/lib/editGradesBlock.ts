/**
 * HU-45 (ARK-296): por qué el profesor no puede usar «Editar notas» en este momento.
 * El botón siempre dice «Editar notas»; si está bloqueado se ve atenuado y, al tocarlo,
 * avisa la causa. Mientras carga no hay aviso: el bloqueo es momentáneo.
 */
export type EditGradesBlock = "loading" | "historical" | "noNrc" | "noEditable";

export interface EditGradesState {
  isLoading: boolean;
  showHistorical: boolean;
  selectedNRC: string;
  hasEditableTeams: boolean;
}

/** `null` si se puede editar. El orden importa: se avisa primero lo que el profesor debe cambiar antes. */
export function editGradesBlock({ isLoading, showHistorical, selectedNRC, hasEditableTeams }: EditGradesState): EditGradesBlock | null {
  if (isLoading) return "loading";
  if (showHistorical) return "historical";
  if (!selectedNRC) return "noNrc";
  if (!hasEditableTeams) return "noEditable";
  return null;
}

export const EDIT_GRADES_BLOCK_MESSAGE: Record<Exclude<EditGradesBlock, "loading">, string> = {
  noNrc: "Elige un NRC para editar sus notas",
  historical: "Estás viendo históricos: vuelve a la feria actual",
  noEditable: "Este NRC no tiene notas editables",
};
