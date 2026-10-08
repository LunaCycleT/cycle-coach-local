
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useCycleCoachChat = (currentPhase: string | null, cycleDay: number | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm Luna, your personal cycle coach. I'm here to help you understand your menstrual cycle and support your wellness journey. What would you like to know? 🌙✨",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error: functionError } = await supabase.functions.invoke('cycle-coach-chat', {
        body: {
          message: userMessage,
          conversationHistory,
          currentPhase,
          cycleDay
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.fallbackResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Add fallback response
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now, but I'm here to help! Please try asking your question again. 💜",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi there! I'm Luna, your personal cycle coach. I'm here to help you understand your menstrual cycle and support your wellness journey. What would you like to know? 🌙✨",
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  return { messages, loading, error, sendMessage, clearChat };
};
