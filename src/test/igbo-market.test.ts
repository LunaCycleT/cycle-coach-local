import { describe, expect, it } from 'vitest';
import { addDaysIso, civilDateInZone, isoToJdn } from '@/utils/calendars';
import { igboMarketDay, igboMarketIndex } from '@/utils/calendars/igboMarket';

const name = (iso: string) => igboMarketDay(iso).plain;

describe('Igbo market cycle', () => {
  it('matches the published reference dates', () => {
    expect(name('2024-01-01')).toBe('Afo'); // Ezekwe 2024 planner
    expect(name('2025-01-01')).toBe('Eke'); // Ezekwe 2025 planner
    expect(name('2025-01-04')).toBe('Nkwo');
    expect(name('2026-01-01')).toBe('Orie'); // reference anchor
  });

  it('computes the corrected sample dates', () => {
    expect(name('2026-02-18')).toBe('Orie');
    expect(name('2026-10-15')).toBe('Eke');
    expect(name('2026-10-16')).toBe('Orie');
    expect(name('2026-10-17')).toBe('Afo');
    expect(name('2026-10-18')).toBe('Nkwo');
  });

  it('equals (JDN + 3) mod 4', () => {
    for (const iso of ['1900-03-01', '2000-02-29', '2026-02-18', '2100-12-31']) {
      expect(igboMarketIndex(iso)).toBe((isoToJdn(iso) + 3) % 4);
    }
  });

  it('never breaks the sequence across months, years and leap days', () => {
    let iso = '1999-12-01';
    let prev = igboMarketIndex(iso);
    while (iso < '2029-03-31') {
      iso = addDaysIso(iso, 1);
      const cur = igboMarketIndex(iso);
      expect(cur).toBe((prev + 1) % 4);
      prev = cur;
    }
  });

  it('handles leap days and year boundaries', () => {
    expect(name('2024-02-28')).toBe('Eke');
    expect(name('2024-02-29')).toBe('Orie');
    expect(name('2024-03-01')).toBe('Afo');
    expect(name('2025-12-31')).toBe('Eke');
  });

  it('supports the Oye spelling and diacritics', () => {
    expect(igboMarketDay('2026-01-01', 'oye').name).toBe('Oye');
    expect(igboMarketDay('2026-01-02').name).toBe('Afọ');
    expect(igboMarketDay('2026-01-02', 'oye').name).toBe('Afọ');
  });

  it('uses the civil date in the given timezone', () => {
    const instant = new Date('2026-10-15T23:30:00Z');
    expect(name(civilDateInZone(instant, 'America/Edmonton'))).toBe('Eke');
    expect(name(civilDateInZone(instant, 'Africa/Lagos'))).toBe('Orie');
  });
});
