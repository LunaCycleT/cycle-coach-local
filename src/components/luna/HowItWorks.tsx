
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, Calendar, Sparkles, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const HowItWorks = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('howItWorksSeen');
    if (!seen) {
      setIsOpen(true); // Auto-open for first-time users
    } else {
      setHasSeenBefore(true);
    }
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!hasSeenBefore) {
      localStorage.setItem('howItWorksSeen', 'true');
      setHasSeenBefore(true);
    }
  };

  const steps = [
    {
      icon: Calendar,
      title: "Track Your Cycle",
      description: "Log your last period to see your current cycle phase",
      color: "text-purple-600"
    },
    {
      icon: Sparkles,
      title: "Get Daily Insights",
      description: "Discover personalized tips based on your cycle phase",
      color: "text-pink-600"
    },
    {
      icon: MessageCircle,
      title: "Chat with Luna",
      description: "Ask our AI coach questions about your cycle and wellness",
      color: "text-indigo-600"
    }
  ];

  return (
    <Card className="mb-4 border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto hover:bg-white/50"
          >
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-700">
                {hasSeenBefore ? 'How It Works' : 'Welcome! Here\'s how to get started'}
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center ${step.color}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm">
                      {index + 1}. {step.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Pro tip: Your data is stored locally and privately on your device
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default HowItWorks;
