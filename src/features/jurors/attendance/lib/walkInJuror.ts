import type { ExistingPerson, ShortageBasis, SuggestedTeam, TeamSuggestion } from "@/features/jurors/attendance/api/walkInJurors";
import { MAX_ASSIGNABLE_TEAMS } from "@/features/jurors/attendance/api/walkInJurors";

/** Lo que se le ofrece al administrador por cada persona que ya existe (tabla del contrato HU-24). */
export type ExistingPersonAction =
  | "CHECK_IN" // jurado de la edición sin llegada: «Marcar llegada» (conserva su tipo y sus grupos)
  | "ALREADY_ARRIVED" // jurado de la edición que ya llegó: solo se informa la hora
  | "ENROLL" // jurado o profesor que no es de la edición: se inscribe en Jurados de la edición
  | "NOT_A_JUROR"; // otro rol: ese correo no sirve para un jurado

const JUROR_ROLES = ["jurado", "profesor"];

export function existingPersonAction(person: ExistingPerson): ExistingPersonAction {
  if (person.isJurorOfEdition) return person.checkedInAt ? "ALREADY_ARRIVED" : "CHECK_IN";
  return JUROR_ROLES.includes(person.role.trim().toLowerCase()) ? "ENROLL" : "NOT_A_JUROR";
}

export function isProfessor(person: ExistingPerson): boolean {
  return person.role.trim().toLowerCase() === "profesor";
}

/** Texto de ayuda para inscribir a alguien que no es de la edición, según su fila en Jurados de la edición. */
export function enrollHint(person: ExistingPerson): string {
  if (person.editionStatus === "PENDING") return "Está Pendiente en la edición: confírmalo en Jurados de la edición.";
  if (person.editionStatus === "DECLINED") return "Declinó en la edición: confírmalo en Jurados de la edición.";
  return "No es jurado de la edición: inscríbelo por correo en Jurados de la edición.";
}

export type WalkInField = "firstName" | "lastName" | "email";
export interface WalkInFormErrors {
  fields: Partial<Record<WalkInField, string>>;
  /** Textos que no son de un campo concreto. */
  general: string[];
}

// Los textos del back empiezan por el nombre del campo («El nombre…», «El apellido…», «El correo…»).
const FIELD_PREFIXES: [WalkInField, RegExp][] = [
  ["firstName", /^el nombre/i],
  ["lastName", /^el apellido/i],
  ["email", /^el correo/i],
];

/** Reparte los textos de un 400 de validación entre los campos del formulario. */
export function splitFieldErrors(messages: string[]): WalkInFormErrors {
  const result: WalkInFormErrors = { fields: {}, general: [] };
  for (const message of messages) {
    const field = FIELD_PREFIXES.find(([, prefix]) => prefix.test(message.trim()))?.[0];
    if (field && !result.fields[field]) result.fields[field] = message;
    else if (!field) result.general.push(message);
  }
  return result;
}

// La misma expresión del back (CreateWalkInJurorDto): letras con tildes y ñ, espacios, guion y apóstrofo.
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s'-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validación en el navegador antes de enviar; el back vuelve a validar. */
export function validateWalkInForm(values: Record<WalkInField, string>): WalkInFormErrors["fields"] {
  const errors: WalkInFormErrors["fields"] = {};
  const name = (value: string, label: string, field: WalkInField) => {
    const trimmed = value.trim();
    if (!trimmed) errors[field] = `${label} es obligatorio`;
    else if (trimmed.length > 100) errors[field] = `${label} no puede superar los 100 caracteres`;
    else if (!NAME_PATTERN.test(trimmed)) errors[field] = `${label} solo puede contener letras y espacios`;
  };
  name(values.firstName, "El nombre", "firstName");
  name(values.lastName, "El apellido", "lastName");
  const email = values.email.trim();
  if (!email) errors.email = "El correo electrónico es obligatorio";
  else if (email.length > 150) errors.email = "El correo no puede superar los 150 caracteres";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "El correo electrónico no es válido";
  return errors;
}

/** Con correo de Uninorte entra con Microsoft; con uno externo, con el enlace del correo. */
export function isUninorteEmail(email: string): boolean {
  return /@uninorte\.edu\.co$/i.test(email.trim());
}

export function accountEmailHint(email: string): string {
  return isUninorteEmail(email)
    ? "Tiene correo de Uninorte: entra con Microsoft. Le llegó también un correo para activar la cuenta."
    : "Le llegó un correo con el enlace para crear su contraseña. Si no le llega, reenvíalo.";
}

/** Con qué se contaron los faltantes (antes de las 11:00, asignados; desde las 11:00, presentes). */
export function basisText(basis: ShortageBasis): string {
  return basis === "PRESENT"
    ? "Faltantes contados con los jurados presentes (control definitivo, desde las 11:00)."
    : "Faltantes contados con los jurados asignados (antes de las 11:00).";
}

export function missingText(team: SuggestedTeam): string {
  return `Faltan ${team.faltantes} · tiene ${team.juradosContados} de 3 jurados`;
}

/** Todos los grupos con faltantes del nivel (propuestos primero), sin repetir. */
export function teamsOfLevel(suggestion: TeamSuggestion): SuggestedTeam[] {
  const seen = new Set<number>();
  return [...suggestion.teams, ...suggestion.otherTeamsOfLevel].filter((team) => {
    if (seen.has(team.id)) return false;
    seen.add(team.id);
    return true;
  });
}

/** Marca o desmarca un grupo, sin pasar del tope que acepta el back. */
export function toggleTeam(selected: number[], id: number, max = MAX_ASSIGNABLE_TEAMS): number[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  return selected.length >= max ? selected : [...selected, id];
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
