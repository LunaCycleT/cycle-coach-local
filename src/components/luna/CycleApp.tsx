
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import HomeScreen from './HomeScreen';
import CycleCalendar from './CycleCalendar';
import DailyInsights from './DailyInsights';
import CycleCoachChat from './CycleCoachChat';
import UserProfile from './UserProfile';
import Navigation from './Navigation';
import { calculateCyclePhase, getCycleDay } from '@/utils/cycleCalculations';
import { supabase } from '@/integrations/supabase/client';
import { LunaInstallOffer } from './LunaInstallation';

const CycleApp = () => {
  const [activeView, setActiveView] = useState('home');
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from cloud; migrate any old on-device data the first time
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;
      setUserId(uid);
      const { data } = await supabase.from('cycle_settings').select('*').eq('user_id', uid).maybeSingle();
      if (data) {
        if (data.last_period_date) setLastPeriodDate(new Date(data.last_period_date));
        setCycleLength(data.cycle_length);
      } else {
        const lp = localStorage.getItem('lastPeriodDate');
        const cl = localStorage.getItem('cycleLength');
        if (lp) setLastPeriodDate(new Date(lp));
        if (cl) setCycleLength(parseInt(cl) || 28);
      }
      setLoaded(true);
    })();
  }, []);

  // Save to cloud whenever data changes
  useEffect(() => {
    if (!loaded || !userId) return;
    supabase.from('cycle_settings').upsert({
      user_id: userId,
      last_period_date: lastPeriodDate ? lastPeriodDate.toISOString() : null,
      cycle_length: cycleLength,
      updated_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error(error); });
  }, [lastPeriodDate, cycleLength, loaded, userId]);

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
        <LunaInstallOffer signedInReady={loaded && Boolean(userId)} />
        {renderActiveView()}
        <Navigation activeView={activeView} onViewChange={setActiveView} />
      </div>
    </div>
  );
};

export default CycleApp;
