/**
 * Timezone-independent civil dates.
 * A CivilDate is a plain proleptic-Gregorian calendar day (no time, no zone).
 * All conversions go through the Julian Day Number (integer), never JS Date.
 */
export interface CivilDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_RE = /^(-?\d{4,})-(\d{2})-(\d{2})$/;

export const isGregorianLeapYear = (y: number): boolean =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const daysInGregorianMonth = (y: number, m: number): number =>
  m === 2 && isGregorianLeapYear(y) ? 29 : MONTH_DAYS[m - 1];

export const isValidCivil = ({ year, month, day }: CivilDate): boolean =>
  Number.isInteger(year) &&
  Number.isInteger(month) &&
  Number.isInteger(day) &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= daysInGregorianMonth(year, month);

const fdiv = (a: number, b: number) => Math.floor(a / b);

/** Gregorian civil date -> Julian Day Number (Fliegel & Van Flandern). */
export const civilToJdn = ({ year, month, day }: CivilDate): number => {
  const a = fdiv(14 - month, 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + fdiv(153 * m + 2, 5) + 365 * y + fdiv(y, 4) - fdiv(y, 100) + fdiv(y, 400) - 32045;
};

/** Julian Day Number -> Gregorian civil date. */
export const jdnToCivil = (jdn: number): CivilDate => {
  const a = jdn + 32044;
  const b = fdiv(4 * a + 3, 146097);
  const c = a - fdiv(146097 * b, 4);
  const d = fdiv(4 * c + 3, 1461);
  const e = c - fdiv(1461 * d, 4);
  const m = fdiv(5 * e + 2, 153);
  return {
    day: e - fdiv(153 * m + 2, 5) + 1,
    month: m + 3 - 12 * fdiv(m, 10),
    year: 100 * b + d - 4800 + fdiv(m, 10),
  };
};

export const parseIsoDate = (iso: string): CivilDate => {
  const match = ISO_RE.exec(iso.trim());
  if (!match) throw new RangeError(`Invalid ISO date: ${iso}`);
  const c = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (!isValidCivil(c)) throw new RangeError(`Invalid ISO date: ${iso}`);
  return c;
};

const pad = (n: number, w = 2) => String(Math.abs(n)).padStart(w, '0');

export const formatIsoDate = ({ year, month, day }: CivilDate): string =>
  `${year < 0 ? '-' : ''}${pad(year, 4)}-${pad(month)}-${pad(day)}`;

export const isoToJdn = (iso: string) => civilToJdn(parseIsoDate(iso));
export const jdnToIso = (jdn: number) => formatIsoDate(jdnToCivil(jdn));

export const addDaysIso = (iso: string, days: number) => jdnToIso(isoToJdn(iso) + days);
export const diffDaysIso = (later: string, earlier: string) => isoToJdn(later) - isoToJdn(earlier);

/** 0 = Sunday ... 6 = Saturday */
export const weekdayOfJdn = (jdn: number) => (((jdn + 1) % 7) + 7) % 7;

export const dayOfGregorianYear = (c: CivilDate) =>
  civilToJdn(c) - civilToJdn({ year: c.year, month: 1, day: 1 }) + 1;

/**
 * The civil date of an instant in a given IANA time zone (e.g. the user's).
 * Use this for "today" and for legacy timestamps; never slice toISOString().
 */
export const civilDateInZone = (instant: Date, timeZone?: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return formatIsoDate({ year: get('year'), month: get('month'), day: get('day') });
};
