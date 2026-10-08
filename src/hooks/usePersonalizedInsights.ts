
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PersonalizedInsights {
  dailyMessage: string;
  energyLevel: number;
  moodInsight: string;
  recommendations: {
    do: Array<{ category: string; advice: string; emoji: string }>;
    avoid: Array<{ category: string; advice: string; emoji: string }>;
  };
}

export const usePersonalizedInsights = (currentPhase: string | null, cycleDay: number | null) => {
  const [insights, setInsights] = useState<PersonalizedInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!currentPhase || !cycleDay) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-insights', {
        body: {
          currentPhase,
          cycleDay,
          userPreferences: {} // Can be expanded later for personalization
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error && data.fallback) {
        console.warn('Using fallback insights:', data.error);
        setInsights(data.fallback);
      } else {
        setInsights(data);
      }
    } catch (err) {
      console.error('Failed to fetch personalized insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [currentPhase, cycleDay]);

  return { insights, loading, error, refetch: fetchInsights };
};
