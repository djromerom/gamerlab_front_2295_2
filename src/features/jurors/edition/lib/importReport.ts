import {
  IMPORT_EMAIL_DELAY_MS,
  IMPORT_RESULT_LABEL,
  TYPE_LABEL,
  type JurorImportRow,
} from '@/features/jurors/edition/api/jurorEdition';

/** Las filas con error primero y, dentro de cada grupo, en el orden del Excel. */
export function sortRowsErrorsFirst(rows: JurorImportRow[]): JurorImportRow[] {
  return [...rows].sort((a, b) => {
    const aError = a.result === 'ERROR' ? 0 : 1;
    const bError = b.result === 'ERROR' ? 0 : 1;
    return aError - bError || a.row - b.row;
  });
}

/** Texto de la columna «Detalle»: el motivo del error o qué correo quedó en cola. */
export function rowDetail(row: JurorImportRow): string {
  if (row.result === 'ERROR') return row.message ?? 'No se pudo importar esta fila.';
  if (row.emailStatus === 'QUEUED') {
    return row.accountCreated
      ? 'Correo para crear la contraseña en cola'
      : 'Cuenta sin verificar: correo de verificación en cola';
  }
  return '';
}

export const rowTypeLabel = (row: JurorImportRow) => (row.type ? TYPE_LABEL[row.type] : '—');

/** Minutos aproximados que tarda el back en enviar los correos en cola (al menos 1). */
export const minutesToSendEmails = (emailsQueued: number) =>
  Math.max(1, Math.ceil((emailsQueued * IMPORT_EMAIL_DELAY_MS) / 60_000));

export const REPORT_COLUMNS = ['Fila', 'Nombres', 'Apellidos', 'Correo', 'Tipo', 'Resultado', 'Detalle'];

// Los nombres y correos vienen del Excel del usuario: una celda que empieza con
// = + - @ se abriría como fórmula en Excel, así que se antepone un apóstrofo
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: string | number): string {
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV del informe para abrir en Excel en español: separador `;`, BOM para que
 * las tildes se lean bien y saltos de línea CRLF. Mismo orden que la tabla.
 */
export function reportToCsv(rows: JurorImportRow[]): string {
  const lines = [
    REPORT_COLUMNS,
    ...sortRowsErrorsFirst(rows).map((row) => [
      row.row,
      row.firstName,
      row.lastName,
      row.email,
      rowTypeLabel(row),
      IMPORT_RESULT_LABEL[row.result],
      rowDetail(row),
    ]),
  ];
  return '﻿' + lines.map((line) => line.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

/** `informe-importacion-jurados-2026-11-20.csv`, con la fecha local. */
export function reportFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `informe-importacion-jurados-${day}.csv`;
}
