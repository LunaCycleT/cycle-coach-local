import { daysInGregorianMonth, formatIsoDate, parseIsoDate } from './civil';

/**
 * March-first view of the Gregorian calendar (not a historical reconstruction).
 * Month 1 = March ... Month 10 = December, Month 11 = January, Month 12 = February.
 * Year numbering: a March-first year N runs from 1 March N to the end of February N+1,
 * so January and February belong to the year that began the preceding March.
 */
export const MARCH_FIRST_MONTHS = [
  'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'January', 'February',
] as const;

export interface MarchFirstDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export const isoToMarchFirst = (iso: string): MarchFirstDate => {
  const { year, month, day } = parseIsoDate(iso);
  return month >= 3 ? { year, month: month - 2, day } : { year: year - 1, month: month + 10, day };
};

export const marchFirstToIso = ({ year, month, day }: MarchFirstDate): string => {
  if (month < 1 || month > 12) throw new RangeError('Invalid March-first month');
  const gMonth = month <= 10 ? month + 2 : month - 10;
  const gYear = month <= 10 ? year : year + 1;
  if (day < 1 || day > daysInGregorianMonth(gYear, gMonth)) throw new RangeError('Invalid March-first day');
  return formatIsoDate({ year: gYear, month: gMonth, day });
};

export const daysInMarchFirstMonth = (year: number, month: number) =>
  month <= 10 ? daysInGregorianMonth(year, month + 2) : daysInGregorianMonth(year + 1, month - 10);

export const formatMarchFirst = (d: MarchFirstDate) =>
  `Month ${d.month} (${MARCH_FIRST_MONTHS[d.month - 1]}) ${d.day}, March-first year ${d.year}`;
