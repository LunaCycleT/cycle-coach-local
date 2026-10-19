import { describe, it, expect } from 'vitest';
import { findConnections, terms } from '@/utils/myworld/related';

const e = (id: string, content: string, domain = 'reflections') => ({ id, content, domain, created_at: '2026-10-01T00:00:00Z' });

describe('My World connections', () => {
  it('links entries only through words the user actually wrote', () => {
    const t = e('a', 'Thinking about leaving my job for the design studio');
    const c = findConnections(t, [t, e('b', 'The design studio called back'), e('c', 'Walked by the river')]);
    expect(c.map((x) => x.id)).toEqual(['b']);
    expect(c[0].sharedTerms).toEqual(expect.arrayContaining(['design', 'studio']));
  });
  it('never connects an entry to itself', () => {
    const t = e('a', 'garden garden garden');
    expect(findConnections(t, [t])).toEqual([]);
  });
  it('does not connect on same life area alone', () => {
    const t = e('a', 'Promotion conversation', 'career');
    expect(findConnections(t, [e('b', 'Lunch with colleagues', 'career')])).toEqual([]);
  });
  it('ignores filler words', () => {
    expect(terms('I really think that today was about this').size).toBe(0);
  });
});
