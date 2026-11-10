import type { Role } from "@/types/auth";

/**
 * HU-35 (ARK-172): los jurados y los usuarios finales ven solo «Jurado», sin junior ni senior.
 * El administrador y los profesores siguen viendo la categoría; el backend y la lógica no cambian.
 */
export const JUROR_PUBLIC_LABEL = "Jurado";

const ROLES_THAT_SEE_CATEGORY: readonly Role[] = ["Administrador", "Profesor"];

/** Si quien mira la pantalla puede ver la categoría (Junior/Senior) de un jurado. */
export function canSeeJurorCategory(role: Role | null | undefined): boolean {
  return role != null && ROLES_THAT_SEE_CATEGORY.includes(role);
}

/** La categoría tal cual para administrador y profesores; «Jurado» para cualquier otro rol. */
export function jurorCategoryForViewer(category: string, role: Role | null | undefined): string {
  return canSeeJurorCategory(role) ? category : JUROR_PUBLIC_LABEL;
}
