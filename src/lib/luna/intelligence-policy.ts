// Pure permission rules for personal intelligence. Each switch is checked on its own;
// a missing settings row means every switch is Off.
export interface IntelligencePrefs {
  use_my_world_context: boolean;
  use_my_rhythms_context: boolean;
  allow_external_ai: boolean;
  allow_background_insights: boolean;
}

export const PREFS_OFF: IntelligencePrefs = {
  use_my_world_context: false,
  use_my_rhythms_context: false,
  allow_external_ai: false,
  allow_background_insights: false,
};

export type Purpose = 'explore_entry' | 'connect_insight' | 'background_insight';

export interface ContextDecision {
  allowed: boolean;
  includeMyWorld: boolean;
  includeRhythms: boolean;
  reason?: string;
}

export function normalizePrefs(row: Partial<IntelligencePrefs> | null | undefined): IntelligencePrefs {
  return {
    use_my_world_context: row?.use_my_world_context === true,
    use_my_rhythms_context: row?.use_my_rhythms_context === true,
    allow_external_ai: row?.allow_external_ai === true,
    allow_background_insights: row?.allow_background_insights === true,
  };
}

export function decideContext(raw: Partial<IntelligencePrefs> | null | undefined, purpose: Purpose): ContextDecision {
  const p = normalizePrefs(raw);
  const deny = (reason: string): ContextDecision => ({ allowed: false, includeMyWorld: false, includeRhythms: false, reason });
  if (!p.allow_external_ai) return deny('Turn on "Send to Ask Ordiva\'s AI service" in Profile to use this.');
  if (!p.use_my_world_context) return deny('Turn on "Use My World entries" in Profile to use this.');
  if (purpose === 'background_insight' && !p.allow_background_insights) return deny('Background insights are switched off.');
  return { allowed: true, includeMyWorld: true, includeRhythms: p.use_my_rhythms_context };
}
