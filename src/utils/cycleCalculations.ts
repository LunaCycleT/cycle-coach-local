
import { differenceInDays } from 'date-fns';

export const calculateCyclePhase = (lastPeriodDate: Date, cycleLength: number = 28): string => {
  const today = new Date();
  const daysSinceLastPeriod = differenceInDays(today, lastPeriodDate);
  const currentCycleDay = (daysSinceLastPeriod % cycleLength) + 1;

  if (currentCycleDay <= 5) {
    return 'menstrual';
  } else if (currentCycleDay <= 13) {
    return 'follicular';
  } else if (currentCycleDay <= 17) {
    return 'ovulation';
  } else {
    return 'luteal';
  }
};

export const getCycleDay = (lastPeriodDate: Date, cycleLength: number = 28): number => {
  const today = new Date();
  const daysSinceLastPeriod = differenceInDays(today, lastPeriodDate);
  return (daysSinceLastPeriod % cycleLength) + 1;
};

export const getPredictedPeriodDates = (lastPeriodDate: Date, cycleLength: number = 28): Date[] => {
  const dates = [];
  const baseDate = new Date(lastPeriodDate);
  
  // Get next 3 predicted cycles
  for (let cycle = 1; cycle <= 3; cycle++) {
    const nextPeriod = new Date(baseDate);
    nextPeriod.setDate(nextPeriod.getDate() + (cycle * cycleLength));
    dates.push(nextPeriod);
  }
  
  return dates;
};

export const getPredictedOvulationDates = (lastPeriodDate: Date, cycleLength: number = 28): Date[] => {
  const dates = [];
  const baseDate = new Date(lastPeriodDate);
  
  // Get next 3 predicted ovulation dates (typically day 14 of cycle)
  for (let cycle = 0; cycle <= 2; cycle++) {
    const ovulationDate = new Date(baseDate);
    ovulationDate.setDate(ovulationDate.getDate() + (cycle * cycleLength) + 13); // Day 14
    dates.push(ovulationDate);
  }
  
  return dates;
};
