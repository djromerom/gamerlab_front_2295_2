import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  JurorEditionError,
  enrollJurorByEmail,
  fetchEditionJurors,
  importPreviousJurors,
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
    await expect(importPreviousJurors(5)).rejects.toThrow(
      'No se pudieron traer los jurados de la edición anterior.',
    );
  });

  it('importar, actualizar en bloque e inscribir envían el body del contrato', async () => {
    apiFetch.mockImplementation(async () => json(200, {}));

    await importPreviousJurors();
    await updateJurorStatuses({
      editionId: 5,
      declineRemaining: true,
      items: [{ jurorId: 'j-1', status: 'CONFIRMED', type: 'BACKUP' }],
    });
    await enrollJurorByEmail({ email: 'ana@test.co', editionId: 5, type: 'OFFICIAL' });

    const [importCall, statusCall, enrollCall] = apiFetch.mock.calls;
    expect(importCall[0]).toBe('http://api.test/juror-edition/import-previous');
    expect(importCall[1]).toMatchObject({ method: 'POST', body: '{}' });
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
