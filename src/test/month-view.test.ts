import { describe, it, expect } from 'vitest';
import { buildMonthView, shiftMonth, monthKeyOf, isoToMarchFirst } from '@/utils/calendars';

describe('month views', () => {
  it('IFC months have 28 days; Leap Day after June, Year Day after December', () => {
    for (let m = 1; m <= 13; m++) expect(buildMonthView('international_fixed', { year: 2028, month: m }).days).toHaveLength(28);
    expect(buildMonthView('international_fixed', { year: 2028, month: 6 }).intercalary[0]!.iso).toBe('2028-06-17');
    expect(buildMonthView('international_fixed', { year: 2027, month: 6 }).intercalary).toHaveLength(0);
    expect(buildMonthView('international_fixed', { year: 2026, month: 13 }).intercalary[0]!.iso).toBe('2026-12-31');
    expect(monthKeyOf('international_fixed', '2026-12-31')).toEqual({ year: 2026, month: 13 });
  });
  it('navigation wraps across years with 13 months', () => {
    expect(shiftMonth('international_fixed', { year: 2026, month: 13 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth('ethiopian', { year: 2019, month: 1 }, -1)).toEqual({ year: 2018, month: 13 });
    expect(shiftMonth('gregorian', { year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });
  it('Ethiopian Pagume and March-first labels', () => {
    expect(buildMonthView('ethiopian', { year: 2015, month: 13 }).days).toHaveLength(6);
    expect(buildMonthView('march_first', { year: 2026, month: 9 }).title).toContain('Month 7');
    expect(isoToMarchFirst('2027-02-10').year).toBe(2026);
  });
  it('every view covers each real day exactly once over a year', () => {
    for (const cal of ['gregorian', 'international_fixed', 'ethiopian', 'march_first'] as const) {
      const seen = new Set<string>();
      let k = monthKeyOf(cal, '2026-01-01');
      for (let i = 0; i < 15; i++) {
        const v = buildMonthView(cal, k);
        [...v.days, ...v.intercalary.map((d) => d.iso)].forEach((d) => { expect(seen.has(d)).toBe(false); seen.add(d); });
        k = shiftMonth(cal, k, 1);
      }
      expect(seen.has('2026-07-15')).toBe(true);
    }
  });
});
