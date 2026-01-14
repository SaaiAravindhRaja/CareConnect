import type { Interaction, Preference, AISuggestionResponse, MoodLevel } from '../types';

export const generateActivitySuggestions = async (
  recipientName: string,
  recentInteractions: Interaction[],
  preferences: Preference[],
  currentMood?: MoodLevel,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning'
): Promise<AISuggestionResponse> => {
  try {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientName,
        recentInteractions,
        preferences,
        currentMood,
        timeOfDay,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating suggestions:', error);
    // Fallback to mock suggestions
    return getMockSuggestions(recipientName, timeOfDay);
  }
};

export const extractPreferencesFromInteraction = async (
  interaction: Interaction,
  existingPreferences: Preference[]
): Promise<
  {
    category: string;
    preference_key: string;
    preference_value: string;
    confidence_score: number;
  }[]
> => {
  try {
    const response = await fetch('/api/extract-preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interaction,
        existingPreferences,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.preferences || [];
  } catch (error) {
    console.error('Error extracting preferences:', error);
    return [];
  }
};

export const generateInsightsFromInteraction = async (
  interaction: Interaction
): Promise<string | null> => {
  try {
    const response = await fetch('/api/generate-insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interaction,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.insight || null;
  } catch (error) {
    console.error('Error generating insights:', error);
    return null;
  }
};

export interface BurnoutAnalysis {
  riskScore: number;
  signals: string[];
  recommendations: string[];
  aiInsight?: string;
}

export const analyzeCaregiverBurnout = async (
  interactions: Interaction[]
): Promise<BurnoutAnalysis> => {
  try {
    const response = await fetch('/api/analyze-burnout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interactions,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing burnout:', error);
    // Fallback to basic analysis
    return {
      riskScore: 0,
      signals: ['Unable to analyze burnout risk at this time'],
      recommendations: ['Keep logging your caregiving moments to build insights'],
    };
  }
};

// Mock suggestions for when API is not available
function getMockSuggestions(
  recipientName: string,
  timeOfDay: string
): AISuggestionResponse {
  const suggestions: Record<string, AISuggestionResponse['suggestions']> = {
    morning: [
      {
        activity: 'Gentle morning stretches',
        reasoning: `A calm way to start the day. Morning movement can help ${recipientName} feel energized and alert.`,
        estimated_duration: '10-15 minutes',
        confidence: 0.8,
      },
      {
        activity: 'Share breakfast together',
        reasoning: 'Mealtimes are wonderful opportunities for connection and conversation.',
        estimated_duration: '20-30 minutes',
        confidence: 0.9,
      },
      {
        activity: 'Listen to favorite morning music',
        reasoning: 'Music can uplift mood and bring back fond memories.',
        estimated_duration: '15-20 minutes',
        confidence: 0.7,
      },
    ],
    afternoon: [
      {
        activity: 'Look through photo albums',
        reasoning: `Reminiscing about happy memories can be meaningful and spark conversation with ${recipientName}.`,
        estimated_duration: '20-30 minutes',
        confidence: 0.85,
      },
      {
        activity: 'Take a short walk',
        reasoning: 'Fresh air and gentle movement can improve mood and energy.',
        estimated_duration: '15-20 minutes',
        confidence: 0.75,
      },
      {
        activity: 'Work on a simple puzzle',
        reasoning: 'Engaging activities that can be done together promote connection.',
        estimated_duration: '20-40 minutes',
        confidence: 0.7,
      },
    ],
    evening: [
      {
        activity: 'Watch a favorite show together',
        reasoning: 'Relaxing activities in the evening can help wind down the day.',
        estimated_duration: '30-60 minutes',
        confidence: 0.8,
      },
      {
        activity: 'Have a calming tea time',
        reasoning: 'A warm drink and quiet conversation creates peaceful moments.',
        estimated_duration: '15-20 minutes',
        confidence: 0.85,
      },
      {
        activity: 'Read aloud from a favorite book',
        reasoning: 'Gentle storytelling can be soothing and create shared experiences.',
        estimated_duration: '15-30 minutes',
        confidence: 0.75,
      },
    ],
    night: [
      {
        activity: 'Gentle relaxation routine',
        reasoning: 'Consistent nighttime routines can promote better rest.',
        estimated_duration: '10-15 minutes',
        confidence: 0.9,
      },
      {
        activity: 'Soft music before bed',
        reasoning: 'Calming sounds can help transition to restful sleep.',
        estimated_duration: '15-20 minutes',
        confidence: 0.8,
      },
      {
        activity: 'Share a gratitude moment',
        reasoning: 'Reflecting on good moments from the day ends things on a positive note.',
        estimated_duration: '5-10 minutes',
        confidence: 0.85,
      },
    ],
  };

  return { suggestions: suggestions[timeOfDay] || suggestions.afternoon };
}
