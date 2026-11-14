import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JURORS_EXPORT_FALLBACK_NAME,
  downloadJurorsExport,
  fileNameFromDisposition,
} from '@/features/jurors/assignment/api/jurorsExport';

const apiFetch = vi.fn();

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const xlsx = (disposition?: string) =>
  new Response(new Blob(['xlsx']), {
    status: 200,
    headers: disposition ? { 'Content-Disposition': disposition } : {},
  });

describe('Exportar asignación de jurados (ARK-118)', () => {
  let clicked: string[] = [];

  beforeEach(() => {
    clicked = [];
    window.URL.createObjectURL = vi.fn(() => 'blob:fake');
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download);
    });
  });

  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  it('hace UNA sola petición por exportación y sin cabecera JSON', async () => {
    apiFetch.mockResolvedValue(
      xlsx(`attachment; filename="asignacion_jurados_2026-20_2026-11-02.xlsx"`),
    );

    await downloadJurorsExport();

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('http://api.test/reports/exportJurados');
    expect(options).toEqual({ method: 'GET', credentials: 'include' });
  });

  it('descarga con el nombre que manda el back (filename* primero)', async () => {
    apiFetch.mockResolvedValue(
      xlsx(
        `attachment; filename="asignacion_jurados_2026-20_2026-11-02.xlsx"; filename*=UTF-8''asignaci%C3%B3n_jurados_2026-20_2026-11-02.xlsx`,
      ),
    );

    await expect(downloadJurorsExport()).resolves.toBe(
      'asignación_jurados_2026-20_2026-11-02.xlsx',
    );
    expect(clicked).toEqual(['asignación_jurados_2026-20_2026-11-02.xlsx']);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('sin Content-Disposition usa un nombre por defecto', async () => {
    apiFetch.mockResolvedValue(xlsx());
    await expect(downloadJurorsExport()).resolves.toBe(JURORS_EXPORT_FALLBACK_NAME);
  });

  it('si el back responde un error, lanza su mensaje y no descarga', async () => {
    apiFetch.mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 404, message: 'No hay asignaciones para exportar.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(downloadJurorsExport()).rejects.toThrow('No hay asignaciones para exportar.');
    expect(clicked).toEqual([]);
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('si el error no trae JSON, usa un mensaje en español', async () => {
    apiFetch.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    await expect(downloadJurorsExport()).rejects.toThrow(
      'No se pudo exportar la asignación de jurados.',
    );
  });

  it('fileNameFromDisposition', () => {
    expect(fileNameFromDisposition(null)).toBeNull();
    expect(fileNameFromDisposition('attachment')).toBeNull();
    expect(fileNameFromDisposition('attachment; filename=reporte.xlsx')).toBe('reporte.xlsx');
  });
});
