import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CALENDARS, type CalendarId } from '@/utils/calendars';
import type { IgboSpelling } from '@/utils/calendars/igboMarket';

export interface CalendarPreferences {
  primary: CalendarId;
  secondary: CalendarId | null;
  showMoonPhases: boolean;
  showIgboMarket: boolean;
  igboSpelling: IgboSpelling;
  /** ISO timestamp of the last user edit; used for local/cloud conflict resolution. */
  updatedAt: string;
}

export const CALENDAR_PREFS_KEY = 'luna_calendar_preferences';
export const DEFAULT_CALENDAR_PREFS: CalendarPreferences = {
  primary: 'gregorian',
  secondary: null,
  showMoonPhases: false,
  showIgboMarket: false,
  igboSpelling: 'orie',
  updatedAt: new Date(0).toISOString(),
};

const VALID = new Set(CALENDARS.map((c) => c.id));

export const sanitizePrefs = (p: Partial<CalendarPreferences> | null | undefined): CalendarPreferences => {
  const primary = p?.primary && VALID.has(p.primary) ? p.primary : 'gregorian';
  const secondary = p?.secondary && VALID.has(p.secondary) && p.secondary !== primary ? p.secondary : null;
  return {
    primary,
    secondary,
    showMoonPhases: !!p?.showMoonPhases,
    showIgboMarket: !!p?.showIgboMarket,
    igboSpelling: p?.igboSpelling === 'oye' ? 'oye' : 'orie',
    updatedAt: p?.updatedAt && !Number.isNaN(Date.parse(p.updatedAt)) ? p.updatedAt : DEFAULT_CALENDAR_PREFS.updatedAt,
  };
};

/**
 * Conflict rule: the most recent explicit edit wins (by updatedAt).
 * Ties go to the cloud. A missing side never overwrites the other.
 */
export const resolvePrefs = (
  local: CalendarPreferences | null,
  cloud: CalendarPreferences | null,
): { winner: CalendarPreferences; pushLocal: boolean } => {
  if (!cloud && !local) return { winner: DEFAULT_CALENDAR_PREFS, pushLocal: false };
  if (!cloud) return { winner: local!, pushLocal: true };
  if (!local) return { winner: cloud, pushLocal: false };
  return Date.parse(local.updatedAt) > Date.parse(cloud.updatedAt)
    ? { winner: local, pushLocal: true }
    : { winner: cloud, pushLocal: false };
};

const readLocal = (): CalendarPreferences | null => {
  try {
    const raw = localStorage.getItem(CALENDAR_PREFS_KEY);
    return raw ? sanitizePrefs(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};
const writeLocal = (p: CalendarPreferences) => {
  try { localStorage.setItem(CALENDAR_PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
};

const pushCloud = async (userId: string, p: CalendarPreferences) => {
  const { error } = await supabase.from('user_calendar_preferences').upsert({
    user_id: userId,
    primary_calendar: p.primary,
    secondary_calendar: p.secondary,
    show_moon_phases: p.showMoonPhases,
    show_igbo_market_days: p.showIgboMarket,
    igbo_spelling: p.igboSpelling,
    updated_at: p.updatedAt,
  });
  return !error;
};

export const useCalendarPreferences = () => {
  const [prefs, setPrefs] = useState<CalendarPreferences>(DEFAULT_CALENDAR_PREFS);
  const [synced, setSynced] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const local = readLocal();
    if (local) setPrefs(local);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      userIdRef.current = user.id;
      const { data, error } = await supabase
        .from('user_calendar_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled || error) return; // offline/error: keep local, never overwrite cloud blindly
      const cloud = data
        ? sanitizePrefs({
            primary: data.primary_calendar as CalendarId,
            secondary: data.secondary_calendar as CalendarId | null,
            showMoonPhases: data.show_moon_phases,
            showIgboMarket: data.show_igbo_market_days,
            igboSpelling: data.igbo_spelling as IgboSpelling,
            updatedAt: data.updated_at,
          })
        : null;
      const { winner, pushLocal } = resolvePrefs(local, cloud);
      setPrefs(winner);
      writeLocal(winner);
      if (pushLocal) await pushCloud(user.id, winner);
      if (!cancelled) setSynced(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const update = useCallback((patch: Partial<Omit<CalendarPreferences, 'updatedAt'>>) => {
    setPrefs((prev) => {
      const next = sanitizePrefs({ ...prev, ...patch, updatedAt: new Date().toISOString() });
      writeLocal(next);
      if (userIdRef.current) void pushCloud(userIdRef.current, next);
      return next;
    });
  }, []);

  return { prefs, update, synced };
};
