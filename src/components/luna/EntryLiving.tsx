import React, { useEffect, useState } from 'react';
import { History, MessageCircleHeart, Target, Loader2, Trash2 } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { exploreEntry } from '@/lib/luna/intelligence.functions';
import type { PersonalRecord } from '@/hooks/usePersonalRecords';

interface Followup { id: string; content: string; kind: string; created_at: string }
interface Revision { id: string; content: string; version_created_at: string; replaced_at: string }
const day = (s: string) => new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' });
const KIND: Record<string, string> = { followup: 'Follow-up', outcome: 'Outcome', action: 'Next step' };
const h3 = 'flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-900/60';
const btn = 'rounded-full bg-emerald-900 px-4 py-1.5 text-xs text-white disabled:opacity-50';

export const EntryLiving: React.FC<{ entry: PersonalRecord }> = ({ entry }) => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [text, setText] = useState('');
  const [kind, setKind] = useState('followup');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const explore = useServerFn(exploreEntry);
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [q, setQ] = useState('');
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    setChat([]); setNote(null); setSources([]);
    supabase.from('record_followups').select('id, content, kind, created_at').eq('record_id', entry.id).order('created_at')
      .then(({ data }) => setFollowups((data ?? []) as Followup[]));
    supabase.from('record_revisions').select('id, content, version_created_at, replaced_at').eq('record_id', entry.id).order('replaced_at', { ascending: false })
      .then(({ data }) => setRevisions((data ?? []) as Revision[]));
  }, [entry.id, entry.updated_at]);

  const add = async () => {
    setBusy(true); setErr(null);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('record_followups')
      .insert({ record_id: entry.id, user_id: u.user?.id ?? '', content: text.trim(), kind }).select('id, content, kind, created_at').single();
    if (error) setErr('That didn’t save. Your words are still here — please try again.');
    else { setFollowups((f) => [...f, data as Followup]); setText(''); }
    setBusy(false);
  };
  const removeF = async (id: string) => {
    const { error } = await supabase.from('record_followups').delete().eq('id', id);
    if (!error) setFollowups((f) => f.filter((x) => x.id !== id));
  };
  const ask = async (message: string) => {
    if (!message.trim()) return;
    setAsking(true); setNote(null);
    try {
      const r = await explore({ data: { recordId: entry.id, message, history: chat.slice(-10) } });
      if (r.blocked) setNote(r.blocked);
      else if (r.limitReached) setNote("You've reached today's 10 messages with Ask Ordiva. It resets at midnight UTC.");
      else { setChat((c) => [...c, { role: 'user', content: message }, { role: 'assistant', content: r.response }]); setSources(r.sources); setQ(''); }
    } catch { setNote('Ask Ordiva couldn’t answer just now. Please try again.'); }
    setAsking(false);
  };

  return (
    <>
      <section className="mt-8">
        <h3 className={h3}><History className="h-3.5 w-3.5" />Revisit</h3>
        <p className="mt-1 text-[11px] text-emerald-950/50">Add what happened next. Your original entry stays exactly as written.</p>
        <ul className="mt-3 space-y-2">
          {followups.map((f) => (
            <li key={f.id} className="rounded-2xl border-l-2 border-emerald-800/30 bg-white/60 px-4 py-3">
              <div className="flex items-center justify-between text-[11px] text-emerald-950/55">
                <span>{KIND[f.kind] ?? f.kind} · {day(f.created_at)}</span>
                <button onClick={() => removeF(f.id)} aria-label="Delete follow-up" className="p-1 hover:text-emerald-950"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-950/85">{f.content}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            {Object.entries(KIND).map(([k, l]) => (
              <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                className={`rounded-full px-3 py-1 text-[11px] ${kind === k ? 'bg-emerald-900 text-white' : 'border border-emerald-900/10 bg-white/70 text-emerald-950/75'}`}>{l}</button>
            ))}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={10000} placeholder={kind === 'action' ? 'One small next step…' : 'Looking back now…'}
            className="w-full rounded-xl border border-emerald-900/15 bg-white/80 p-3 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800/30" />
          <button disabled={busy || !text.trim()} onClick={add} className={btn}>{busy ? 'Saving…' : 'Add to this entry'}</button>
          {err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        </div>
        {revisions.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setShowHistory((s) => !s)} className="text-[11px] text-emerald-900/70 underline">
              {showHistory ? 'Hide' : 'Show'} earlier versions ({revisions.length})
            </button>
            {showHistory && <ul className="mt-2 space-y-2">{revisions.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white/40 px-4 py-3">
                <p className="text-[11px] text-emerald-950/50">Written {day(r.version_created_at)} · replaced {day(r.replaced_at)}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-950/70">{r.content}</p>
              </li>))}</ul>}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h3 className={h3}><MessageCircleHeart className="h-3.5 w-3.5" />Explore with Ordiva</h3>
        <p className="mt-1 text-[11px] text-emerald-950/50">Only works if you’ve switched on My World and the AI service in Profile. Counts toward your 10 daily messages.</p>
        <div className="mt-3 space-y-2">
          {chat.map((m, i) => (
            <p key={i} className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'ml-8 bg-emerald-900/90 text-white' : 'mr-4 bg-white/70 text-emerald-950/90'}`}>{m.content}</p>
          ))}
          {sources.length > 0 && <p className="text-[11px] text-emerald-950/50">Ordiva used: {sources.join(', ')}.</p>}
          {note && <p role="status" className="rounded-2xl bg-amber-50/80 px-4 py-3 text-xs text-emerald-950/75">{note}</p>}
          <div className="flex flex-wrap gap-2">
            <button disabled={asking} onClick={() => ask('Help me understand what this entry might be telling me.')} className="rounded-full border border-emerald-900/15 bg-white/70 px-3 py-1 text-[11px] text-emerald-950/80">Talk this through</button>
            <button disabled={asking} onClick={() => ask('Help me shape one or two gentle, concrete next steps from this.')} className="flex items-center gap-1 rounded-full border border-emerald-900/15 bg-white/70 px-3 py-1 text-[11px] text-emerald-950/80"><Target className="h-3 w-3" />Turn into action</button>
          </div>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={4000} placeholder="Ask about this entry…" onKeyDown={(e) => e.key === 'Enter' && ask(q)}
              className="min-w-0 flex-1 rounded-full border border-emerald-900/15 bg-white/80 px-4 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800/30" />
            <button disabled={asking || !q.trim()} onClick={() => ask(q)} className={btn}>{asking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}</button>
          </div>
        </div>
      </section>
    </>
  );
};
