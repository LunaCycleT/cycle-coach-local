import { describe, it, expect } from 'vitest';
import { resolvePrefs, sanitizePrefs } from '@/hooks/useCalendarPreferences';

const p = (primary: any, updatedAt: string, secondary: any = null) => sanitizePrefs({ primary, secondary, updatedAt, showMoonPhases: false });

describe('calendar preference sync', () => {
  it('rejects secondary equal to primary and invalid ids', () => {
    expect(sanitizePrefs({ primary: 'ethiopian', secondary: 'ethiopian' }).secondary).toBeNull();
    expect(sanitizePrefs({ primary: 'bogus' as any }).primary).toBe('gregorian');
  });
  it('newer edit wins; tie goes to cloud', () => {
    const local = p('ethiopian', '2026-10-02T00:00:00Z');
    const cloud = p('march_first', '2026-10-01T00:00:00Z');
    expect(resolvePrefs(local, cloud)).toEqual({ winner: local, pushLocal: true });
    expect(resolvePrefs(p('ethiopian', '2026-09-01T00:00:00Z'), cloud).winner).toBe(cloud);
    expect(resolvePrefs(p('ethiopian', cloud.updatedAt), cloud).winner).toBe(cloud);
  });
  it('missing sides never overwrite', () => {
    const cloud = p('march_first', '2026-10-01T00:00:00Z');
    expect(resolvePrefs(null, cloud)).toEqual({ winner: cloud, pushLocal: false });
  });
});
