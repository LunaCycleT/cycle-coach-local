
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import HomeScreen from './HomeScreen';
import CycleCalendar from './CycleCalendar';
import DailyInsights from './DailyInsights';
import CycleCoachChat from './CycleCoachChat';
import UserProfile from './UserProfile';
import Navigation from './Navigation';
import { calculateCyclePhase, getCycleDay } from '@/utils/cycleCalculations';

const CycleApp = () => {
  const [activeView, setActiveView] = useState('home');
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [cycleLength, setCycleLength] = useState(28);

  // Load saved data on component mount
  useEffect(() => {
    const savedPeriodDate = localStorage.getItem('lastPeriodDate');
    const savedCycleLength = localStorage.getItem('cycleLength');
    
    if (savedPeriodDate) {
      setLastPeriodDate(new Date(savedPeriodDate));
    }
    if (savedCycleLength) {
      setCycleLength(parseInt(savedCycleLength));
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (lastPeriodDate) {
      localStorage.setItem('lastPeriodDate', lastPeriodDate.toISOString());
    }
  }, [lastPeriodDate]);

  useEffect(() => {
    localStorage.setItem('cycleLength', cycleLength.toString());
  }, [cycleLength]);

  const handlePeriodDateSelect = (date: Date) => {
    setLastPeriodDate(date);
    setActiveView('home');
  };

  const currentPhase = lastPeriodDate ? calculateCyclePhase(lastPeriodDate, cycleLength) : null;
  const cycleDay = lastPeriodDate ? getCycleDay(lastPeriodDate) : null;

  const renderActiveView = () => {
    switch (activeView) {
      case 'calendar':
        return (
          <CycleCalendar
            selectedDate={lastPeriodDate}
            onDateSelect={handlePeriodDateSelect}
            cycleLength={cycleLength}
          />
        );
      case 'insights':
        return (
          <DailyInsights
            currentPhase={currentPhase}
            cycleDay={cycleDay}
          />
        );
      case 'chat':
        return (
          <CycleCoachChat
            currentPhase={currentPhase}
            cycleDay={cycleDay}
          />
        );
      case 'profile':
        return (
          <UserProfile
            cycleLength={cycleLength}
            onCycleLengthChange={setCycleLength}
          />
        );
      default:
        return (
          <HomeScreen
            currentPhase={currentPhase}
            cycleDay={cycleDay}
            lastPeriodDate={lastPeriodDate}
            onLogPeriod={() => setActiveView('calendar')}
            onViewInsights={() => setActiveView('insights')}
            onOpenChat={() => setActiveView('chat')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {renderActiveView()}
        <Navigation activeView={activeView} onViewChange={setActiveView} />
      </div>
    </div>
  );
};

export default CycleApp;
