import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildMonthView, civilDateInZone, dayNumberIn, diffDaysIso, formatInCalendar, isoToJdn, monthKeyOf,
  moonPhasesBetween, parseIsoDate, shiftMonth, shortInCalendar, weekdayOfJdn, MOON_PHASE_LABELS,
  CALENDARS, type MonthKey, type MoonPhase, igboMarketDay,
} from '@/utils/calendars';
import { useCalendarPreferences } from '@/hooks/useCalendarPreferences';

interface CycleCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  cycleLength: number;
}

const MOON_ICON: Record<MoonPhase, string> = { new: '🌑', 'first-quarter': '🌓', full: '🌕', 'last-quarter': '🌗' };
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Stored Date -> the civil day the user picked (in their local zone). */
const toIso = (d: Date) => civilDateInZone(d);
/** Civil day -> Date in the existing storage format (local midday, unchanged). */
const fromIso = (iso: string) => { const c = parseIsoDate(iso); return new Date(c.year, c.month - 1, c.day, 12); };

const CycleCalendar: React.FC<CycleCalendarProps> = ({ selectedDate, onDateSelect }) => {
  const { prefs } = useCalendarPreferences();
  const cal = prefs.primary;
  const [today, setToday] = useState<string | null>(null);
  const [key, setKey] = useState<MonthKey | null>(null);

  const selectedIso = selectedDate ? toIso(selectedDate) : null;
  const selectedIsoRef = React.useRef(selectedIso);
  selectedIsoRef.current = selectedIso;
  useEffect(() => { setToday(civilDateInZone(new Date())); }, []);
  // Re-anchor on the same real-world day whenever the calendar system changes.
  useEffect(() => {
    if (today) setKey(monthKeyOf(cal, selectedIsoRef.current ?? today));
  }, [cal, today]);

  const view = useMemo(() => (key ? safeView(cal, key) : null), [cal, key]);

  const moons = useMemo(() => {
    const map = new Map<string, MoonPhase>();
    if (!view || !prefs.showMoonPhases) return map;
    const all = [...view.days, ...view.intercalary.map((d) => d.iso)].sort();
    for (const e of moonPhasesBetween(all[0]!, all[all.length - 1]!)) map.set(e.date, e.phase);
    return map;
  }, [view, prefs.showMoonPhases]);

  if (!view || !today) return <div className="p-6" />;

  const dayType = (iso: string) => {
    if (!selectedIso) return null;
    const n = diffDaysIso(iso, selectedIso);
    if (n >= 0 && n < 5) return 'period';
    if (n >= 12 && n <= 16) return 'ovulation';
    if (n >= 10 && n <= 18) return 'fertile';
    return null;
  };

  const cellClass = (iso: string) => {
    const t = dayType(iso);
    let c = 'w-11 h-12 rounded-xl flex flex-col items-center justify-center leading-tight transition-all hover:scale-105 cursor-pointer relative ';
    if (iso === selectedIso) c += 'bg-purple-600 text-white shadow-lg ';
    else if (iso === today) c += 'bg-purple-100 text-purple-700 border-2 border-purple-300 ';
    else if (t === 'period') c += 'bg-red-100 text-red-700 ';
    else if (t === 'ovulation') c += 'bg-yellow-100 text-yellow-700 ';
    else if (t === 'fertile') c += 'bg-green-100 text-green-700 ';
    else c += 'hover:bg-gray-100 text-gray-700 ';
    return c;
  };

  const lead = weekdayOfJdn(isoToJdn(view.days[0]!));
  const cells: (string | null)[] = [...Array(lead).fill(null), ...view.days];
  const describe = (iso: string) => {
    const parts = [formatInCalendar(iso, cal)];
    if (prefs.secondary) parts.push(formatInCalendar(iso, prefs.secondary));
    const m = moons.get(iso); if (m) parts.push(MOON_PHASE_LABELS[m]);
    if (prefs.showIgboMarket) parts.push(`${igboMarketDay(iso, prefs.igboSpelling).name} market day`);
    if (iso === today) parts.push('today');
    const t = dayType(iso); if (t) parts.push(t);
    return parts.join(', ');
  };

  const DayButton = ({ iso, label }: { iso: string; label: React.ReactNode }) => (
    <button type="button" className={cellClass(iso)} onClick={() => onDateSelect(fromIso(iso))} aria-label={describe(iso)} aria-pressed={iso === selectedIso}>
      <span className="text-sm font-medium">{label}</span>
      {prefs.secondary && <span className="text-[10px] opacity-70">{shortInCalendar(iso, prefs.secondary)}</span>}
      {prefs.showIgboMarket && <span className="text-[9px] opacity-80" aria-hidden>{igboMarketDay(iso, prefs.igboSpelling).short}</span>}
      {moons.has(iso) && <span className="absolute -top-1 -right-1 text-xs" aria-hidden>{MOON_ICON[moons.get(iso)!]}</span>}
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" aria-label="Previous month" onClick={() => setKey(shiftMonth(cal, view.key, -1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{view.title}</h2>
                {view.subtitle && <p className="text-xs font-normal text-gray-500">{view.subtitle}</p>}
              </div>
              <Button variant="ghost" size="sm" aria-label="Next month" onClick={() => setKey(shiftMonth(cal, view.key, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {cal !== 'gregorian' && (
              <p className="text-xs font-normal text-purple-700 mt-2">
                {CALENDARS.find((c) => c.id === cal)?.label} view{prefs.secondary ? ` · small numbers: ${CALENDARS.find((c) => c.id === prefs.secondary)?.label}` : ''}
              </p>
            )}
            {cal === 'gregorian' && prefs.secondary && (
              <p className="text-xs font-normal text-purple-700 mt-2">Small numbers: {CALENDARS.find((c) => c.id === prefs.secondary)?.label}</p>
            )}
            <Button variant="link" size="sm" className="text-xs" onClick={() => setKey(monthKeyOf(cal, today))}>Today</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEK.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((iso, i) => (
              <div key={iso ?? `pad-${i}`} className="flex justify-center">
                {iso ? <DayButton iso={iso} label={dayNumberIn(iso, cal)} /> : <div className="w-11 h-12" />}
              </div>
            ))}
          </div>

          {view.intercalary.map((d) => (
            <div key={d.iso} className="mt-4 flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
              <DayButton iso={d.iso} label="★" />
              <div>
                <p className="font-semibold text-sm text-gray-800">{d.label}</p>
                <p className="text-xs text-gray-600">{d.explanation}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-center">Legend</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full bg-red-100" /><span>Period</span></div>
            <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full bg-green-100" /><span>Fertile Window</span></div>
            <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full bg-yellow-100" /><span>Ovulation</span></div>
            <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full bg-purple-600" /><span>Selected</span></div>
          </div>
          {prefs.showIgboMarket && (
            <p className="mt-3 text-xs text-gray-500 text-center">Small labels: Igbo market day (Eke, {prefs.igboSpelling === "oye" ? "Oye" : "Orie"}, Afọ, Nkwọ), counted from 1 January 2026 = Orie. Local reckoning may differ.</p>
          )}
          {prefs.showMoonPhases && (
            <p className="mt-3 text-xs text-gray-500 text-center">
              🌑 New · 🌓 First quarter · 🌕 Full · 🌗 Last quarter — astronomical only, not linked to your cycle.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-600">Tap a date to log the start of your last period</div>
    </div>
  );
};

function safeView(cal: CalendarId, key: MonthKey) {
  try { return buildMonthView(cal, key); } catch { return null; }
}
import type { CalendarId } from '@/utils/calendars';

export default CycleCalendar;
