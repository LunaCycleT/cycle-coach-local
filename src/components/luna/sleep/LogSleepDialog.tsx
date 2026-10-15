import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addDaysIso, civilDateInZone } from '@/utils/calendars/civil';
import {
  RESTFULNESS_LABELS, SESSION_LABELS, assignSleepNight, formatMinutes, localParts, summarizeNight,
  validateSessions, zonedTimeToInstant, type SessionLabel, type SleepSessionInput,
} from '@/utils/sleep/sleepCalculations';
import type { SleepNight, SleepNightDraft } from '@/hooks/useSleepNights';

interface Row { start: string; end: string; label: SessionLabel | '' }

const userZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const hhmm = (iso: string, tz: string) => {
  const p = localParts(new Date(iso), tz);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
};

/** Times are entered relative to the night date: afternoon/evening = that day, morning = next day. */
const toInstant = (night: string, time: string, tz: string, after?: string) => {
  const hour = Number(time.split(':')[0]);
  let iso = zonedTimeToInstant(hour >= 12 ? night : addDaysIso(night, 1), time, tz);
  if (after && Date.parse(iso) <= Date.parse(after)) iso = zonedTimeToInstant(addDaysIso(night, 1), time, tz);
  return iso;
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: SleepNight[];
  editing: SleepNight | null;
  onSave: (d: SleepNightDraft, replacingDate?: string) => Promise<void>;
}

const LogSleepDialog: React.FC<Props> = ({ open, onOpenChange, existing, editing, onSave }) => {
  const tz = editing?.timezone ?? userZone();
  const [night, setNight] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [wakes, setWakes] = useState<{ start: string; end: string }[]>([]);
  const [count, setCount] = useState('');
  const [rest, setRest] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setNight(editing.sleepDate);
      setRows(editing.sessions.map((s) => ({ start: hhmm(s.startedAt, tz), end: hhmm(s.endedAt, tz), label: s.label ?? '' })));
      setWakes(editing.awakenings.map((a) => ({ start: hhmm(a.startedAt, tz), end: hhmm(a.endedAt, tz) })));
      setCount(editing.reportedAwakenings?.toString() ?? '');
      setRest(editing.restfulness);
      setNotes(editing.notes ?? '');
    } else {
      setNight(assignSleepNight(new Date().toISOString(), tz) === civilDateInZone(new Date(), tz)
        ? addDaysIso(civilDateInZone(new Date(), tz), -1) : assignSleepNight(new Date().toISOString(), tz));
      setRows([{ start: '22:00', end: '06:30', label: '' }]);
      setWakes([]); setCount(''); setRest(null); setNotes('');
    }
  }, [open, editing, tz]);

  const built = useMemo(() => {
    try {
      const sessions: SleepSessionInput[] = rows.map((r) => {
        const startedAt = toInstant(night, r.start, tz);
        return { startedAt, endedAt: toInstant(night, r.end, tz, startedAt), label: r.label || null };
      });
      const awakenings = wakes.map((w) => {
        const startedAt = toInstant(night, w.start, tz);
        return { startedAt, endedAt: toInstant(night, w.end, tz, startedAt) };
      });
      return { sessions, awakenings };
    } catch { return null; }
  }, [rows, wakes, night, tz]);

  const others = existing.filter((n) => n.id !== editing?.id).flatMap((n) => n.sessions);
  const issues = built ? validateSessions(built.sessions, others) : [];
  const summary = built ? summarizeNight(built.sessions, built.awakenings, count === '' ? null : Number(count)) : null;

  const issueText = issues.length
    ? issues[0]!.kind === 'overlap'
      ? issues[0]!.other === 'existing' ? 'One session overlaps sleep you already logged.' : 'Two sessions overlap.'
      : 'A session must end after it starts and be under 24 hours.'
    : null;

  const submit = async () => {
    if (!built || issues.length || !night) return;
    setSaving(true); setError(null);
    try {
      await onSave({
        sleepDate: night, timezone: tz, restfulness: rest,
        reportedAwakenings: count === '' ? null : Math.max(0, Math.min(50, Number(count))),
        notes, sessions: built.sessions, awakenings: built.awakenings,
      }, editing?.sleepDate);
      onOpenChange(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit sleep' : 'Log sleep'}</DialogTitle>
          <DialogDescription>Evening times count toward this night; morning times toward the next morning.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="sleep-night">Night of</Label>
            <Input id="sleep-night" type="date" value={night} onChange={(e) => setNight(e.target.value)} />
          </div>

          <div className="space-y-3">
            <Label>Sleep sessions</Label>
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg border border-purple-100 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs text-gray-500" htmlFor={`s${i}`}>Fell asleep</Label>
                    <Input id={`s${i}`} type="time" value={r.start} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, start: e.target.value } : x))} /></div>
                  <div><Label className="text-xs text-gray-500" htmlFor={`e${i}`}>Woke up</Label>
                    <Input id={`e${i}`} type="time" value={r.end} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, end: e.target.value } : x))} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <select aria-label="Session label" className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={r.label} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, label: e.target.value as SessionLabel | '' } : x))}>
                    <option value="">No label</option>
                    {Object.entries(SESSION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {rows.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove session" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full border-purple-200"
              onClick={() => setRows([...rows, { start: '03:00', end: '07:00', label: rows.length === 1 ? 'second_sleep' : '' }])}>
              <Plus className="w-4 h-4 mr-1" /> Add another sleep session
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wake-count">Times you woke up (optional)</Label>
            <Input id="wake-count" type="number" min={0} max={50} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
            {wakes.map((w, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1"><Label className="text-xs text-gray-500" htmlFor={`ws${i}`}>Awake from</Label>
                  <Input id={`ws${i}`} type="time" value={w.start} onChange={(e) => setWakes(wakes.map((x, j) => j === i ? { ...x, start: e.target.value } : x))} /></div>
                <div className="flex-1"><Label className="text-xs text-gray-500" htmlFor={`we${i}`}>Until</Label>
                  <Input id={`we${i}`} type="time" value={w.end} onChange={(e) => setWakes(wakes.map((x, j) => j === i ? { ...x, end: e.target.value } : x))} /></div>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove awake time" onClick={() => setWakes(wakes.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="text-purple-700" onClick={() => setWakes([...wakes, { start: '02:00', end: '02:30' }])}>
              <Plus className="w-4 h-4 mr-1" /> Add an awake time
            </Button>
          </div>

          <div className="space-y-2">
            <Label>How rested do you feel?</Label>
            <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Restfulness">
              {RESTFULNESS_LABELS.map((l, i) => (
                <button key={l} type="button" role="radio" aria-checked={rest === i + 1}
                  onClick={() => setRest(rest === i + 1 ? null : i + 1)}
                  className={`rounded-md border px-1 py-2 text-[11px] leading-tight transition-colors ${rest === i + 1 ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  <span className="block text-sm font-semibold">{i + 1}</span>{l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sleep-notes">Notes (optional)</Label>
            <Textarea id="sleep-notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {summary && !issueText && (
            <p className="text-sm text-gray-600">Total sleep {formatMinutes(summary.totalSleepMinutes)} · {summary.awakeningCount} awakening{summary.awakeningCount === 1 ? '' : 's'}</p>
          )}
          {(issueText || error) && <p role="alert" className="text-sm text-red-600">{issueText ?? error}</p>}

          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500" disabled={saving || !!issueText || !built} onClick={submit}>
            {saving ? 'Saving…' : 'Save sleep'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogSleepDialog;
