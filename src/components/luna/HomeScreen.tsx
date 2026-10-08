
import React from 'react';
import { format } from 'date-fns';
import { Calendar, Sparkles, Moon, MessageCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import HowItWorks from './HowItWorks';

interface HomeScreenProps {
  currentPhase: string | null;
  cycleDay: number | null;
  lastPeriodDate: Date | null;
  onLogPeriod: () => void;
  onViewInsights: () => void;
  onOpenChat: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  currentPhase,
  cycleDay,
  lastPeriodDate,
  onLogPeriod,
  onViewInsights,
  onOpenChat,
}) => {
  const getPhaseEmoji = (phase: string | null) => {
    switch (phase) {
      case 'menstrual':
        return '🌙';
      case 'follicular':
        return '🌱';
      case 'ovulation':
        return '✨';
      case 'luteal':
        return '🍂';
      default:
        return '🌸';
    }
  };

  const getPhaseColor = (phase: string | null) => {
    switch (phase) {
      case 'menstrual':
        return 'from-red-400 to-pink-400';
      case 'follicular':
        return 'from-green-400 to-emerald-400';
      case 'ovulation':
        return 'from-yellow-400 to-orange-400';
      case 'luteal':
        return 'from-purple-400 to-indigo-400';
      default:
        return 'from-pink-400 to-purple-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Moon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Luna
          </h1>
        </div>
        <p className="text-gray-600">Your personal cycle companion</p>
      </div>

      {/* How It Works Section */}
      <HowItWorks />


      {/* Current Phase Display */}
      {currentPhase && cycleDay ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-r ${getPhaseColor(currentPhase)} p-6 text-white`}>
              <div className="text-center space-y-2">
                <div className="text-4xl">{getPhaseEmoji(currentPhase)}</div>
                <h2 className="text-xl font-semibold capitalize">
                  {currentPhase} Phase
                </h2>
                <p className="text-sm opacity-90">Day {cycleDay} of your cycle</p>
              </div>
            </div>
            <div className="p-4 text-center">
              <Button 
                onClick={onViewInsights}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                View Today's Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-4xl">🌸</div>
            <h2 className="text-xl font-semibold text-gray-700">
              Welcome to Luna
            </h2>
            <p className="text-gray-600">
              Track your cycle and discover personalized insights for your wellbeing
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <Button
          onClick={onLogPeriod}
          variant="outline"
          className="w-full border-purple-200 hover:bg-purple-50"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {lastPeriodDate ? 'Update Period Date' : 'Log Last Period'}
        </Button>

        <Button
          onClick={onOpenChat}
          variant="outline"
          className="w-full border-pink-200 hover:bg-pink-50 text-pink-700"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat with CycleCoach Luna
        </Button>

        {lastPeriodDate && (
          <div className="text-center text-sm text-gray-600">
            Last period: {format(lastPeriodDate, 'MMM d, yyyy')}
          </div>
        )}
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={onLogPeriod}
        >
          <CardContent className="p-4 text-center space-y-2">
            <div className="text-2xl">📅</div>
            <p className="text-sm font-medium text-gray-700">Smart Calendar</p>
            <p className="text-xs text-gray-500">Track and predict</p>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={onViewInsights}
        >
          <CardContent className="p-4 text-center space-y-2">
            <div className="text-2xl">💡</div>
            <p className="text-sm font-medium text-gray-700">Daily Tips</p>
            <p className="text-xs text-gray-500">Personalized advice</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default HomeScreen;
