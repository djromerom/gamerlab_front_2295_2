import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  JurorEditionError,
  MAX_IMPORT_FILE_BYTES,
  downloadJurorTemplate,
  enrollJurorByEmail,
  fetchEditionJurors,
  importFileProblem,
  importJurorsFromExcel,
  pendingToDecline,
  updateJurorStatuses,
  type EditionJurorItem,
} from '@/features/jurors/edition/api/jurorEdition';

const apiFetch = vi.fn();

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const juror = (jurorId: string, status: EditionJurorItem['status']): EditionJurorItem => ({
  jurorId,
  firstName: 'Ana',
  lastName: 'Pérez',
  email: `${jurorId}@test.co`,
  category: 'Junior',
  type: 'OFFICIAL',
  status,
  source: 'ENROLLED',
  updatedAt: null,
});

describe('Jurados de la edición: llamadas a la API (ARK-126)', () => {
  afterEach(() => apiFetch.mockReset());

  it('sin filtros pide la edición activa sin query', async () => {
    apiFetch.mockResolvedValue(json(200, { data: [] }));
    await fetchEditionJurors();
    expect(apiFetch).toHaveBeenCalledWith('http://api.test/juror-edition');
  });

  it('arma la query con edición, filtros y paginación; omite búsquedas de menos de 2 letras', async () => {
    apiFetch.mockImplementation(async () => json(200, { data: [] }));

    await fetchEditionJurors({ editionId: 5, status: 'PENDING', type: 'BACKUP', search: ' ana ', page: 2, limit: 50 });
    expect(apiFetch).toHaveBeenLastCalledWith(
      'http://api.test/juror-edition?editionId=5&status=PENDING&type=BACKUP&search=ana&page=2&limit=50',
    );

    await fetchEditionJurors({ search: 'a' });
    expect(apiFetch).toHaveBeenLastCalledWith('http://api.test/juror-edition');
  });

  it('un error conserva el código HTTP y el mensaje del back', async () => {
    apiFetch.mockResolvedValue(json(404, { statusCode: 404, message: 'No hay una edición activa' }));

    const error = await fetchEditionJurors().catch((e) => e);
    expect(error).toBeInstanceOf(JurorEditionError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('No hay una edición activa');
  });

  it('une la lista de mensajes de un 400 de validación', async () => {
    apiFetch.mockResolvedValue(json(400, { message: ['items must contain at least 1 elements', 'status inválido'] }));
    await expect(updateJurorStatuses({ items: [] })).rejects.toThrow(
      'items must contain at least 1 elements, status inválido',
    );
  });

  it('si el error no trae JSON usa un mensaje en español', async () => {
    apiFetch.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    await expect(enrollJurorByEmail({ email: 'ana@test.co' })).rejects.toThrow(
      'No se pudo inscribir al jurado.',
    );
  });

  it('actualizar en bloque e inscribir envían el body del contrato', async () => {
    apiFetch.mockImplementation(async () => json(200, {}));

    await updateJurorStatuses({
      editionId: 5,
      declineRemaining: true,
      items: [{ jurorId: 'j-1', status: 'CONFIRMED', type: 'BACKUP' }],
    });
    await enrollJurorByEmail({ email: 'ana@test.co', editionId: 5, type: 'OFFICIAL' });

    const [statusCall, enrollCall] = apiFetch.mock.calls;
    expect(statusCall[0]).toBe('http://api.test/juror-edition/status');
    expect(statusCall[1].method).toBe('PATCH');
    expect(JSON.parse(statusCall[1].body)).toEqual({
      editionId: 5,
      declineRemaining: true,
      items: [{ jurorId: 'j-1', status: 'CONFIRMED', type: 'BACKUP' }],
    });
    expect(enrollCall[0]).toBe('http://api.test/juror-edition/enroll');
    expect(JSON.parse(enrollCall[1].body)).toEqual({ email: 'ana@test.co', editionId: 5, type: 'OFFICIAL' });
  });

  it('pendingToDecline resta solo los seleccionados que hoy están Pendientes', () => {
    const selected = [juror('a', 'PENDING'), juror('b', 'PENDING'), juror('c', 'DECLINED')];
    expect(pendingToDecline(10, selected)).toBe(8);
    expect(pendingToDecline(1, selected)).toBe(0);
  });
});

describe('Importar jurados desde Excel: llamadas a la API (ARK-281)', () => {
  const xlsx = (name = 'jurados.xlsx', content = 'x') => new File([content], name);

  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it('sube el archivo como multipart en el campo «file», sin Content-Type a mano', async () => {
    const report = {
      edition: { id: 5, title: 'Feria Gamer 2026-30' },
      summary: { total: 0, created: 0, confirmed: 0, alreadyConfirmed: 0, errors: 0, emailsQueued: 0 },
      rows: [],
    };
    apiFetch.mockResolvedValue(json(201, report));
    const file = xlsx();

    await expect(importJurorsFromExcel(file)).resolves.toEqual(report);

    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe('http://api.test/juror-edition/import');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBe(file);
    expect(init.headers).toBeUndefined();
  });

  it('un 400 muestra el motivo del back y no importa nada', async () => {
    apiFetch.mockResolvedValue(
      json(400, { statusCode: 400, message: 'El archivo no tiene las columnas de la plantilla' }),
    );
    const error = await importJurorsFromExcel(xlsx()).catch((e) => e);
    expect(error).toBeInstanceOf(JurorEditionError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('El archivo no tiene las columnas de la plantilla');
  });

  it('un 413 y un 403 se explican en español aunque el back responda en inglés', async () => {
    apiFetch.mockResolvedValueOnce(json(413, { message: 'File too large' }));
    await expect(importJurorsFromExcel(xlsx())).rejects.toThrow('El archivo pesa más de 2 MB.');

    apiFetch.mockResolvedValueOnce(json(403, { message: 'Forbidden resource' }));
    await expect(importJurorsFromExcel(xlsx())).rejects.toThrow(
      'Solo el Administrador puede importar jurados.',
    );
  });

  it('importFileProblem rechaza lo que no es .xlsx, los vacíos y los de más de 2 MB', () => {
    expect(importFileProblem(xlsx('JURADOS.XLSX'))).toBeNull();
    expect(importFileProblem(xlsx('jurados.csv'))).toMatch(/\.xlsx/);
    expect(importFileProblem(xlsx('jurados.xls'))).toMatch(/\.xlsx/);
    expect(importFileProblem(xlsx('vacio.xlsx', ''))).toBe('El archivo está vacío.');

    const big = xlsx();
    Object.defineProperty(big, 'size', { value: MAX_IMPORT_FILE_BYTES + 1 });
    expect(importFileProblem(big)).toBe('El archivo pesa más de 2 MB.');
  });

  it('descarga la plantilla con la sesión y el nombre que manda el back', async () => {
    const createObjectURL = vi.fn(() => 'blob:plantilla');
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apiFetch.mockResolvedValue(
      new Response('xlsx', {
        status: 200,
        headers: { 'Content-Disposition': 'attachment; filename="plantilla-jurados.xlsx"' },
      }),
    );

    await expect(downloadJurorTemplate()).resolves.toBe('plantilla-jurados.xlsx');
    expect(apiFetch).toHaveBeenCalledWith('http://api.test/juror-edition/import/template', { method: 'GET' });
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('si la plantilla falla lanza el mensaje del back', async () => {
    apiFetch.mockResolvedValue(json(403, { message: 'No tiene permiso' }));
    await expect(downloadJurorTemplate()).rejects.toThrow('No tiene permiso');
  });
});
