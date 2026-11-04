import { describe, expect, it } from 'vitest';
import { nrcsUrl } from './nrcs';

describe('nrcsUrl (ARK-136)', () => {
  it('sin editionId pide la edición activa (no manda el parámetro)', () => {
    expect(nrcsUrl('http://api', { page: 1, limit: 20 })).toBe('http://api/nrcs?page=1&limit=20');
  });

  it('con editionId pide esa edición', () => {
    expect(nrcsUrl('http://api', { page: 2, limit: 10, editionId: 4 })).toBe(
      'http://api/nrcs?page=2&limit=10&editionId=4',
    );
  });
});
