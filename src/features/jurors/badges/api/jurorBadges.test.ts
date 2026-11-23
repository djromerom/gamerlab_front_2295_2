import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BADGE_PAPER_OPTIONS,
  DEFAULT_BADGE_PAPER_SIZE,
  downloadJurorBadgesPdf,
} from '@/features/jurors/badges/api/jurorBadges';

const apiFetch = vi.fn();

vi.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const pdf = (disposition?: string) =>
  new Response(new Blob(['%PDF']), {
    status: 200,
    headers: disposition ? { 'Content-Disposition': disposition } : {},
  });

describe('Escarapelas: tamaño de hoja del PDF', () => {
  let downloaded: string[] = [];

  beforeEach(() => {
    downloaded = [];
    window.URL.createObjectURL = vi.fn(() => 'blob:fake');
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloaded.push(this.download);
    });
  });

  afterEach(() => {
    apiFetch.mockReset();
    vi.restoreAllMocks();
  });

  const requestedUrl = () => new URL(apiFetch.mock.calls[0][0] as string);

  it('por defecto pide tabloide', async () => {
    apiFetch.mockResolvedValue(pdf('attachment; filename="escarapelas-tabloide.pdf"'));

    await downloadJurorBadgesPdf();

    expect(DEFAULT_BADGE_PAPER_SIZE).toBe('TABLOID');
    expect(requestedUrl().pathname).toBe('/juror-badges/pdf');
    expect(requestedUrl().searchParams.get('paper')).toBe('TABLOID');
    expect(requestedUrl().searchParams.has('jurorIds')).toBe(false);
    expect(downloaded).toEqual(['escarapelas-tabloide.pdf']);
  });

  it('con carta y seleccionadas manda paper y los ids separados por coma', async () => {
    apiFetch.mockResolvedValue(pdf('attachment; filename="escarapelas-carta.pdf"'));

    await downloadJurorBadgesPdf(['a-1', 'b-2'], 'LETTER');

    expect(requestedUrl().searchParams.get('paper')).toBe('LETTER');
    expect(requestedUrl().searchParams.get('jurorIds')).toBe('a-1,b-2');
    expect(downloaded).toEqual(['escarapelas-carta.pdf']);
  });

  it('sin Content-Disposition nombra el archivo por el tamaño', async () => {
    apiFetch.mockResolvedValue(pdf());

    await downloadJurorBadgesPdf(undefined, 'LETTER');

    expect(downloaded).toEqual(['escarapelas-carta.pdf']);
  });

  it('si el back responde error, lanza su mensaje', async () => {
    apiFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: ['paper debe ser TABLOID o LETTER.'] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(downloadJurorBadgesPdf()).rejects.toThrow(
      'paper debe ser TABLOID o LETTER.',
    );
    expect(downloaded).toEqual([]);
  });

  it('las opciones dicen cuántas caben por hoja', () => {
    expect(BADGE_PAPER_OPTIONS.map((o) => [o.value, o.perPage])).toEqual([
      ['TABLOID', 35],
      ['LETTER', 15],
    ]);
  });
});
