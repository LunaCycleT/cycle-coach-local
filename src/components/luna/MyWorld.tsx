import React, { useState } from 'react';
import { Feather, BookOpen, HeartHandshake, Sprout, Lock, Pencil, Trash2, Loader2 } from 'lucide-react';
import gardenBg from '@/assets/my-world-garden.jpg';
import { DOMAINS, usePersonalRecords, type DomainId, type PersonalRecord } from '@/hooks/usePersonalRecords';

const panel = 'rounded-3xl border border-white/60 bg-white/65 shadow-[0_18px_50px_-20px_rgba(45,74,62,0.35)] backdrop-blur-md';
const label = (d: string) => DOMAINS.find((x) => x.id === d)?.label ?? d;

const DomainChips: React.FC<{ value: string; onChange: (d: any) => void; withAll?: boolean }> = ({ value, onChange, withAll }) => (
  <div className="flex flex-wrap gap-2">
    {(withAll ? [{ id: 'all', label: 'All' }, ...DOMAINS] : DOMAINS).map((d) => (
      <button
        key={d.id}
        type="button"
        onClick={() => onChange(d.id)}
        aria-pressed={value === d.id}
        className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
          value === d.id ? 'bg-emerald-900 text-white' : 'bg-white/70 text-emerald-950/75 border border-emerald-900/10'
        }`}
      >
        {d.label}
      </button>
    ))}
  </div>
);

const Entry: React.FC<{ r: PersonalRecord; onSave: (c: string, d: DomainId) => Promise<void>; onDelete: () => Promise<void> }> = ({ r, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.content);
  const [domain, setDomain] = useState<DomainId>(r.domain);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr(null);
    try { await fn(); } catch { setErr('That didn’t save. Your words are still here — please try again.'); }
    setBusy(false);
  };
  return (
    <article className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-900/10 px-2.5 py-0.5 text-[11px] text-emerald-900">{label(r.domain)}</span>
        <time className="text-[11px] text-emerald-950/55">
          {new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
      </div>
      {editing ? (
        <div className="mt-3 space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={10000}
            className="w-full rounded-xl border border-emerald-900/15 bg-white/80 p-3 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-800/30" />
          <DomainChips value={domain} onChange={setDomain} />
          <div className="flex gap-2">
            <button disabled={busy || !text.trim()} onClick={() => run(async () => { await onSave(text.trim(), domain); setEditing(false); })}
              className="rounded-full bg-emerald-900 px-4 py-1.5 text-xs text-white disabled:opacity-50">Save changes</button>
            <button onClick={() => { setEditing(false); setText(r.content); setDomain(r.domain); }} className="px-3 text-xs text-emerald-950/70">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950/85">{r.content}</p>
      )}
      {!editing && (
        <div className="mt-3 flex justify-end gap-1">
          <button aria-label="Edit entry" onClick={() => setEditing(true)} className="rounded-full p-2 text-emerald-900/60 hover:bg-emerald-900/5"><Pencil className="h-3.5 w-3.5" /></button>
          <button aria-label="Delete entry" disabled={busy}
            onClick={() => { if (confirm('Delete this entry permanently?')) run(onDelete); }}
            className="rounded-full p-2 text-emerald-900/60 hover:bg-emerald-900/5"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      )}
      {err && <p role="alert" className="mt-2 text-xs text-red-700">{err}</p>}
    </article>
  );
};

const Journal: React.FC = () => {
  const { records, loading, error, add, update, remove } = usePersonalRecords();
  const [text, setText] = useState('');
  const [domain, setDomain] = useState<DomainId>('reflections');
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const save = async () => {
    if (!text.trim()) return;
    setStatus('saving');
    try { await add(text.trim(), domain); setText(''); setStatus('saved'); }
    catch { setStatus('error'); }
  };
  const shown = filter === 'all' ? records : records.filter((r) => r.domain === filter);

  return (
    <>
      <section className={`mt-8 p-5 ${panel}`} aria-label="Write in My World">
        <label htmlFor="mw-entry" className="font-serif text-lg text-emerald-950">What is unfolding for you today?</label>
        <textarea id="mw-entry" value={text} onChange={(e) => { setText(e.target.value); if (status !== 'saving') setStatus('idle'); }}
          rows={5} maxLength={10000} placeholder="A thought, a moment, a decision, a dream…"
          className="mt-3 w-full rounded-2xl border border-emerald-900/15 bg-white/80 p-4 text-[15px] leading-relaxed text-emerald-950 placeholder:text-emerald-950/40 focus:outline-none focus:ring-2 focus:ring-emerald-800/30" />
        <div className="mt-3"><DomainChips value={domain} onChange={setDomain} /></div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-emerald-950/65" aria-live="polite">
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && 'Saved to your private sanctuary.'}
            {status === 'error' && <span className="text-red-700">Not saved — please try again. Your words are still here.</span>}
            {status === 'idle' && 'Only saved when you tap Save.'}
          </p>
          <button onClick={save} disabled={!text.trim() || status === 'saving'}
            className="flex items-center gap-2 rounded-full bg-emerald-900 px-5 py-2 text-sm text-white disabled:opacity-50">
            {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}Save
          </button>
        </div>
      </section>

      <section className="mt-8 space-y-4" aria-label="Your entries">
        <h2 className="text-center text-xs font-medium uppercase tracking-[0.25em] text-emerald-900/60">Your garden</h2>
        {records.length > 0 && <DomainChips value={filter} onChange={setFilter} withAll />}
        {loading ? (
          <p className="text-center text-sm text-emerald-950/60">Opening your garden…</p>
        ) : error ? (
          <p role="alert" className="text-center text-sm text-red-700">{error}</p>
        ) : shown.length === 0 ? (
          <div className={`p-6 text-center ${panel}`}>
            <p className="font-serif text-base italic text-emerald-950/75">
              {records.length ? 'Nothing here in this part of your garden yet.' : 'Your oasis is quiet. Place your first thought, memory, or reflection here.'}
            </p>
          </div>
        ) : (
          shown.map((r) => (
            <Entry key={r.id} r={r} onSave={(c, d) => update(r.id, c, d)} onDelete={() => remove(r.id)} />
          ))
        )}
      </section>
    </>
  );
};

const intentions = [
  {
    icon: Feather,
    title: 'Quiet Reflections',
    text: 'A still place to gather your thoughts, feelings and moments — kept gently, just for you.',
  },
  {
    icon: BookOpen,
    title: 'Your Story',
    text: 'The seasons of your life, held together in one living record that grows with you.',
  },
  {
    icon: HeartHandshake,
    title: 'What Matters',
    text: 'The people, dreams and decisions close to your heart, cared for in one calm space.',
  },
  {
    icon: Sprout,
    title: 'Gentle Growth',
    text: 'Over time, Ordiva will help you notice the patterns in your world — always with your permission.',
  },
];

const MyWorld: React.FC = () => {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Living garden backdrop */}
      <img
        src={gardenBg}
        alt=""
        width={1024}
        height={1920}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* Soft light veil so text stays readable */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/70" />

      <div className="relative px-6 pt-14 pb-10">
        {/* Welcome */}
        <header className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-900/60">
            Your sanctuary
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-emerald-950">
            My World
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-emerald-950/70">
            Step out of the noise. This is your private garden — a peaceful,
            living space that belongs entirely to you.
          </p>
        </header>

        {/* Quiet pool: a moment of stillness */}
        <section className="mt-10 rounded-3xl border border-white/60 bg-white/55 p-6 shadow-[0_18px_50px_-20px_rgba(45,74,62,0.35)] backdrop-blur-md">
          <p className="text-center font-serif text-lg italic text-emerald-950/80">
            “Nothing here is rushed. Nothing here is watched.
            <br />
            This garden grows at your pace.”
          </p>
        </section>

        <Journal />

        {/* What will live here */}
        <section className="mt-10 space-y-4">
          <h2 className="text-center text-xs font-medium uppercase tracking-[0.25em] text-emerald-900/60">
            What will grow here
          </h2>
          {intentions.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-white/60 bg-white/60 p-5 shadow-[0_10px_30px_-15px_rgba(45,74,62,0.3)] backdrop-blur-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-900/10">
                <Icon className="h-5 w-5 text-emerald-900/80" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-emerald-950">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-emerald-950/70">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Privacy promise */}
        <footer className="mt-10 flex items-center justify-center gap-2 text-center">
          <Lock className="h-3.5 w-3.5 text-emerald-900/60" />
          <p className="text-xs text-emerald-950/60">
            Everything in My World is private to you — always.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MyWorld;
