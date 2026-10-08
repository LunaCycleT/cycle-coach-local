
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CycleCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  cycleLength: number;
}

const CycleCalendar: React.FC<CycleCalendarProps> = ({
  selectedDate,
  onDateSelect,
  cycleLength,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayType = (date: Date) => {
    if (!selectedDate) return null;
    
    const daysSinceLastPeriod = differenceInDays(date, selectedDate);
    
    if (daysSinceLastPeriod >= 0 && daysSinceLastPeriod < 5) {
      return 'period';
    }
    if (daysSinceLastPeriod >= 12 && daysSinceLastPeriod <= 16) {
      return 'ovulation';
    }
    if (daysSinceLastPeriod >= 10 && daysSinceLastPeriod <= 18) {
      return 'fertile';
    }
    
    return null;
  };

  const getDayStyle = (date: Date) => {
    const dayType = getDayType(date);
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);
    
    let baseClasses = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all hover:scale-105 cursor-pointer ";
    
    if (isSelected) {
      baseClasses += "bg-purple-600 text-white shadow-lg ";
    } else if (isTodayDate) {
      baseClasses += "bg-purple-100 text-purple-700 border-2 border-purple-300 ";
    } else if (dayType === 'period') {
      baseClasses += "bg-red-100 text-red-700 ";
    } else if (dayType === 'ovulation') {
      baseClasses += "bg-yellow-100 text-yellow-700 ";
    } else if (dayType === 'fertile') {
      baseClasses += "bg-green-100 text-green-700 ";
    } else {
      baseClasses += "hover:bg-gray-100 text-gray-700 ";
    }
    
    return baseClasses;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // Get weekday names starting from Sunday
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Pad the calendar to start on Sunday
  const firstDayOfMonth = monthStart.getDay();
  const paddedDays = [];
  
  // Add empty cells for the previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    paddedDays.push(null);
  }
  
  // Add the actual days
  paddedDays.push(...monthDays);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {paddedDays.map((day, index) => (
              <div key={index} className="flex justify-center">
                {day ? (
                  <div
                    className={getDayStyle(day)}
                    onClick={() => onDateSelect(day)}
                  >
                    {format(day, 'd')}
                  </div>
                ) : (
                  <div className="w-10 h-10" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-center">Legend</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-100"></div>
              <span>Period</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-100"></div>
              <span>Fertile Window</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-100"></div>
              <span>Ovulation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              <span>Selected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-600">
        Tap a date to log the start of your last period
      </div>
    </div>
  );
};

export default CycleCalendar;
