
interface AdviceItem {
  emoji: string;
  category: string;
  advice: string;
}

interface PhaseAdvice {
  description: string;
  energyLevel: number; // 1-5 scale
  do: AdviceItem[];
  avoid: AdviceItem[];
}

export const getPhaseAdvice = (phase: string): PhaseAdvice => {
  switch (phase) {
    case 'menstrual':
      return {
        description: "Time for rest, reflection, and gentle self-care. Honor your body's need for slower movement.",
        energyLevel: 2,
        do: [
          {
            emoji: '🛌',
            category: 'Rest',
            advice: 'Prioritize sleep and gentle stretching. Your body is working hard.'
          },
          {
            emoji: '🍲',
            category: 'Nutrition',
            advice: 'Warm, iron-rich foods like lentils, spinach, and warming soups.'
          },
          {
            emoji: '🧘‍♀️',
            category: 'Wellness',
            advice: 'Practice mindfulness, journaling, or gentle yoga. Honor your emotions.'
          },
          {
            emoji: '💝',
            category: 'Self-Care',
            advice: 'Use a heating pad, take warm baths, and be extra kind to yourself.'
          }
        ],
        avoid: [
          {
            emoji: '🏃‍♀️',
            category: 'Exercise',
            advice: 'Avoid intense workouts. Your energy is naturally lower right now.'
          },
          {
            emoji: '❄️',
            category: 'Food',
            advice: 'Cold foods and drinks that can worsen cramps and reduce circulation.'
          },
          {
            emoji: '📱',
            category: 'Social',
            advice: 'Overwhelming social commitments. It\'s okay to say no and stay in.'
          },
          {
            emoji: '💼',
            category: 'Work',
            advice: 'Starting major projects or making big decisions. Focus on wrapping up tasks.'
          }
        ]
      };

    case 'follicular':
      return {
        description: "Rising energy and optimism! Great time for new beginnings and creative projects.",
        energyLevel: 4,
        do: [
          {
            emoji: '💡',
            category: 'Creativity',
            advice: 'Start new projects, brainstorm ideas, and engage in creative pursuits.'
          },
          {
            emoji: '👥',
            category: 'Social',
            advice: 'Schedule social activities and networking. You\'re naturally more outgoing.'
          },
          {
            emoji: '🥗',
            category: 'Nutrition',
            advice: 'Fresh, light foods like salads, fruits, and lean proteins support rising energy.'
          },
          {
            emoji: '📚',
            category: 'Learning',
            advice: 'Take on new learning opportunities. Your brain is primed for absorbing information.'
          }
        ],
        avoid: [
          {
            emoji: '😴',
            category: 'Energy',
            advice: 'Wasting this high-energy phase on passive activities. Use it wisely!'
          },
          {
            emoji: '🍔',
            category: 'Food',
            advice: 'Heavy, processed foods that can weigh down your naturally light energy.'
          },
          {
            emoji: '🏠',
            category: 'Isolation',
            advice: 'Staying isolated when you have natural social energy to share.'
          },
          {
            emoji: '⏰',
            category: 'Procrastination',
            advice: 'Putting off important tasks. Your motivation is naturally high now.'
          }
        ]
      };

    case 'ovulation':
      return {
        description: "Peak confidence and communication! Time for important conversations and bold moves.",
        energyLevel: 5,
        do: [
          {
            emoji: '💬',
            category: 'Communication',
            advice: 'Have important conversations, presentations, or negotiations. You\'re most persuasive now.'
          },
          {
            emoji: '💪',
            category: 'Exercise',
            advice: 'High-intensity workouts, strength training, or trying new fitness challenges.'
          },
          {
            emoji: '🤝',
            category: 'Relationships',
            advice: 'Connect with others, go on dates, or strengthen existing relationships.'
          },
          {
            emoji: '🎯',
            category: 'Goals',
            advice: 'Make important decisions and take calculated risks. Your intuition is sharp.'
          }
        ],
        avoid: [
          {
            emoji: '🤐',
            category: 'Communication',
            advice: 'Avoiding difficult conversations you\'ve been putting off. Now is the time!'
          },
          {
            emoji: '🛋️',
            category: 'Passivity',
            advice: 'Being passive when you have natural leadership energy available.'
          },
          {
            emoji: '🙅‍♀️',
            category: 'Self-Doubt',
            advice: 'Second-guessing yourself. Trust your heightened intuition and confidence.'
          },
          {
            emoji: '📴',
            category: 'Isolation',
            advice: 'Hiding your light. This is your time to shine and be seen.'
          }
        ]
      };

    case 'luteal':
      return {
        description: "Preparing for introspection. Time to complete projects and prepare for rest.",
        energyLevel: 3,
        do: [
          {
            emoji: '✅',
            category: 'Completion',
            advice: 'Finish ongoing projects and tie up loose ends before your next cycle.'
          },
          {
            emoji: '🥜',
            category: 'Nutrition',
            advice: 'Magnesium-rich foods like dark chocolate, nuts, and seeds for mood support.'
          },
          {
            emoji: '🏡',
            category: 'Organization',
            advice: 'Organize your space and life. You have natural nesting instincts now.'
          },
          {
            emoji: '🧘‍♀️',
            category: 'Self-Care',
            advice: 'Practice stress-reduction techniques and prepare for your upcoming rest phase.'
          }
        ],
        avoid: [
          {
            emoji: '🆕',
            category: 'New Projects',
            advice: 'Starting major new commitments. Focus on completing what you\'ve started.'
          },
          {
            emoji: '🍷',
            category: 'Substances',
            advice: 'Excess alcohol or caffeine which can worsen PMS symptoms.'
          },
          {
            emoji: '😤',
            category: 'Stress',
            advice: 'Overcommitting socially. You may need more alone time to recharge.'
          },
          {
            emoji: '🎭',
            category: 'People-Pleasing',
            advice: 'Saying yes to everything. Practice setting boundaries as your energy naturally turns inward.'
          }
        ]
      };

    default:
      return {
        description: "Track your cycle to receive personalized daily guidance.",
        energyLevel: 3,
        do: [
          {
            emoji: '📱',
            category: 'Tracking',
            advice: 'Log your period dates to get personalized cycle insights.'
          }
        ],
        avoid: [
          {
            emoji: '🤷‍♀️',
            category: 'Guessing',
            advice: 'Making assumptions about your cycle without tracking data.'
          }
        ]
      };
  }
};
