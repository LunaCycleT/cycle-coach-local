import { describe, expect, it } from 'vitest';
import {
  addDaysIso, civilDateInZone, diffDaysIso, ethiopianToIso, formatInCalendar, ifcToIso,
  isEthiopianLeapYear, isoToEthiopian, isoToIfc, isoToJdn, isoToMarchFirst, jdnToIso,
  marchFirstToIso, moonPhasesBetween, parseIsoDate, phaseJde, weekdayOfJdn, daysInMarchFirstMonth,
} from '@/utils/calendars';

const START = isoToJdn('1900-01-01');
const END = isoToJdn('2100-12-31');

describe('civil dates', () => {
  it('known JDN anchors', () => {
    expect(isoToJdn('2000-01-01')).toBe(2451545);
    expect(isoToJdn('1970-01-01')).toBe(2440588);
    expect(weekdayOfJdn(isoToJdn('2026-10-15'))).toBe(4); // Thursday
  });
  it('round-trips every day 1900–2100', () => {
    for (let j = START; j <= END; j++) expect(isoToJdn(jdnToIso(j))).toBe(j);
  });
  it('rejects invalid dates', () => {
    expect(() => parseIsoDate('2023-02-29')).toThrow();
    expect(() => parseIsoDate('2026-13-01')).toThrow();
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
  });
  it('day arithmetic across year and leap boundaries', () => {
    expect(addDaysIso('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysIso('2023-12-31', 1)).toBe('2024-01-01');
    expect(diffDaysIso('2025-01-01', '2024-01-01')).toBe(366);
  });
  it('civil date of an instant depends on the zone, not UTC', () => {
    const instant = new Date('2026-03-01T03:00:00Z');
    expect(civilDateInZone(instant, 'UTC')).toBe('2026-03-01');
    expect(civilDateInZone(instant, 'America/Edmonton')).toBe('2026-02-28');
    expect(civilDateInZone(instant, 'Pacific/Auckland')).toBe('2026-03-01');
  });
});

describe('International Fixed Calendar', () => {
  it('every regular month has exactly 28 days', () => {
    for (const year of [2023, 2024, 2100, 2000]) {
      for (let m = 1; m <= 13; m++) {
        expect(isoToIfc(ifcToIso({ kind: 'month', year, month: m, day: 28 }))).toMatchObject({ kind: 'month', month: m, day: 28 });
        expect(() => ifcToIso({ kind: 'month', year, month: m, day: 29 })).toThrow();
      }
    }
  });
  it('Sol is month 7, starting the day after June 28', () => {
    expect(isoToIfc('2023-06-17')).toEqual({ kind: 'month', year: 2023, month: 6, day: 28 });
    expect(isoToIfc('2023-06-18')).toEqual({ kind: 'month', year: 2023, month: 7, day: 1 });
    expect(formatInCalendar('2023-06-18', 'international_fixed')).toBe('1 Sol 2023');
  });
  it('Year Day is December 31 and outside all months', () => {
    expect(isoToIfc('2023-12-31')).toEqual({ kind: 'year-day', year: 2023 });
    expect(isoToIfc('2024-12-31')).toEqual({ kind: 'year-day', year: 2024 });
    expect(isoToIfc('2023-12-30')).toEqual({ kind: 'month', year: 2023, month: 13, day: 28 });
  });
  it('Leap Day is June 17 in leap years only (Gregorian rules)', () => {
    expect(isoToIfc('2024-06-17')).toEqual({ kind: 'leap-day', year: 2024 });
    expect(isoToIfc('2024-06-18')).toEqual({ kind: 'month', year: 2024, month: 7, day: 1 });
    expect(isoToIfc('2000-06-17')).toEqual({ kind: 'leap-day', year: 2000 });
    expect(isoToIfc('2100-06-17').kind).toBe('month');
    expect(() => ifcToIso({ kind: 'leap-day', year: 2023 })).toThrow();
    expect(() => ifcToIso({ kind: 'leap-day', year: 2100 })).toThrow();
  });
  it('round-trips every day 1900–2100', () => {
    for (let j = START; j <= END; j++) expect(ifcToIso(isoToIfc(jdnToIso(j)))).toBe(jdnToIso(j));
  });
});

describe('March-first calendar', () => {
  it('September is Month 7, December Month 10', () => {
    expect(isoToMarchFirst('2026-09-01')).toEqual({ year: 2026, month: 7, day: 1 });
    expect(isoToMarchFirst('2026-10-15').month).toBe(8);
    expect(isoToMarchFirst('2026-11-15').month).toBe(9);
    expect(isoToMarchFirst('2026-12-31')).toEqual({ year: 2026, month: 10, day: 31 });
  });
  it('January and February belong to the year beginning the previous March', () => {
    expect(isoToMarchFirst('2027-01-15')).toEqual({ year: 2026, month: 11, day: 15 });
    expect(isoToMarchFirst('2028-02-29')).toEqual({ year: 2027, month: 12, day: 29 });
    expect(isoToMarchFirst('2027-03-01')).toEqual({ year: 2027, month: 1, day: 1 });
    expect(daysInMarchFirstMonth(2027, 12)).toBe(29);
    expect(daysInMarchFirstMonth(2026, 12)).toBe(28);
  });
  it('round-trips every day 1900–2100', () => {
    for (let j = START; j <= END; j++) expect(marchFirstToIso(isoToMarchFirst(jdnToIso(j)))).toBe(jdnToIso(j));
  });
});

describe('Ethiopian calendar', () => {
  it('known anchors', () => {
    expect(isoToEthiopian('2023-09-12')).toEqual({ year: 2016, month: 1, day: 1 }); // after leap 2015
    expect(isoToEthiopian('2024-09-11')).toEqual({ year: 2017, month: 1, day: 1 });
    expect(isoToEthiopian('2024-01-07')).toEqual({ year: 2016, month: 4, day: 28 }); // Genna falls on Tahsas 28 after a leap year
    expect(isoToEthiopian('2024-09-10')).toEqual({ year: 2016, month: 13, day: 5 });
    expect(isoToEthiopian('2023-09-11')).toEqual({ year: 2015, month: 13, day: 6 }); // Pagume 6
    expect(ethiopianToIso({ year: 2019, month: 1, day: 1 })).toBe('2026-09-11');
  });
  it('Pagume has 6 days only in leap years', () => {
    expect(isEthiopianLeapYear(2015)).toBe(true);
    expect(isEthiopianLeapYear(2016)).toBe(false);
    expect(() => ethiopianToIso({ year: 2016, month: 13, day: 6 })).toThrow();
    expect(() => ethiopianToIso({ year: 2016, month: 1, day: 31 })).toThrow();
  });
  it('round-trips every day 1900–2100', () => {
    for (let j = START; j <= END; j++) expect(ethiopianToIso(isoToEthiopian(jdnToIso(j)))).toBe(jdnToIso(j));
  });
  it('formats with English and Amharic month names', () => {
    expect(formatInCalendar('2024-09-11', 'ethiopian')).toBe('Meskerem 1, 2017');
  });
});

describe('moon phases (Meeus ch. 49)', () => {
  it('matches Meeus worked example 49.a (new moon 1977 Feb 18, JDE 2443192.65118)', () => {
    expect(phaseJde(-283, 'new')).toBeCloseTo(2443192.65118, 4);
  });
  const within = (iso: string, expectedUtc: string, minutes = 3) => {
    const ev = moonPhasesBetween(iso, iso, 'UTC')[0];
    expect(Math.abs(ev.instant.getTime() - Date.parse(expectedUtc)) / 60000).toBeLessThan(minutes);
    return ev;
  };
  it('matches published USNO phase times', () => {
    expect(within('2024-04-08', '2024-04-08T18:21Z').phase).toBe('new');
    expect(within('2024-04-23', '2024-04-23T23:49Z').phase).toBe('full');
    expect(within('2024-04-15', '2024-04-15T19:13Z').phase).toBe('first-quarter');
    expect(within('2024-05-01', '2024-05-01T11:27Z').phase).toBe('last-quarter');
    expect(within('2026-01-03', '2026-01-03T10:03Z').phase).toBe('full');
  });
  it('assigns phase dates in the user time zone', () => {
    // Full moon 2024-04-23 23:49 UTC is April 23 in Edmonton, April 24 in Tokyo
    expect(moonPhasesBetween('2024-04-23', '2024-04-24', 'America/Edmonton').map((e) => e.date)).toEqual(['2024-04-23']);
    expect(moonPhasesBetween('2024-04-23', '2024-04-24', 'Asia/Tokyo').map((e) => e.date)).toEqual(['2024-04-24']);
  });
  it('produces 4 phases per lunation in order', () => {
    const events = moonPhasesBetween('2025-01-01', '2025-12-31', 'UTC');
    expect(events.length).toBeGreaterThanOrEqual(48);
    expect(events.length).toBeLessThanOrEqual(50);
    const order = ['new', 'first-quarter', 'full', 'last-quarter'];
    for (let i = 1; i < events.length; i++) {
      expect(order.indexOf(events[i].phase)).toBe((order.indexOf(events[i - 1].phase) + 1) % 4);
    }
  });
});

describe('cross-calendar identity', () => {
  it('the same stored day is the same real-world day in every calendar', () => {
    for (const iso of ['2024-02-29', '2024-06-17', '2024-12-31', '2027-01-15', '2026-09-11']) {
      expect(ifcToIso(isoToIfc(iso))).toBe(iso);
      expect(marchFirstToIso(isoToMarchFirst(iso))).toBe(iso);
      expect(ethiopianToIso(isoToEthiopian(iso))).toBe(iso);
    }
  });
});
