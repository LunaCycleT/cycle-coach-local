import { civilToJdn, isGregorianLeapYear, jdnToCivil, parseIsoDate, formatIsoDate } from './civil';

export const IFC_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'Sol',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * Regular days sit in one of 13 months of exactly 28 days.
 * Leap Day (after June 28, leap years only) and Year Day (after December 28)
 * are standalone intercalary days that belong to no month and no weekday.
 */
export type IfcDate =
  | { kind: 'month'; year: number; month: number; day: number }
  | { kind: 'leap-day'; year: number }
  | { kind: 'year-day'; year: number };

const LEAP_DAY_ORDINAL = 169; // day-of-year of Leap Day in a leap year

export const isoToIfc = (iso: string): IfcDate => {
  const c = parseIsoDate(iso);
  const leap = isGregorianLeapYear(c.year);
  let doy = civilToJdn(c) - civilToJdn({ year: c.year, month: 1, day: 1 }) + 1;
  const yearLength = leap ? 366 : 365;
  if (doy === yearLength) return { kind: 'year-day', year: c.year };
  if (leap) {
    if (doy === LEAP_DAY_ORDINAL) return { kind: 'leap-day', year: c.year };
    if (doy > LEAP_DAY_ORDINAL) doy -= 1;
  }
  return { kind: 'month', year: c.year, month: Math.floor((doy - 1) / 28) + 1, day: ((doy - 1) % 28) + 1 };
};

export const ifcToIso = (d: IfcDate): string => {
  const leap = isGregorianLeapYear(d.year);
  let doy: number;
  if (d.kind === 'year-day') doy = leap ? 366 : 365;
  else if (d.kind === 'leap-day') {
    if (!leap) throw new RangeError(`${d.year} has no Leap Day`);
    doy = LEAP_DAY_ORDINAL;
  } else {
    if (d.month < 1 || d.month > 13 || d.day < 1 || d.day > 28 || !Number.isInteger(d.day)) {
      throw new RangeError('Invalid International Fixed date');
    }
    doy = (d.month - 1) * 28 + d.day;
    if (leap && doy >= LEAP_DAY_ORDINAL) doy += 1;
  }
  return formatIsoDate(jdnToCivil(civilToJdn({ year: d.year, month: 1, day: 1 }) + doy - 1));
};

export const formatIfc = (d: IfcDate): string =>
  d.kind === 'year-day'
    ? `Year Day ${d.year}`
    : d.kind === 'leap-day'
      ? `Leap Day ${d.year}`
      : `${d.day} ${IFC_MONTHS[d.month - 1]} ${d.year}`;
