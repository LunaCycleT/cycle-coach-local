import React, { useState } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import CycleCalendar from './CycleCalendar';
import DailyInsights from './DailyInsights';

interface MyRhythmsProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  cycleLength: number;
  currentPhase: string | null;
  cycleDay: number | null;
}

const MyRhythms: React.FC<MyRhythmsProps> = ({
  selectedDate,
  onDateSelect,
  cycleLength,
  currentPhase,
  cycleDay,
}) => {
  const [tab, setTab] = useState<'calendar' | 'insights'>('calendar');

  return (
    <div>
      <div className="sticky top-0 z-10 flex justify-center gap-2 border-b border-gray-100 bg-white/90 px-6 py-3 backdrop-blur-sm">
        <button
          onClick={() => setTab('calendar')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            tab === 'calendar'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </button>
        <button
          onClick={() => setTab('insights')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            tab === 'insights'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Insights
        </button>
      </div>

      {tab === 'calendar' ? (
        <CycleCalendar
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          cycleLength={cycleLength}
        />
      ) : (
        <DailyInsights currentPhase={currentPhase} cycleDay={cycleDay} />
      )}
    </div>
  );
};

export default MyRhythms;
