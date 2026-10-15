/**
 * Astronomical moon phases using Jean Meeus, "Astronomical Algorithms"
 * (2nd ed., ch. 49): mean phase + periodic and planetary corrections.
 * Accuracy is a few seconds to ~1 minute for modern dates.
 * Astronomical information only — Luna makes no claim linking it to menstrual cycles.
 */
import { civilDateInZone, isoToJdn } from './civil';

export type MoonPhase = 'new' | 'first-quarter' | 'full' | 'last-quarter';

export const MOON_PHASE_LABELS: Record<MoonPhase, string> = {
  new: 'New moon',
  'first-quarter': 'First quarter',
  full: 'Full moon',
  'last-quarter': 'Last quarter',
};

const PHASE_OFFSET: Record<MoonPhase, number> = { new: 0, 'first-quarter': 0.25, full: 0.5, 'last-quarter': 0.75 };
const rad = (deg: number) => (deg * Math.PI) / 180;
const sin = (deg: number) => Math.sin(rad(deg));
const cos = (deg: number) => Math.cos(rad(deg));

/** Julian Ephemeris Day (TT) of the phase for lunation k (k integer + phase offset). */
export const phaseJde = (k: number, phase: MoonPhase): number => {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;

  let c: number;
  if (phase === 'new' || phase === 'full') {
    const n = phase === 'new';
    c =
      (n ? -0.4072 : -0.40614) * sin(Mp) +
      (n ? 0.17241 : 0.17302) * E * sin(M) +
      (n ? 0.01608 : 0.01614) * sin(2 * Mp) +
      (n ? 0.01039 : 0.01043) * sin(2 * F) +
      (n ? 0.00739 : 0.00734) * E * sin(Mp - M) -
      (n ? 0.00514 : 0.00515) * E * sin(Mp + M) +
      (n ? 0.00208 : 0.00209) * E * E * sin(2 * M) -
      0.00111 * sin(Mp - 2 * F) -
      0.00057 * sin(Mp + 2 * F) +
      0.00056 * E * sin(2 * Mp + M) -
      0.00042 * sin(3 * Mp) +
      0.00042 * E * sin(M + 2 * F) +
      0.00038 * E * sin(M - 2 * F) -
      0.00024 * E * sin(2 * Mp - M) -
      0.00017 * sin(O) -
      0.00007 * sin(Mp + 2 * M) +
      0.00004 * sin(2 * Mp - 2 * F) +
      0.00004 * sin(3 * M) +
      0.00003 * sin(Mp + M - 2 * F) +
      0.00003 * sin(2 * Mp + 2 * F) -
      0.00003 * sin(Mp + M + 2 * F) +
      0.00003 * sin(Mp - M + 2 * F) -
      0.00002 * sin(Mp - M - 2 * F) -
      0.00002 * sin(3 * Mp + M) +
      0.00002 * sin(4 * Mp);
  } else {
    c =
      -0.62801 * sin(Mp) +
      0.17172 * E * sin(M) -
      0.01183 * E * sin(Mp + M) +
      0.00862 * sin(2 * Mp) +
      0.00804 * sin(2 * F) +
      0.00454 * E * sin(Mp - M) +
      0.00204 * E * E * sin(2 * M) -
      0.0018 * sin(Mp - 2 * F) -
      0.0007 * sin(Mp + 2 * F) -
      0.0004 * sin(3 * Mp) -
      0.00034 * E * sin(2 * Mp - M) +
      0.00032 * E * sin(M + 2 * F) +
      0.00032 * E * sin(M - 2 * F) -
      0.00028 * E * E * sin(Mp + 2 * M) +
      0.00027 * E * sin(2 * Mp + M) -
      0.00017 * sin(O) -
      0.00005 * sin(Mp - M - 2 * F) +
      0.00004 * sin(2 * Mp + 2 * F) -
      0.00004 * sin(Mp + M + 2 * F) +
      0.00004 * sin(Mp - 2 * M) +
      0.00003 * sin(Mp + M - 2 * F) +
      0.00003 * sin(3 * M) +
      0.00002 * sin(2 * Mp - 2 * F) +
      0.00002 * sin(Mp - M + 2 * F) -
      0.00002 * sin(3 * Mp + M);
    const W =
      0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp) - 0.00002 * cos(Mp - M) +
      0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
    c += phase === 'first-quarter' ? W : -W;
  }

  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 325],
    [251.88 + 0.016321 * k, 165],
    [251.83 + 26.651886 * k, 164],
    [349.42 + 36.412478 * k, 126],
    [84.66 + 18.206239 * k, 110],
    [141.74 + 53.303771 * k, 62],
    [207.14 + 2.453732 * k, 60],
    [154.84 + 7.30686 * k, 56],
    [34.52 + 27.261239 * k, 47],
    [207.19 + 0.121824 * k, 42],
    [291.34 + 1.844379 * k, 40],
    [161.72 + 24.198154 * k, 37],
    [239.56 + 25.513099 * k, 35],
    [331.55 + 3.592518 * k, 23],
  ];
  for (const [arg, coef] of A as [number, number][]) c += coef * 1e-6 * sin(arg);
  jde += c;
  return jde;
};

/** ΔT (TT − UT) in seconds, Espenak & Meeus polynomial for 2005–2050, coarse outside. */
const deltaTSeconds = (year: number) => {
  if (year >= 2005 && year < 2050) {
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
};

const JD_UNIX_EPOCH = 2440587.5;

/** UTC instant of a phase. */
export const phaseInstant = (k: number, phase: MoonPhase): Date => {
  const jde = phaseJde(k, phase);
  const approxYear = 2000 + k / 12.3685;
  const jdUt = jde - deltaTSeconds(approxYear) / 86400;
  return new Date(Math.round((jdUt - JD_UNIX_EPOCH) * 86400000));
};

export interface MoonPhaseEvent {
  phase: MoonPhase;
  instant: Date;
  /** Civil date of the event in the requested time zone. */
  date: string;
}

/**
 * All principal phases whose local civil date falls within [startIso, endIso].
 * timeZone is an IANA zone (defaults to the runtime's zone).
 */
export const moonPhasesBetween = (startIso: string, endIso: string, timeZone?: string): MoonPhaseEvent[] => {
  const startJd = isoToJdn(startIso) - 1;
  const endJd = isoToJdn(endIso) + 1;
  // JDN → approx k (lunations since 2000-01-06)
  const kStart = Math.floor((startJd - 2451550.1) / 29.530588861) - 1;
  const kEnd = Math.ceil((endJd - 2451550.1) / 29.530588861) + 1;
  const out: MoonPhaseEvent[] = [];
  for (let k = kStart; k <= kEnd; k++) {
    for (const phase of Object.keys(PHASE_OFFSET) as MoonPhase[]) {
      const instant = phaseInstant(k + PHASE_OFFSET[phase], phase);
      const date = civilDateInZone(instant, timeZone);
      if (date >= startIso && date <= endIso) out.push({ phase, instant, date });
    }
  }
  return out.sort((a, b) => a.instant.getTime() - b.instant.getTime());
};
