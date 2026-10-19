import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { generateConnectionInsight } from '@/lib/luna/intelligence.functions';
import type { PersonalRecord } from '@/hooks/usePersonalRecords';

interface Insight { id: string; content: string; status: string; created_at: string; insight_sources: { record_id: string }[] }

/** Cross-entry insights. Created only by the server with consent; edits/deletions of sources invalidate or remove them. */
export const WorldInsights: React.FC<{ records: PersonalRecord[]; onOpen: (id: string) => void }> = ({ records, onOpen }) => {
  const [items, setItems] = useState<Insight[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const gen = useServerFn(generateConnectionInsight);
  const load = useCallback(async () => {
    const { data } = await supabase.from('derived_insights').select('id, content, status, created_at, insight_sources(record_id)')
      .in('status', ['active', 'invalidated']).order('created_at', { ascending: false }).limit(10);
    setItems((data ?? []) as Insight[]);
  }, []);
  // Reload when entries change, so edits and deletions are reflected.
  const sig = records.map((r) => r.id + r.updated_at).join();
  useEffect(() => { load(); }, [load, sig]);

  const run = async () => {
    setBusy(true); setNote(null);
    try {
      const r = await gen();
      if (r.blocked) setNote(r.blocked);
      else if (r.limitReached) setNote("You've reached today's 10 messages with Ask Ordiva. It resets at midnight UTC.");
      else await load();
    } catch { setNote('Ordiva couldn’t look just now. Please try again.'); }
    setBusy(false);
  };
  const dismiss = async (id: string) => {
    const it = items.find((i) => i.id === id);
    const { error } = it?.status === 'active'
      ? await supabase.from('derived_insights').update({ status: 'dismissed' }).eq('id', id)
      : await supabase.from('derived_insights').delete().eq('id', id);
    if (!error) setItems((x) => x.filter((i) => i.id !== id));
  };
  const byId = new Map(records.map((r) => [r.id, r]));
  if (records.length < 2) return null;

  return (
    <section className="mt-8 rounded-3xl border border-white/60 bg-white/55 p-5 backdrop-blur-md" aria-label="Patterns across your world">
      <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-emerald-900/60"><Sparkles className="h-3.5 w-3.5" />Threads across your world</h2>
      <p className="mt-1 text-[11px] text-emerald-950/55">Ask Ordiva to notice a gentle pattern across your entries. Each thread shows which entries it came from. Needs your permission in Profile.</p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.id} className={`rounded-2xl p-4 ${i.status === 'invalidated' ? 'bg-white/35' : 'bg-white/70'}`}>
            <div className="flex justify-between gap-2">
              <p className={`font-serif text-[15px] italic ${i.status === 'invalidated' ? 'text-emerald-950/45 line-through' : 'text-emerald-950/85'}`}>{i.content}</p>
              <button onClick={() => dismiss(i.id)} aria-label="Dismiss" className="h-fit p-1 text-emerald-900/50 hover:text-emerald-950"><X className="h-4 w-4" /></button>
            </div>
            {i.status === 'invalidated' && <p className="mt-1 text-[11px] text-emerald-950/55">One of its entries changed, so this thread may no longer fit.</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {i.insight_sources.map((s) => byId.get(s.record_id) && (
                <button key={s.record_id} onClick={() => onOpen(s.record_id)} className="max-w-full truncate rounded-full bg-emerald-900/10 px-2.5 py-0.5 text-[11px] text-emerald-900">
                  From: {byId.get(s.record_id)!.content.slice(0, 40)}…
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {note && <p role="status" className="mt-3 rounded-2xl bg-amber-50/80 px-4 py-3 text-xs text-emerald-950/75">{note}</p>}
      <button disabled={busy} onClick={run} className="mt-3 flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-1.5 text-xs text-white disabled:opacity-50">
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Find a thread
      </button>
    </section>
  );
};
