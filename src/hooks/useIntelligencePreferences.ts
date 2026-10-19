import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PREFS_OFF, normalizePrefs, type IntelligencePrefs } from '@/lib/luna/intelligence-policy';

/** Owner-only privacy switches. The server re-reads these before every use; this is just the UI. */
export const useIntelligencePreferences = () => {
  const [prefs, setPrefs] = useState<IntelligencePrefs>(PREFS_OFF);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('intelligence_preferences').select('*').maybeSingle();
    setPrefs(normalizePrefs(data));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = async (key: keyof IntelligencePrefs, value: boolean) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error('Please sign in again.');
    const next = { ...prefs, [key]: value };
    const { error } = await supabase.from('intelligence_preferences').upsert({ user_id: u.user.id, ...next });
    if (error) throw error;
    setPrefs(next);
  };
  return { prefs, loading, set };
};
