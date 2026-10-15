/**
 * Igbo four-day market cycle (Izu): Eke → Orie/Oye → Afọ → Nkwọ, repeating without interruption.
 *
 * Reference convention (a modern computational convention, NOT a universal authority):
 *   1 January 2026 = Orie, as published by AfroTools' Igbo Market Day Finder and Ozikoro's
 *   Igbo calendar, and consistent with Chukwuemeka Ezekwe's Igbo Market Days Planners
 *   (1 Jan 2024 = Afọ, 1 Jan 2025 = Eke). Equivalent to index = (JDN + 3) mod 4.
 * Individual communities may reckon market days differently; this overlay shows only the
 * four-day cycle. Thirteen-month years, month names and intercalary rules are not modelled.
 * Works on ISO civil dates only, so it never depends on a device timezone.
 */
import { isoToJdn } from './civil';

export type IgboSpelling = 'orie' | 'oye';
export const IGBO_ANCHOR = { iso: '2026-01-01', index: 1 } as const;

const NAMES = ['Eke', 'Orie', 'Afọ', 'Nkwọ'] as const;
const PLAIN = ['Eke', 'Orie', 'Afo', 'Nkwo'] as const;

export interface IgboMarketDay {
  index: 0 | 1 | 2 | 3;
  name: string;
  /** ASCII fallback spelling. */
  plain: string;
  short: string;
}

const mod4 = (n: number) => ((n % 4) + 4) % 4;

export const igboMarketIndex = (iso: string): 0 | 1 | 2 | 3 =>
  mod4(isoToJdn(iso) - isoToJdn(IGBO_ANCHOR.iso) + IGBO_ANCHOR.index) as 0 | 1 | 2 | 3;

export const igboMarketDay = (iso: string, spelling: IgboSpelling = 'orie'): IgboMarketDay => {
  const index = igboMarketIndex(iso);
  const oye = index === 1 && spelling === 'oye';
  const name = oye ? 'Oye' : NAMES[index];
  return { index, name, plain: oye ? 'Oye' : PLAIN[index], short: name.slice(0, 3) };
};

export const IGBO_MARKET_NOTE =
  'Shows the four-day Igbo market cycle (Eke, Orie/Oye, Afọ, Nkwọ). Ordiva counts from a published reference date, 1 January 2026 = Orie. Some communities may reckon market days differently, so check locally for important events.';
