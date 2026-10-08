
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, RefreshCw, Sparkles } from 'lucide-react';
import { useCycleCoachChat } from '../hooks/useCycleCoachChat';
import { format } from 'date-fns';

interface CycleCoachChatProps {
  currentPhase: string | null;
  cycleDay: number | null;
}

const CycleCoachChat: React.FC<CycleCoachChatProps> = ({
  currentPhase,
  cycleDay,
}) => {
  const { messages, loading, error, sendMessage, clearChat } = useCycleCoachChat(currentPhase, cycleDay);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
    
    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "How can I manage period cramps naturally?",
    "What foods are best during my current cycle phase?",
    "Why do I feel more tired during my period?",
    "How can I track my cycle more effectively?"
  ];

  return (
    <div className="p-6 space-y-4 h-screen flex flex-col">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            <span className="text-purple-800">Chat with CycleCoach Luna</span>
            <Sparkles className="w-5 h-5 text-pink-500" />
          </CardTitle>
          {currentPhase && (
            <div className="text-sm text-purple-600">
              Current phase: <span className="font-semibold capitalize">{currentPhase}</span>
              {cycleDay && <span> • Day {cycleDay}</span>}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-600">Luna is thinking...</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 font-medium">Try asking:</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3 text-xs"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="mt-4 space-y-2">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Luna about your cycle, symptoms, or wellness..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between">
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="text-gray-500"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear Chat
              </Button>
              <p className="text-xs text-gray-500 flex items-center">
                Powered by AI • Always consult healthcare providers for medical concerns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CycleCoachChat;
