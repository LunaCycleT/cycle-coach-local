import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SessionLabel, SleepInterval, SleepSessionInput } from '@/utils/sleep/sleepCalculations';

export interface SleepNight {
  id: string;
  sleepDate: string;
  timezone: string;
  restfulness: number | null;
  reportedAwakenings: number | null;
  notes: string | null;
  sessions: (SleepSessionInput & { id: string })[];
  awakenings: SleepInterval[];
}

export interface SleepNightDraft {
  sleepDate: string;
  timezone: string;
  restfulness: number | null;
  reportedAwakenings: number | null;
  notes: string | null;
  sessions: SleepSessionInput[];
  awakenings: SleepInterval[];
}

/** Owner-scoped sleep data (RLS enforces the same rule server-side). */
export const useSleepNights = (days = 30) => {
  const [nights, setNights] = useState<SleepNight[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);
    if (!uid) { setLoading(false); return; }
    const { data: ns } = await supabase
      .from('sleep_nights').select('*').order('sleep_date', { ascending: false }).limit(days);
    const ids = (ns ?? []).map((n) => n.id);
    const [{ data: ss }, { data: aw }] = ids.length
      ? await Promise.all([
          supabase.from('sleep_sessions').select('*').in('night_id', ids).order('started_at'),
          supabase.from('sleep_awakenings').select('*').in('night_id', ids).order('started_at'),
        ])
      : [{ data: [] }, { data: [] }];
    setNights((ns ?? []).map((n) => ({
      id: n.id,
      sleepDate: n.sleep_date,
      timezone: n.timezone,
      restfulness: n.restfulness_rating,
      reportedAwakenings: n.reported_awakening_count,
      notes: n.notes,
      sessions: (ss ?? []).filter((s) => s.night_id === n.id).map((s) => ({
        id: s.id, startedAt: s.started_at, endedAt: s.ended_at, label: s.session_label as SessionLabel | null,
      })),
      awakenings: (aw ?? []).filter((a) => a.night_id === n.id).map((a) => ({ startedAt: a.started_at, endedAt: a.ended_at })),
    })));
    setLoading(false);
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  /** Create or replace a night (same date = edit). */
  const saveNight = useCallback(async (draft: SleepNightDraft, replacingDate?: string) => {
    if (!userId) throw new Error('Please sign in again.');
    if (replacingDate && replacingDate !== draft.sleepDate) {
      await supabase.from('sleep_nights').delete().eq('user_id', userId).eq('sleep_date', replacingDate);
    }
    const { data: night, error } = await supabase.from('sleep_nights').upsert({
      user_id: userId,
      sleep_date: draft.sleepDate,
      timezone: draft.timezone,
      restfulness_rating: draft.restfulness,
      reported_awakening_count: draft.reportedAwakenings,
      notes: draft.notes?.trim() || null,
    }, { onConflict: 'user_id,sleep_date' }).select().single();
    if (error || !night) throw new Error(error?.message ?? 'Could not save');
    await supabase.from('sleep_sessions').delete().eq('night_id', night.id);
    await supabase.from('sleep_awakenings').delete().eq('night_id', night.id);
    if (draft.sessions.length) {
      const { error: e } = await supabase.from('sleep_sessions').insert(draft.sessions.map((s) => ({
        night_id: night.id, user_id: userId, started_at: s.startedAt, ended_at: s.endedAt, session_label: s.label ?? null,
      })));
      if (e) throw new Error(e.code === '23P01' ? 'This overlaps sleep you already logged.' : e.message);
    }
    if (draft.awakenings.length) {
      const { error: e } = await supabase.from('sleep_awakenings').insert(draft.awakenings.map((a) => ({
        night_id: night.id, user_id: userId, started_at: a.startedAt, ended_at: a.endedAt,
      })));
      if (e) throw new Error(e.message);
    }
    await load();
  }, [userId, load]);

  const deleteNight = useCallback(async (id: string) => {
    await supabase.from('sleep_nights').delete().eq('id', id);
    await load();
  }, [load]);

  return { nights, loading, saveNight, deleteNight, reload: load };
};
