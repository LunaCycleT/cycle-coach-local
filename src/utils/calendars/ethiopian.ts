import { isoToJdn, jdnToIso } from './civil';

/** Julian Day Number of 1 Meskerem 1 (Amete Mihret era). */
export const ETHIOPIAN_EPOCH_JDN = 1724221;

export const ETHIOPIAN_MONTHS = [
  { en: 'Meskerem', am: 'መስከረም' },
  { en: 'Tikimt', am: 'ጥቅምት' },
  { en: 'Hidar', am: 'ኅዳር' },
  { en: 'Tahsas', am: 'ታኅሣሥ' },
  { en: 'Tir', am: 'ጥር' },
  { en: 'Yekatit', am: 'የካቲት' },
  { en: 'Megabit', am: 'መጋቢት' },
  { en: 'Miyazya', am: 'ሚያዝያ' },
  { en: 'Ginbot', am: 'ግንቦት' },
  { en: 'Sene', am: 'ሰኔ' },
  { en: 'Hamle', am: 'ሐምሌ' },
  { en: 'Nehase', am: 'ነሐሴ' },
  { en: 'Pagume', am: 'ጳጉሜን' },
] as const;

export interface EthiopianDate {
  year: number;
  month: number; // 1-13
  day: number;
}

/** Ethiopian leap years: year % 4 === 3 (Pagume has 6 days). */
export const isEthiopianLeapYear = (y: number) => ((y % 4) + 4) % 4 === 3;

export const daysInEthiopianMonth = (y: number, m: number) =>
  m < 13 ? 30 : isEthiopianLeapYear(y) ? 6 : 5;

export const ethiopianToJdn = ({ year, month, day }: EthiopianDate): number => {
  if (month < 1 || month > 13 || day < 1 || day > daysInEthiopianMonth(year, month)) {
    throw new RangeError('Invalid Ethiopian date');
  }
  return ETHIOPIAN_EPOCH_JDN + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
};

export const jdnToEthiopian = (jdn: number): EthiopianDate => {
  const offset = jdn - ETHIOPIAN_EPOCH_JDN;
  const r = ((offset % 1461) + 1461) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year: 4 * Math.floor(offset / 1461) + Math.floor(r / 365) - Math.floor(r / 1460) + 1,
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
};

export const isoToEthiopian = (iso: string) => jdnToEthiopian(isoToJdn(iso));
export const ethiopianToIso = (d: EthiopianDate) => jdnToIso(ethiopianToJdn(d));

export const formatEthiopian = (d: EthiopianDate, locale: 'en' | 'am' = 'en') =>
  `${ETHIOPIAN_MONTHS[d.month - 1][locale]} ${d.day}, ${d.year}`;
