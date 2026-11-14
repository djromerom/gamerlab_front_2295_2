/**
 * HU-33: reglas del formulario de presentadores externos y lectura de la carga por lote.
 * Las validaciones copian las del DTO del back (ARK-194) para avisar antes de enviar.
 */
import { EDITION_TIME_ZONE } from "@/lib/editionDate";
import {
  MAX_BULK_PRESENTERS,
  type CreateExternalPresenterInput,
} from "@/features/external-presenters/api/externalPresenters";

export const MAX_NAME = 50;
export const MAX_EMAIL = 50;
export const MAX_ORGANIZATION = 150;
export const MAX_PRESENTATION_TITLE = 200;

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s'-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** HU-32: el correo repetido debe coincidir, sin distinguir mayúsculas ni espacios en los extremos. */
export const emailsMatch = (email: string, confirmEmail: string) =>
  normalizeEmail(email) === normalizeEmail(confirmEmail);

export type PresenterField =
  | "email"
  | "confirmEmail"
  | "firstName"
  | "lastName"
  | "organization"
  | "presentationTitle";

export type PresenterErrors = Partial<Record<PresenterField, string>>;

export interface PresenterFields {
  email?: string;
  confirmEmail?: string;
  firstName: string;
  lastName: string;
  organization?: string;
  presentationTitle?: string;
}

function nameError(value: string, label: string): string | undefined {
  const name = value.trim();
  if (!name) return `El ${label} es obligatorio`;
  if (name.length > MAX_NAME) return `El ${label} no puede superar los ${MAX_NAME} caracteres`;
  if (!NAME_PATTERN.test(name)) return `El ${label} solo puede contener letras y espacios`;
  return undefined;
}

/**
 * Errores por campo. `email` y `confirmEmail` solo se revisan si vienen
 * (al editar, el correo no se cambia).
 */
export function validatePresenter(fields: PresenterFields): PresenterErrors {
  const errors: PresenterErrors = {};

  if (fields.email !== undefined) {
    const email = fields.email.trim();
    if (!email) errors.email = "El correo es obligatorio";
    else if (email.length > MAX_EMAIL) errors.email = `El correo no puede superar los ${MAX_EMAIL} caracteres`;
    else if (!EMAIL_PATTERN.test(email)) errors.email = "El correo no es válido";
  }
  if (fields.confirmEmail !== undefined && fields.email !== undefined) {
    if (!fields.confirmEmail.trim()) errors.confirmEmail = "Repite el correo";
    else if (!emailsMatch(fields.email, fields.confirmEmail)) errors.confirmEmail = "Los correos no coinciden";
  }

  const firstName = nameError(fields.firstName, "nombre");
  if (firstName) errors.firstName = firstName;
  const lastName = nameError(fields.lastName, "apellido");
  if (lastName) errors.lastName = lastName;

  if ((fields.organization ?? "").trim().length > MAX_ORGANIZATION) {
    errors.organization = `La organización no puede superar los ${MAX_ORGANIZATION} caracteres`;
  }
  if ((fields.presentationTitle ?? "").trim().length > MAX_PRESENTATION_TITLE) {
    errors.presentationTitle = `El título no puede superar los ${MAX_PRESENTATION_TITLE} caracteres`;
  }
  return errors;
}

/** Texto opcional: vacío → undefined (alta) para no enviarlo. */
export const optionalText = (value: string) => value.trim() || undefined;

// ─── Carga por lote ─────────────────────────────────────────────────────────

export const BULK_COLUMNS = ["Correo", "Nombre", "Apellido", "Organización", "Título de la presentación"];

export interface ParsedPresenterRow {
  /** Número de línea en el texto original (desde 1), para ubicar el error */
  line: number;
  input: CreateExternalPresenterInput;
  errors: string[];
}

export interface ParsedPresenters {
  rows: ParsedPresenterRow[];
  /** Hay más filas de las que acepta el back en una carga */
  tooMany: boolean;
}

/** Separa una línea respetando comillas: `"Diseño, niveles"` queda en una sola celda. */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"' && current.trim() === "") {
      quoted = true;
      current = "";
    } else if (char === delimiter) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

/** Tabla pegada de Excel (tabuladores), CSV con «;» (Excel en español) o con «,». */
function detectDelimiter(line: string): string {
  if (line.includes("\t")) return "\t";
  if (line.includes(";")) return ";";
  return ",";
}

// Marca de orden de bytes (U+FEFF) con la que Excel abre los «CSV UTF-8»
const BOM = new RegExp(`^${String.fromCharCode(0xfeff)}`);

const isHeader = (cells: string[]) => /correo|e-?mail/i.test(cells[0] ?? "");

/**
 * Convierte el texto pegado o el CSV en la lista para `POST /external-presenters/bulk`.
 * Columnas: correo, nombre, apellido, organización (opcional), título (opcional).
 * Una primera fila de encabezados se ignora. El correo repetido (`confirmEmail`) es el
 * mismo de la columna: en la carga por lote no se escribe a mano.
 */
export function parsePresentersTable(text: string): ParsedPresenters {
  const lines = text.replace(BOM, "").split(/\r?\n/);
  const firstContent = lines.find((l) => l.trim() !== "");
  if (!firstContent) return { rows: [], tooMany: false };
  const delimiter = detectDelimiter(firstContent);

  const rows: ParsedPresenterRow[] = [];
  lines.forEach((raw, index) => {
    if (raw.trim() === "") return;
    const cells = splitLine(raw, delimiter);
    if (rows.length === 0 && raw === firstContent && isHeader(cells)) return;

    const [email = "", firstName = "", lastName = "", organization = "", presentationTitle = ""] = cells;
    const input: CreateExternalPresenterInput = {
      email: email.trim(),
      confirmEmail: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      organization: optionalText(organization),
      presentationTitle: optionalText(presentationTitle),
    };
    const errors = Object.values(
      validatePresenter({ ...input, confirmEmail: undefined }),
    ) as string[];
    rows.push({ line: index + 1, input, errors });
  });

  // Repetidos en la misma carga: el back los informa por fila, pero se avisa antes
  const seen = new Map<string, number>();
  rows.forEach((row) => {
    const key = normalizeEmail(row.input.email);
    if (!key) return;
    const first = seen.get(key);
    if (first !== undefined) row.errors.push(`Correo repetido (también en la línea ${first})`);
    else seen.set(key, row.line);
  });

  return { rows, tooMany: rows.length > MAX_BULK_PRESENTERS };
}

// ─── Presentación ───────────────────────────────────────────────────────────

/** "8 de noviembre de 2026, 2:47 p. m." en hora de Colombia. */
export function formatSentAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: EDITION_TIME_ZONE,
  }).format(date);
}

export const fullName = (p: { firstName: string; lastName: string }) =>
  `${p.firstName} ${p.lastName}`.trim();
