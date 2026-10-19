import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DOMAINS = [
  { id: 'reflections', label: 'Reflections' },
  { id: 'career', label: 'Career & Work' },
  { id: 'relationships', label: 'Relationships & Family' },
  { id: 'growth', label: 'Goals & Growth' },
  { id: 'routines', label: 'Daily Routines' },
  { id: 'finances', label: 'Finances' },
  { id: 'wellness', label: 'Wellness & Rhythms' },
] as const;
export type DomainId = (typeof DOMAINS)[number]['id'];

export interface PersonalRecord {
  id: string;
  content: string;
  domain: DomainId;
  created_at: string;
  updated_at: string;
}

/** Owner-scoped My World entries (RLS enforces ownership server-side). */
export const usePersonalRecords = () => {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('personal_records').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) setError('We couldn’t open your entries. Please try again.');
    else setRecords((data ?? []) as PersonalRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (content: string, domain: DomainId) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error('Please sign in again.');
    const { data, error } = await supabase
      .from('personal_records').insert({ user_id: u.user.id, content, domain }).select().single();
    if (error) throw error;
    setRecords((r) => [data as PersonalRecord, ...r]);
  };

  const update = async (id: string, content: string, domain: DomainId) => {
    const { data, error } = await supabase
      .from('personal_records').update({ content, domain }).eq('id', id).select().single();
    if (error) throw error;
    setRecords((r) => r.map((x) => (x.id === id ? (data as PersonalRecord) : x)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('personal_records').delete().eq('id', id);
    if (error) throw error;
    setRecords((r) => r.filter((x) => x.id !== id));
  };

  return { records, loading, error, add, update, remove };
};
