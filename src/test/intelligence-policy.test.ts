import { describe, it, expect } from 'vitest';
import { decideContext, PREFS_OFF } from '@/lib/luna/intelligence-policy';

const on = { use_my_world_context: true, use_my_rhythms_context: true, allow_external_ai: true, allow_background_insights: true };

describe('intelligence permissions', () => {
  it('missing settings deny everything', () => {
    expect(decideContext(null, 'explore_entry').allowed).toBe(false);
    expect(decideContext(PREFS_OFF, 'connect_insight').allowed).toBe(false);
  });
  it('external AI off blocks even with My World on', () => {
    expect(decideContext({ ...on, allow_external_ai: false }, 'explore_entry').allowed).toBe(false);
  });
  it('My World off blocks even with external AI on', () => {
    expect(decideContext({ ...on, use_my_world_context: false }, 'explore_entry').allowed).toBe(false);
  });
  it('rhythms only included when its own switch is on', () => {
    expect(decideContext({ ...on, use_my_rhythms_context: false }, 'explore_entry')).toMatchObject({ allowed: true, includeRhythms: false });
    expect(decideContext(on, 'explore_entry').includeRhythms).toBe(true);
  });
  it('background insights need their own switch', () => {
    expect(decideContext({ ...on, allow_background_insights: false }, 'background_insight').allowed).toBe(false);
    expect(decideContext({ ...on, allow_background_insights: false }, 'connect_insight').allowed).toBe(true);
    expect(decideContext(on, 'background_insight').allowed).toBe(true);
  });
  it('non-boolean values count as off', () => {
    expect(decideContext({ ...on, allow_external_ai: 'true' as unknown as boolean }, 'explore_entry').allowed).toBe(false);
  });
});
