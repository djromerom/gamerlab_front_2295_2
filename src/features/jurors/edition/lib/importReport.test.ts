import { describe, expect, it } from 'vitest';
import type { JurorImportRow } from '@/features/jurors/edition/api/jurorEdition';
import {
  minutesToSendEmails,
  reportFileName,
  reportToCsv,
  rowDetail,
  sortRowsErrorsFirst,
} from '@/features/jurors/edition/lib/importReport';

const row = (overrides: Partial<JurorImportRow>): JurorImportRow => ({
  row: 2,
  email: 'ana.perez@empresa.com',
  firstName: 'Ana',
  lastName: 'Pérez',
  type: 'OFFICIAL',
  result: 'CONFIRMED',
  accountCreated: false,
  emailStatus: 'NOT_NEEDED',
  ...overrides,
});

const created = row({ row: 2, result: 'CREATED', accountCreated: true, emailStatus: 'QUEUED' });
const confirmed = row({ row: 3, email: 'luis@empresa.com', firstName: 'Luis', type: 'BACKUP' });
const invalid = row({
  row: 4,
  email: 'correo-malo',
  firstName: 'Eva',
  type: null,
  result: 'ERROR',
  error: 'INVALID_EMAIL',
  message: 'El correo electrónico no es válido',
});

describe('Informe de la importación de jurados (ARK-281)', () => {
  it('pone primero las filas con error y respeta el orden del Excel', () => {
    const other = row({ row: 5, result: 'ALREADY_CONFIRMED' });
    const firstError = row({ row: 6, result: 'ERROR', message: 'x' });
    expect(sortRowsErrorsFirst([created, other, firstError, confirmed, invalid]).map((r) => r.row)).toEqual([
      4, 6, 2, 3, 5,
    ]);
  });

  it('el detalle dice el motivo del error o qué correo quedó en cola', () => {
    expect(rowDetail(invalid)).toBe('El correo electrónico no es válido');
    expect(rowDetail(created)).toBe('Correo para crear la contraseña en cola');
    expect(rowDetail(row({ emailStatus: 'QUEUED' }))).toBe(
      'Cuenta sin verificar: correo de verificación en cola',
    );
    expect(rowDetail(confirmed)).toBe('');
  });

  it('calcula los minutos que tardan los correos (unos 2,5 s cada uno)', () => {
    expect(minutesToSendEmails(1)).toBe(1);
    expect(minutesToSendEmails(100)).toBe(5);
  });

  it('arma un CSV para Excel en español: BOM, «;», errores primero y textos en español', () => {
    const csv = reportToCsv([created, confirmed, invalid]);
    expect(csv.startsWith('﻿')).toBe(true);

    const lines = csv.slice(1).trimEnd().split('\r\n');
    expect(lines).toEqual([
      'Fila;Nombres;Apellidos;Correo;Tipo;Resultado;Detalle',
      '4;Eva;Pérez;correo-malo;—;Error;El correo electrónico no es válido',
      '2;Ana;Pérez;ana.perez@empresa.com;Oficial;Creado;Correo para crear la contraseña en cola',
      '3;Luis;Pérez;luis@empresa.com;Suplente;Confirmado;',
    ]);
  });

  it('escapa comillas y «;» y neutraliza celdas que Excel abriría como fórmula', () => {
    const csv = reportToCsv([
      row({ firstName: '=HYPERLINK("x")', lastName: 'Ruiz; Gómez', result: 'ERROR', message: 'Nombre inválido' }),
    ]);
    expect(csv).toContain(`2;"'=HYPERLINK(""x"")";"Ruiz; Gómez";`);
  });

  it('el nombre del archivo lleva la fecha local', () => {
    expect(reportFileName(new Date(2026, 10, 20, 23, 59))).toBe('informe-importacion-jurados-2026-11-20.csv');
  });
});
