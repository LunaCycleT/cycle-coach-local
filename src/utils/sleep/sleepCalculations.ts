/**
 * Ordiva Sleep Rhythms — pure calculation engine.
 * Instants are absolute (UTC epoch); sleep nights are canonical ISO civil dates
 * so they render through the shared calendar layer. Durations are always
 * elapsed time (end - start), which is correct across midnight and DST.
 */
import { addDaysIso, civilDateInZone, parseIsoDate } from '@/utils/calendars/civil';

export type SessionLabel = 'first_sleep' | 'second_sleep' | 'nap' | 'other';

export interface SleepInterval {
  startedAt: string; // ISO instant
  endedAt: string; // ISO instant
}
export interface SleepSessionInput extends SleepInterval {
  id?: string;
  label?: SessionLabel | null;
}

export const RESTFULNESS_LABELS = ['Exhausted', 'Tired', 'Okay', 'Rested', 'Refreshed'] as const;
export const SESSION_LABELS: Record<SessionLabel, string> = {
  first_sleep: 'First Sleep',
  second_sleep: 'Second Sleep',
  nap: 'Nap',
  other: 'Other',
};

/** Local hour before which a session belongs to the previous evening's night. */
export const NIGHT_ROLLOVER_HOUR = 6;
const MIN = 60_000;
/** Gaps shorter than this between sessions are treated as continuous sleep. */
export const MIN_GAP_MINUTES = 5;

const ms = (iso: string) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new RangeError(`Invalid instant: ${iso}`);
  return t;
};

export const durationMinutes = (i: SleepInterval) => Math.round((ms(i.endedAt) - ms(i.startedAt)) / MIN);

/** Wall-clock parts of an instant in an IANA zone. */
export const localParts = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
};

const zoneOffsetMs = (t: number, timeZone: string) => {
  const p = localParts(new Date(t), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(t / MIN) * MIN;
};

/**
 * Wall-clock date + "HH:MM" in a zone -> absolute instant (ISO).
 * Ambiguous fall-back times resolve to the first occurrence; nonexistent
 * spring-forward times shift forward by the gap (like most OS clocks).
 */
export const zonedTimeToInstant = (isoDate: string, hhmm: string, timeZone: string): string => {
  const { year, month, day } = parseIsoDate(isoDate);
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) throw new RangeError(`Invalid time: ${hhmm}`);
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) throw new RangeError(`Invalid time: ${hhmm}`);
  const wall = Date.UTC(year, month - 1, day, h, mi);
  const candidates = [zoneOffsetMs(wall - 864e5 / 2, timeZone), zoneOffsetMs(wall + 864e5 / 2, timeZone)]
    .map((off) => wall - off)
    .filter((t) => {
      const p = localParts(new Date(t), timeZone);
      return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) === wall;
    })
    .sort((a, b) => a - b);
  const t = candidates[0] ?? wall - zoneOffsetMs(wall - 864e5 / 2, timeZone);
  return new Date(t).toISOString();
};

/** Canonical sleep night for a session start (before 06:00 local = previous evening). */
export const assignSleepNight = (startedAt: string, timeZone: string): string => {
  const d = new Date(ms(startedAt));
  const date = civilDateInZone(d, timeZone);
  return localParts(d, timeZone).hour < NIGHT_ROLLOVER_HOUR ? addDaysIso(date, -1) : date;
};

export const intervalsOverlap = (a: SleepInterval, b: SleepInterval) =>
  ms(a.startedAt) < ms(b.endedAt) && ms(b.startedAt) < ms(a.endedAt);

export type ValidationIssue =
  | { kind: 'invalid-range'; index: number }
  | { kind: 'too-long'; index: number }
  | { kind: 'overlap'; index: number; other: number | 'existing' };

/** Validate new sessions against each other and against already-saved ones. */
export const validateSessions = (
  sessions: SleepSessionInput[],
  existing: SleepSessionInput[] = [],
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  sessions.forEach((s, i) => {
    const d = ms(s.endedAt) - ms(s.startedAt);
    if (d <= 0) issues.push({ kind: 'invalid-range', index: i });
    else if (d > 24 * 60 * MIN) issues.push({ kind: 'too-long', index: i });
  });
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      if (intervalsOverlap(sessions[i]!, sessions[j]!)) issues.push({ kind: 'overlap', index: j, other: i });
    }
    if (existing.some((e) => e.id !== sessions[i]!.id && intervalsOverlap(sessions[i]!, e)))
      issues.push({ kind: 'overlap', index: i, other: 'existing' });
  }
  return issues;
};

export type SleepPattern = 'none' | 'continuous' | 'segmented' | 'biphasic';

export interface NightSummary {
  sessionCount: number;
  totalSleepMinutes: number;
  napMinutes: number;
  longestSessionMinutes: number;
  bedtime: string | null;
  finalWake: string | null;
  /** Gaps between consecutive nighttime sessions. */
  gapAwakenings: number;
  /** Explicit awakening intervals not already covered by a gap. */
  explicitAwakenings: number;
  reportedAwakenings: number | null;
  /** Reconciled count — never double counts gaps that the user also logged. */
  awakeningCount: number;
  /** Only known (timestamped) wakefulness; never invented from a bare count. */
  knownAwakeMinutes: number;
  pattern: SleepPattern;
}

export const summarizeNight = (
  sessions: SleepSessionInput[],
  awakenings: SleepInterval[] = [],
  reportedAwakeningCount: number | null = null,
): NightSummary => {
  const sorted = [...sessions].sort((a, b) => ms(a.startedAt) - ms(b.startedAt));
  const naps = sorted.filter((s) => s.label === 'nap');
  const night = sorted.filter((s) => s.label !== 'nap');

  const gaps: SleepInterval[] = [];
  for (let i = 1; i < night.length; i++) {
    const gap = { startedAt: night[i - 1]!.endedAt, endedAt: night[i]!.startedAt };
    if (durationMinutes(gap) >= MIN_GAP_MINUTES) gaps.push(gap);
  }
  const extra = awakenings.filter((a) => durationMinutes(a) > 0 && !gaps.some((g) => intervalsOverlap(a, g)));
  const structural = gaps.length + extra.length;
  const reported = reportedAwakeningCount ?? null;

  const durations = sorted.map(durationMinutes);
  const nightDur = night.map(durationMinutes);
  return {
    sessionCount: sorted.length,
    totalSleepMinutes: durations.reduce((a, b) => a + b, 0),
    napMinutes: naps.map(durationMinutes).reduce((a, b) => a + b, 0),
    longestSessionMinutes: durations.length ? Math.max(...durations) : 0,
    bedtime: night[0]?.startedAt ?? sorted[0]?.startedAt ?? null,
    finalWake: night.at(-1)?.endedAt ?? sorted.at(-1)?.endedAt ?? null,
    gapAwakenings: gaps.length,
    explicitAwakenings: extra.length,
    reportedAwakenings: reported,
    awakeningCount: Math.max(structural, reported ?? 0),
    knownAwakeMinutes: [...gaps, ...extra].map(durationMinutes).reduce((a, b) => a + b, 0),
    pattern: !sorted.length
      ? 'none'
      : gaps.length > 0
        ? 'segmented'
        : naps.length > 0 && night.length > 0
          ? 'biphasic'
          : 'continuous',
  };
};

export const formatMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
};

export const PATTERN_LABELS: Record<SleepPattern, string> = {
  none: 'No sleep logged',
  continuous: 'One continuous sleep',
  segmented: 'Segmented sleep',
  biphasic: 'Night sleep plus a nap',
};

/** Compact, authorized-summary shape for a future Ask Ordiva integration. */
export const toAssistantSummary = (sleepDate: string, s: NightSummary, restfulness: number | null) => ({
  sleepDate,
  totalSleep: formatMinutes(s.totalSleepMinutes),
  sessions: s.sessionCount,
  awakenings: s.awakeningCount,
  pattern: PATTERN_LABELS[s.pattern],
  restfulness: restfulness ? RESTFULNESS_LABELS[restfulness - 1] : null,
});
