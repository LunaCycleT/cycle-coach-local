import React, { useMemo } from 'react';
import { X, Link2, Sparkles, MessageCircleHeart, Target, History, Lock } from 'lucide-react';
import { DOMAINS, type PersonalRecord } from '@/hooks/usePersonalRecords';
import { findConnections } from '@/utils/myworld/related';

const label = (d: string) => DOMAINS.find((x) => x.id === d)?.label ?? d;
const when = (s: string) => new Date(s).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });

const QUESTIONS: Record<string, string[]> = {
  career: ['What part of this felt most like you?', 'What would you want to be true about this in a year?'],
  relationships: ['What did you need in this moment?', 'What would you like this person to understand?'],
  growth: ['What small step feels possible from here?', 'What is this asking you to let go of?'],
  routines: ['When does this rhythm feel easiest?', 'What gets in the way, gently?'],
  finances: ['What does security mean to you here?', 'What choice would feel calm rather than urgent?'],
  wellness: ['How was your body feeling when this happened?', 'What restores you after days like this?'],
  reflections: ['What stands out most when you read this again?', 'What feeling sits underneath these words?'],
};
const GENERAL = ['Is there anything you left unsaid here?'];

const Later: React.FC<{ icon: React.ElementType; title: string; text: string }> = ({ icon: Icon, title, text }) => (
  <div className="flex gap-3 rounded-2xl border border-dashed border-emerald-900/20 bg-white/40 p-4">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-900/50" />
    <div>
      <p className="text-sm font-medium text-emerald-950/80">{title} <span className="ml-1 rounded-full bg-emerald-900/10 px-2 py-0.5 text-[10px] font-normal text-emerald-900/70">Coming next</span></p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-950/60">{text}</p>
    </div>
  </div>
);

export const EntryDetail: React.FC<{ entry: PersonalRecord; all: PersonalRecord[]; onClose: () => void; onOpen: (r: PersonalRecord) => void }> = ({ entry, all, onClose, onOpen }) => {
  const connections = useMemo(() => findConnections(entry, all), [entry, all]);
  const byId = useMemo(() => new Map(all.map((r) => [r.id, r])), [all]);
  const questions = [...(QUESTIONS[entry.domain] ?? QUESTIONS['reflections'] ?? []), ...GENERAL];

  return (
    <div role="dialog" aria-modal="true" aria-label="Entry" className="fixed inset-0 z-[60] flex items-end justify-center bg-emerald-950/30 backdrop-blur-sm sm:items-center motion-safe:animate-in motion-safe:fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[2rem] border border-white/60 bg-gradient-to-b from-[#f6f3e8] via-[#eef2e6] to-[#e4ede3] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-emerald-900/10 px-2.5 py-0.5 text-[11px] text-emerald-900">{label(entry.domain)}</span>
            <p className="mt-2 text-xs text-emerald-950/55">{when(entry.created_at)}{entry.updated_at !== entry.created_at && ' · edited'}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-emerald-900/70 hover:bg-emerald-900/5"><X className="h-5 w-5" /></button>
        </div>

        <p className="mt-5 whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-emerald-950">{entry.content}</p>

        <section className="mt-8">
          <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-900/60"><Sparkles className="h-3.5 w-3.5" />Go deeper</h3>
          <p className="mt-1 text-[11px] text-emerald-950/50">Gentle prompts for you to sit with. Nothing is sent anywhere.</p>
          <ul className="mt-3 space-y-2">
            {questions.map((q) => <li key={q} className="rounded-2xl bg-white/60 px-4 py-3 font-serif text-[15px] italic text-emerald-950/85">{q}</li>)}
          </ul>
        </section>

        <section className="mt-8">
          <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-900/60"><Link2 className="h-3.5 w-3.5" />Connect the dots</h3>
          <p className="mt-1 text-[11px] text-emerald-950/50">Your other entries that use the same words. Found on this device from what you wrote — not an AI interpretation.</p>
          {connections.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white/50 px-4 py-3 text-sm italic text-emerald-950/60">No related entries yet. Connections appear as your garden grows.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {connections.map((c) => {
                const r = byId.get(c.id)!;
                return (
                  <li key={c.id}>
                    <button onClick={() => onOpen(r)} className="w-full rounded-2xl bg-white/65 p-4 text-left hover:bg-white/85">
                      <p className="text-[11px] text-emerald-950/55">{new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {label(r.domain)}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-emerald-950/85">{r.content}</p>
                      <p className="mt-2 text-[11px] text-emerald-900/70">Why: you wrote “{c.sharedTerms.join('”, “')}” in both{c.sameDomain ? ', same life area' : ''}.</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-8 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-900/60">Arriving in the next milestone</h3>
          <Later icon={History} title="Revisit" text="Add a follow-up or outcome linked to this entry, keeping the original exactly as written. Needs a new private storage area — awaiting approval." />
          <Later icon={MessageCircleHeart} title="Explore with Ordiva" text="Talk this through with Ask Ordiva. It will only see your entries or rhythms if you switch those permissions on." />
          <Later icon={Target} title="Turn into action" text="Shape next steps or goals from this reflection, with Ask Ordiva’s help." />
          <p className="flex items-center gap-1.5 pt-2 text-[11px] text-emerald-950/50"><Lock className="h-3 w-3" />Opening an entry never shares it with AI.</p>
        </section>
      </div>
    </div>
  );
};
