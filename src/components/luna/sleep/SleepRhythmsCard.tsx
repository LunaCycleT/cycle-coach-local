import React, { useState } from 'react';
import { BedDouble, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSleepNights, type SleepNight } from '@/hooks/useSleepNights';
import { useCalendarPreferences } from '@/hooks/useCalendarPreferences';
import { formatInCalendar } from '@/utils/calendars';
import { PATTERN_LABELS, RESTFULNESS_LABELS, formatMinutes, summarizeNight } from '@/utils/sleep/sleepCalculations';
import LogSleepDialog from './LogSleepDialog';

/** Compact Home card: one summary line for the latest night plus a single action. */
const SleepRhythmsCard: React.FC = () => {
  const { nights, loading, saveNight, deleteNight } = useSleepNights();
  const { prefs } = useCalendarPreferences();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SleepNight | null>(null);
  const latest = nights[0];
  const s = latest ? summarizeNight(latest.sessions, latest.awakenings, latest.reportedAwakenings) : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-800">Sleep Rhythms</h2>
          </div>
          <Button size="sm" variant="outline" className="border-purple-200" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Log sleep
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : latest && s ? (
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm space-y-0.5">
              <p className="text-gray-500">Night of {formatInCalendar(latest.sleepDate, prefs.primary)}</p>
              <p className="text-gray-800"><span className="font-semibold">{formatMinutes(s.totalSleepMinutes)}</span> · {PATTERN_LABELS[s.pattern]}</p>
              <p className="text-gray-600">
                {s.awakeningCount} awakening{s.awakeningCount === 1 ? '' : 's'}
                {latest.restfulness ? ` · Felt ${RESTFULNESS_LABELS[latest.restfulness - 1]!.toLowerCase()}` : ''}
              </p>
            </div>
            <div className="flex">
              <Button size="icon" variant="ghost" aria-label="Edit last night" onClick={() => { setEditing(latest); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete last night" onClick={() => { if (confirm('Delete this night?')) void deleteNight(latest.id); }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Log one sleep or several — continuous, segmented, or with naps.</p>
        )}
      </CardContent>
      <LogSleepDialog open={open} onOpenChange={setOpen} existing={nights} editing={editing} onSave={saveNight} />
    </Card>
  );
};

export default SleepRhythmsCard;
