
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Crown } from 'lucide-react';
import { usePersonalizedInsights } from '../hooks/usePersonalizedInsights';

interface DailyInsightsProps {
  currentPhase: string | null;
  cycleDay: number | null;
}

const DailyInsights: React.FC<DailyInsightsProps> = ({
  currentPhase,
  cycleDay,
}) => {
  const { insights, loading, error, refetch } = usePersonalizedInsights(currentPhase, cycleDay);

  if (!currentPhase) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🌸</div>
            <h2 className="text-xl font-semibold mb-2">No Cycle Data</h2>
            <p className="text-gray-600">
              Please log your last period date to see personalized AI insights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPhaseEmoji = (phase: string) => {
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

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual':
        return 'bg-red-50 border-red-200';
      case 'follicular':
        return 'bg-green-50 border-green-200';
      case 'ovulation':
        return 'bg-yellow-50 border-yellow-200';
      case 'luteal':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-pink-50 border-pink-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Phase Header */}
      <Card className={`border-2 ${getPhaseColor(currentPhase)}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="text-4xl">{getPhaseEmoji(currentPhase)}</div>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold capitalize mb-1">
            {currentPhase} Phase
          </h1>
          <p className="text-gray-600">Day {cycleDay} of your cycle</p>
          
          {loading && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-500">Generating personalized insights...</span>
            </div>
          )}
          
          {error && (
            <div className="mt-4">
              <p className="text-sm text-red-600 mb-2">Unable to generate AI insights</p>
              <Button onClick={refetch} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            </div>
          )}
          
          {insights && (
            <p className="text-sm text-gray-500 mt-3 italic">
              {insights.dailyMessage}
            </p>
          )}
        </CardContent>
      </Card>

      {insights && (
        <>
          {/* Mood Insight */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">💭</span>
                <span className="font-medium text-purple-700">Today's Mood Insight</span>
              </div>
              <p className="text-sm text-purple-600">{insights.moodInsight}</p>
            </CardContent>
          </Card>

          {/* DO Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span>AI Recommends: DO Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.recommendations.do.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-green-800">{item.category}</h3>
                    <p className="text-sm text-green-700">{item.advice}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AVOID Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span>AI Recommends: AVOID Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.recommendations.avoid.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-red-800">{item.category}</h3>
                    <p className="text-sm text-red-700">{item.advice}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Energy Level */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">AI Predicted Energy Level</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-6 rounded-sm ${
                        i < insights.energyLevel
                          ? 'bg-gradient-to-t from-purple-400 to-pink-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refresh Button */}
          <Card>
            <CardContent className="p-4 text-center">
              <Button 
                onClick={refetch} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Insights
              </Button>
            </CardContent>
          </Card>

          {/* Bonus Leadership Insights - Pro Feature */}
          <>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Crown className="w-5 h-5 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-foreground">Leadership Insights</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">Energy Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Based on your {currentPhase} phase, this is an optimal time for strategic planning and high-level decision making.
                    </p>
                  </div>
                  <div className="p-4 bg-white/50 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">Communication Style</h4>
                    <p className="text-sm text-muted-foreground">
                      Your natural communication patterns are enhanced during this phase - perfect for important presentations or negotiations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        </>
      )}
    </div>
  );
};

export default DailyInsights;
