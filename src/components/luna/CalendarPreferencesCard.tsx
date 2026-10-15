import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CALENDARS, civilDateInZone, formatInCalendar, moonPhasesBetween, addDaysIso, MOON_PHASE_LABELS, type CalendarId } from '@/utils/calendars';
import { useCalendarPreferences } from '@/hooks/useCalendarPreferences';

const selectCls =
  'w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

const CalendarPreferencesCard: React.FC = () => {
  const { prefs, update } = useCalendarPreferences();
  const [today, setToday] = React.useState<string | null>(null);
  React.useEffect(() => setToday(civilDateInZone(new Date())), []);

  const nextPhase = React.useMemo(() => {
    if (!today || !prefs.showMoonPhases) return null;
    return moonPhasesBetween(today, addDaysIso(today, 10))[0] ?? null;
  }, [today, prefs.showMoonPhases]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5" />
          <span>Calendar Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="primaryCalendar">Primary calendar</Label>
          <select
            id="primaryCalendar"
            className={selectCls}
            value={prefs.primary}
            onChange={(e) => {
              const primary = e.target.value as CalendarId;
              update({ primary, secondary: prefs.secondary === primary ? null : prefs.secondary });
            }}
          >
            {CALENDARS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{CALENDARS.find((c) => c.id === prefs.primary)?.description}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryCalendar">Secondary calendar (optional)</Label>
          <select
            id="secondaryCalendar"
            className={selectCls}
            value={prefs.secondary ?? ''}
            onChange={(e) => update({ secondary: (e.target.value || null) as CalendarId | null })}
          >
            <option value="">None</option>
            {CALENDARS.filter((c) => c.id !== prefs.primary).map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center justify-between gap-3 min-h-11 cursor-pointer">
          <span className="text-sm font-medium">Show moon phases</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-purple-600"
            checked={prefs.showMoonPhases}
            onChange={(e) => update({ showMoonPhases: e.target.checked })}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Moon phases are an astronomical overlay only; they are not linked to your cycle.
        </p>

        {today && (
          <div className="rounded-lg bg-purple-50 p-3 space-y-1" aria-live="polite">
            <p className="text-xs uppercase tracking-wide text-purple-700">Preview — today</p>
            <p className="font-semibold text-gray-800">{formatInCalendar(today, prefs.primary)}</p>
            {prefs.secondary && (
              <p className="text-sm text-gray-600">{formatInCalendar(today, prefs.secondary)}</p>
            )}
            {nextPhase && (
              <p className="text-sm text-gray-600">
                Next: {MOON_PHASE_LABELS[nextPhase.phase]} on {formatInCalendar(nextPhase.date, prefs.primary)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarPreferencesCard;
