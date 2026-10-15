import { addDaysIso, daysInGregorianMonth, formatIsoDate, isGregorianLeapYear, parseIsoDate } from './civil';
import { IFC_MONTHS, ifcToIso, isoToIfc } from './internationalFixed';
import { ETHIOPIAN_MONTHS, daysInEthiopianMonth, ethiopianToIso, isoToEthiopian } from './ethiopian';
import { MARCH_FIRST_MONTHS, isoToMarchFirst } from './marchFirst';
import type { CalendarId } from './index';

const GREG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A calendar month expressed as structural coordinates. */
export interface MonthKey { year: number; month: number }

export interface MonthView {
  key: MonthKey;
  title: string;
  subtitle?: string;
  /** Regular days of the month, as ISO civil dates in order. */
  days: string[];
  /** Standalone days outside any month (IFC Leap Day / Year Day) shown after this month. */
  intercalary: { iso: string; label: string; explanation: string }[];
}

const monthCount = (cal: CalendarId) => (cal === 'international_fixed' || cal === 'ethiopian' ? 13 : 12);

export const monthKeyOf = (cal: CalendarId, iso: string): MonthKey => {
  switch (cal) {
    case 'international_fixed': {
      const d = isoToIfc(iso);
      if (d.kind === 'leap-day') return { year: d.year, month: 6 };
      if (d.kind === 'year-day') return { year: d.year, month: 13 };
      return { year: d.year, month: d.month };
    }
    case 'ethiopian': {
      const d = isoToEthiopian(iso);
      return { year: d.year, month: d.month };
    }
    default: {
      // March-first uses the same Gregorian month blocks; only labels differ.
      const c = parseIsoDate(iso);
      return { year: c.year, month: c.month };
    }
  }
};

export const shiftMonth = (cal: CalendarId, key: MonthKey, delta: number): MonthKey => {
  const n = monthCount(cal);
  const idx = key.year * n + (key.month - 1) + delta;
  return { year: Math.floor(idx / n), month: (((idx % n) + n) % n) + 1 };
};

export const buildMonthView = (cal: CalendarId, key: MonthKey): MonthView => {
  const { year, month } = key;
  if (cal === 'international_fixed') {
    const first = ifcToIso({ kind: 'month', year, month, day: 1 });
    const days = Array.from({ length: 28 }, (_, i) => addDaysIso(first, i));
    const intercalary: MonthView['intercalary'] = [];
    if (month === 6 && isGregorianLeapYear(year)) {
      intercalary.push({
        iso: ifcToIso({ kind: 'leap-day', year }),
        label: `Leap Day ${year}`,
        explanation: 'An extra day between June and Sol in leap years. It belongs to no month or week.',
      });
    }
    if (month === 13) {
      intercalary.push({
        iso: ifcToIso({ kind: 'year-day', year }),
        label: `Year Day ${year}`,
        explanation: 'The last day of the year, after December 28. It belongs to no month or week.',
      });
    }
    return { key, title: `${IFC_MONTHS[month - 1]} ${year}`, subtitle: `Month ${month} of 13 · 28 days`, days, intercalary };
  }
  if (cal === 'ethiopian') {
    const first = ethiopianToIso({ year, month, day: 1 });
    const len = daysInEthiopianMonth(year, month);
    const m = ETHIOPIAN_MONTHS[month - 1]!;
    return {
      key,
      title: `${m.en} ${year}`,
      subtitle: `${m.am} · Month ${month} of 13`,
      days: Array.from({ length: len }, (_, i) => addDaysIso(first, i)),
      intercalary: [],
    };
  }
  const len = daysInGregorianMonth(year, month);
  const days = Array.from({ length: len }, (_, i) => formatIsoDate({ year, month, day: i + 1 }));
  if (cal === 'march_first') {
    const mf = isoToMarchFirst(days[0]!);
    return {
      key,
      title: `Month ${mf.month} · ${MARCH_FIRST_MONTHS[mf.month - 1]}`,
      subtitle: `March-first year ${mf.year} (a March-first view of ${GREG[month - 1]} ${year})`,
      days,
      intercalary: [],
    };
  }
  return { key, title: `${GREG[month - 1]} ${year}`, days, intercalary: [] };
};

/** Compact label for a secondary-date line inside a day cell. */
export const shortInCalendar = (iso: string, cal: CalendarId): string => {
  switch (cal) {
    case 'international_fixed': {
      const d = isoToIfc(iso);
      if (d.kind === 'leap-day') return 'Leap';
      if (d.kind === 'year-day') return 'Year';
      return d.day === 1 ? `${IFC_MONTHS[d.month - 1]!.slice(0, 3)} 1` : String(d.day);
    }
    case 'ethiopian': {
      const d = isoToEthiopian(iso);
      return d.day === 1 ? `${ETHIOPIAN_MONTHS[d.month - 1]!.en.slice(0, 3)} 1` : String(d.day);
    }
    case 'march_first': {
      const d = isoToMarchFirst(iso);
      return d.day === 1 ? `M${d.month}` : String(d.day);
    }
    default: {
      const c = parseIsoDate(iso);
      return c.day === 1 ? `${GREG[c.month - 1]!.slice(0, 3)} 1` : String(c.day);
    }
  }
};

/** Day number shown in a cell for the primary calendar. */
export const dayNumberIn = (iso: string, cal: CalendarId): number => {
  if (cal === 'international_fixed') { const d = isoToIfc(iso); return d.kind === 'month' ? d.day : 0; }
  if (cal === 'ethiopian') return isoToEthiopian(iso).day;
  return parseIsoDate(iso).day;
};
