import { describe, expect, it } from 'vitest';
import {
  assignSleepNight,
  durationMinutes,
  summarizeNight,
  validateSessions,
  zonedTimeToInstant,
} from '@/utils/sleep/sleepCalculations';

const TZ = 'America/Edmonton';
const at = (d: string, t: string, tz = TZ) => zonedTimeToInstant(d, t, tz);

describe('durations', () => {
  it('spans midnight', () => {
    expect(durationMinutes({ startedAt: at('2026-10-14', '23:00'), endedAt: at('2026-10-15', '07:00') })).toBe(480);
  });
  it('fall-back DST night is one hour longer', () => {
    // Edmonton falls back 2026-11-01 02:00 -> 01:00
    expect(durationMinutes({ startedAt: at('2026-10-31', '22:00'), endedAt: at('2026-11-01', '06:00') })).toBe(540);
  });
  it('spring-forward DST night is one hour shorter', () => {
    // Edmonton springs forward 2026-03-08 02:00 -> 03:00
    expect(durationMinutes({ startedAt: at('2026-03-07', '22:00'), endedAt: at('2026-03-08', '06:00') })).toBe(420);
  });
  it('nonexistent spring-forward time still resolves', () => {
    expect(() => at('2026-03-08', '02:30')).not.toThrow();
  });
  it('other zones', () => {
    expect(durationMinutes({ startedAt: at('2026-03-07', '23:00', 'America/New_York'), endedAt: at('2026-03-08', '07:00', 'America/New_York') })).toBe(420);
    expect(durationMinutes({ startedAt: at('2026-03-28', '23:00', 'Europe/London'), endedAt: at('2026-03-29', '07:00', 'Europe/London') })).toBe(420);
  });
});

describe('sleep-night grouping', () => {
  it('evening and post-midnight starts share a night', () => {
    expect(assignSleepNight(at('2026-10-14', '21:00'), TZ)).toBe('2026-10-14');
    expect(assignSleepNight(at('2026-10-15', '03:00'), TZ)).toBe('2026-10-14');
  });
  it('daytime nap and day-sleep (shift work) belong to that day', () => {
    expect(assignSleepNight(at('2026-10-15', '14:00'), TZ)).toBe('2026-10-15');
    expect(assignSleepNight(at('2026-10-15', '08:30'), TZ)).toBe('2026-10-15');
  });
  it('uses the user zone, not UTC', () => {
    const inst = at('2026-10-14', '22:00'); // 04:00Z next day
    expect(assignSleepNight(inst, TZ)).toBe('2026-10-14');
    expect(assignSleepNight(inst, 'UTC')).toBe('2026-10-14');
    expect(assignSleepNight(inst, 'Asia/Tokyo')).toBe('2026-10-15');
  });
  it('year boundary', () => {
    expect(assignSleepNight(at('2027-01-01', '01:00'), TZ)).toBe('2026-12-31');
  });
});

describe('overlap validation', () => {
  const a = { startedAt: at('2026-10-14', '21:00'), endedAt: at('2026-10-15', '01:00') };
  const b = { startedAt: at('2026-10-15', '03:00'), endedAt: at('2026-10-15', '07:00') };
  it('accepts separated sessions and touching edges', () => {
    expect(validateSessions([a, b])).toEqual([]);
    expect(validateSessions([a, { startedAt: a.endedAt, endedAt: b.endedAt }])).toEqual([]);
  });
  it('rejects overlaps within the form and against saved sessions', () => {
    const c = { startedAt: at('2026-10-15', '00:00'), endedAt: at('2026-10-15', '02:00') };
    expect(validateSessions([a, c])).toContainEqual({ kind: 'overlap', index: 1, other: 0 });
    expect(validateSessions([c], [{ ...a, id: 'x' }])).toContainEqual({ kind: 'overlap', index: 0, other: 'existing' });
  });
  it('ignores the session being edited', () => {
    expect(validateSessions([{ ...a, id: 'x' }], [{ ...a, id: 'x' }])).toEqual([]);
  });
  it('rejects end before start and >24h', () => {
    expect(validateSessions([{ startedAt: a.endedAt, endedAt: a.startedAt }])[0]?.kind).toBe('invalid-range');
    expect(validateSessions([{ startedAt: at('2026-10-13', '20:00'), endedAt: at('2026-10-14', '21:00') }])[0]?.kind).toBe('too-long');
  });
});

describe('night summary and awakenings', () => {
  const first = { startedAt: at('2026-10-14', '21:00'), endedAt: at('2026-10-15', '01:00'), label: 'first_sleep' as const };
  const second = { startedAt: at('2026-10-15', '03:00'), endedAt: at('2026-10-15', '07:00'), label: 'second_sleep' as const };

  it('spec example: segmented 8h, 1 awakening, 2h awake', () => {
    const s = summarizeNight([second, first]);
    expect(s).toMatchObject({ totalSleepMinutes: 480, gapAwakenings: 1, awakeningCount: 1, knownAwakeMinutes: 120, longestSessionMinutes: 240, pattern: 'segmented' });
    expect(s.bedtime).toBe(first.startedAt);
    expect(s.finalWake).toBe(second.endedAt);
  });
  it('explicit interval matching the gap is not double counted', () => {
    const s = summarizeNight([first, second], [{ startedAt: first.endedAt, endedAt: second.startedAt }]);
    expect(s.awakeningCount).toBe(1);
    expect(s.knownAwakeMinutes).toBe(120);
  });
  it('reported count reconciles with the gap rather than adding to it', () => {
    expect(summarizeNight([first, second], [], 1).awakeningCount).toBe(1);
    expect(summarizeNight([first, second], [], 3).awakeningCount).toBe(3);
  });
  it('count without timestamps never invents a duration', () => {
    const one = { startedAt: at('2026-10-14', '22:00'), endedAt: at('2026-10-15', '06:00') };
    const s = summarizeNight([one], [], 2);
    expect(s).toMatchObject({ awakeningCount: 2, knownAwakeMinutes: 0, pattern: 'continuous' });
  });
  it('explicit interval inside one session counts', () => {
    const one = { startedAt: at('2026-10-14', '22:00'), endedAt: at('2026-10-15', '06:00') };
    const s = summarizeNight([one], [{ startedAt: at('2026-10-15', '02:00'), endedAt: at('2026-10-15', '02:20') }], 1);
    expect(s).toMatchObject({ awakeningCount: 1, knownAwakeMinutes: 20 });
  });
  it('nap makes the day biphasic and is excluded from night gaps', () => {
    const one = { startedAt: at('2026-10-14', '23:00'), endedAt: at('2026-10-15', '06:00') };
    const nap = { startedAt: at('2026-10-15', '14:00'), endedAt: at('2026-10-15', '14:40'), label: 'nap' as const };
    const s = summarizeNight([one, nap]);
    expect(s).toMatchObject({ pattern: 'biphasic', gapAwakenings: 0, napMinutes: 40, totalSleepMinutes: 460 });
  });
  it('empty night', () => {
    expect(summarizeNight([]).pattern).toBe('none');
  });
});
