import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTO_ASSIGNMENT_OUTDATED,
  AutomaticAssignmentError,
  confirmAutomaticAssignment,
  isPlanOutdated,
  previewAutomaticAssignment,
} from '@/features/jurors/assignment/api/automaticAssignment';

const apiFetch = vi.fn();

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const assignments = [
  { teamId: 12, jurorId: 'd4e5f6a7-b8c9-4123-d456-678901234567' },
  { teamId: 31, jurorId: 'a1b2c3d4-0000-4000-8000-000000000000' },
];

describe('Asignación automática de jurados: API (ARK-115)', () => {
  afterEach(() => {
    apiFetch.mockReset();
  });

  it('la vista previa hace POST a /juror/automatic-assignment/preview con body vacío', async () => {
    apiFetch.mockResolvedValue(json(200, { assignments: [] }));

    await previewAutomaticAssignment();

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('http://api.test/juror/automatic-assignment/preview');
    expect(options.method).toBe('POST');
    expect(options.credentials).toBe('include');
    expect(JSON.parse(options.body)).toEqual({});
  });

  it('la vista previa envía maxTeamsPerJuror solo cuando se pide', async () => {
    apiFetch.mockResolvedValue(json(200, { assignments: [] }));

    await previewAutomaticAssignment(4);

    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ maxTeamsPerJuror: 4 });
  });

  it('nunca llama a la ruta vieja GET /juror/evaluations-assignment', async () => {
    // Una respuesta nueva por llamada: el cuerpo de un Response solo se lee una vez
    apiFetch.mockImplementation(async () => json(200, { assignments: [] }));

    await previewAutomaticAssignment();
    await confirmAutomaticAssignment([]);

    for (const [url, options] of apiFetch.mock.calls) {
      expect(url).not.toContain('evaluations-assignment');
      expect(options.method).toBe('POST');
    }
  });

  it('confirmar envía el mismo arreglo de la vista previa y el mismo límite', async () => {
    apiFetch.mockResolvedValue(
      json(200, { message: 'Se guardaron 2 asignaciones en 2 grupos.', saved: 2 }),
    );

    const result = await confirmAutomaticAssignment(assignments, 4);

    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('http://api.test/juror/automatic-assignment/confirm');
    expect(JSON.parse(options.body)).toEqual({ maxTeamsPerJuror: 4, assignments });
    expect(result.saved).toBe(2);
  });

  it('confirmar sin límite no manda maxTeamsPerJuror', async () => {
    apiFetch.mockResolvedValue(json(200, { message: 'ok' }));

    await confirmAutomaticAssignment(assignments);

    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ assignments });
  });

  it('un 409 AUTO_ASSIGNMENT_OUTDATED conserva status, code y message', async () => {
    const message =
      'La asignación cambió desde la vista previa (equipos, jurados o asignaciones nuevas). No se guardó nada: genera la vista previa otra vez.';
    apiFetch.mockResolvedValue(
      json(409, { statusCode: 409, code: AUTO_ASSIGNMENT_OUTDATED, message }),
    );

    const error = await confirmAutomaticAssignment(assignments).catch((e) => e);

    expect(error).toBeInstanceOf(AutomaticAssignmentError);
    expect(error.status).toBe(409);
    expect(error.code).toBe(AUTO_ASSIGNMENT_OUTDATED);
    expect(error.message).toBe(message);
    expect(isPlanOutdated(error)).toBe(true);
  });

  it('un 400 de la vista previa muestra el message del back y no es "plan desactualizado"', async () => {
    const message =
      'No hay jurados oficiales en la edición "Feria 2026-2": confirma los jurados en "Jurados de la edición" o carga los NRC de los profesores.';
    apiFetch.mockResolvedValue(json(400, { statusCode: 400, message }));

    const error = await previewAutomaticAssignment().catch((e) => e);

    expect(error.message).toBe(message);
    expect(error.status).toBe(400);
    expect(isPlanOutdated(error)).toBe(false);
  });

  it('si el back manda message como arreglo (validación) usa el primero', async () => {
    apiFetch.mockResolvedValue(
      json(400, { message: ['maxTeamsPerJuror no puede ser mayor que 20'] }),
    );

    await expect(previewAutomaticAssignment(50)).rejects.toThrow(
      'maxTeamsPerJuror no puede ser mayor que 20',
    );
  });

  it('si el cuerpo del error no es JSON usa un mensaje por defecto', async () => {
    apiFetch.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));

    await expect(confirmAutomaticAssignment(assignments)).rejects.toThrow(
      'No se pudo guardar la asignación automática.',
    );
  });
});
