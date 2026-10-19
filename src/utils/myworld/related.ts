/**
 * Deterministic, on-device relatedness between a user's own My World entries.
 * No AI, no network: matches only what the user actually wrote, and returns the
 * evidence (shared words / same life area) so every connection is explainable.
 */
export interface EntryLike { id: string; content: string; domain: string; created_at: string }
export interface Connection { id: string; sharedTerms: string[]; sameDomain: boolean; score: number }

const STOP = new Set(('a an and the or but if so to of in on at for with from by as is are was were be been being am i me my mine we our you your it its this that these those there here have has had do does did not no yes just very really about into over than then too can could would should will shall may might must what when where who why how all any some more most much many also only out up down again still even because while after before today yesterday tomorrow feel felt think thought know like get got going go went one thing things time day really').split(' '));

export const terms = (text: string): Set<string> => {
  const out = new Set<string>();
  for (const w of text.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').split(/\s+/)) {
    const t = w.replace(/^['-]+|['-]+$/g, '');
    if (t.length >= 4 && !STOP.has(t)) out.add(t.length > 5 && t.endsWith('s') ? t.slice(0, -1) : t);
  }
  return out;
};

export const findConnections = (target: EntryLike, all: EntryLike[], limit = 5): Connection[] => {
  const base = terms(target.content);
  return all
    .filter((e) => e.id !== target.id)
    .map((e) => {
      const shared = [...terms(e.content)].filter((t) => base.has(t));
      const sameDomain = e.domain === target.domain;
      return { id: e.id, sharedTerms: shared.slice(0, 6), sameDomain, score: shared.length * 2 + (sameDomain ? 1 : 0) };
    })
    .filter((c) => c.sharedTerms.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
