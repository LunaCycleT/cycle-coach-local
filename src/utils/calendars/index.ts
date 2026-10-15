import { parseIsoDate } from './civil';
import { formatIfc, isoToIfc } from './internationalFixed';
import { formatMarchFirst, isoToMarchFirst } from './marchFirst';
import { formatEthiopian, isoToEthiopian } from './ethiopian';

export * from './civil';
export * from './internationalFixed';
export * from './marchFirst';
export * from './ethiopian';
export * from './moonPhases';
export * from './monthView';

export type CalendarId = 'gregorian' | 'international_fixed' | 'ethiopian' | 'march_first';

export const CALENDARS: { id: CalendarId; label: string; description: string }[] = [
  { id: 'gregorian', label: 'Gregorian', description: 'Standard 12-month calendar' },
  { id: 'international_fixed', label: 'International Fixed', description: '13 months of 28 days, plus Year Day and Leap Day' },
  { id: 'ethiopian', label: 'Ethiopian', description: '12 months of 30 days plus Pagume (5 or 6 days)' },
  { id: 'march_first', label: 'March-first', description: 'Gregorian months reordered so March is Month 1' },
];

const GREGORIAN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Human-readable label for a stored ISO civil date in any supported calendar. */
export const formatInCalendar = (iso: string, calendar: CalendarId): string => {
  switch (calendar) {
    case 'international_fixed':
      return formatIfc(isoToIfc(iso));
    case 'ethiopian':
      return formatEthiopian(isoToEthiopian(iso));
    case 'march_first':
      return formatMarchFirst(isoToMarchFirst(iso));
    default: {
      const c = parseIsoDate(iso);
      return `${GREGORIAN_MONTHS[c.month - 1]} ${c.day}, ${c.year}`;
    }
  }
};
