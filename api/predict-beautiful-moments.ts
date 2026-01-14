import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Interaction {
  id: string;
  created_at: string;
  activity_type: string;
  mood_rating?: number;
  success_level?: number;
  tags?: string[];
}

interface ActivityPrediction {
  activity_type: string;
  time_of_day: string;
  day_of_week: string;
  success_probability: number;
  beautiful_moment_rate: number;
  sample_size: number;
  confidence_level: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface PredictionResult {
  predictions: ActivityPrediction[];
  best_times: {
    morning: ActivityPrediction[];
    afternoon: ActivityPrediction[];
    evening: ActivityPrediction[];
  };
  best_activities: ActivityPrediction[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { interactions } = req.body as { interactions: Interaction[] };

    if (!interactions || !Array.isArray(interactions)) {
      return res.status(400).json({ error: 'Missing or invalid interactions data' });
    }

    // Need at least 10 interactions for meaningful predictions
    if (interactions.length < 10) {
      return res.status(200).json({
        predictions: [],
        best_times: { morning: [], afternoon: [], evening: [] },
        best_activities: [],
        message: 'Need more interaction history for predictions (minimum 10 interactions)',
      });
    }

    const result = analyzePredictions(interactions);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in predict-beautiful-moments endpoint:', error);
    return res.status(500).json({
      error: 'Failed to generate predictions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function analyzePredictions(interactions: Interaction[]): PredictionResult {
  // Build activity pattern map
  const patternMap = new Map<string, {
    total: number;
    successful: number;
    beautiful: number;
    interactions: Interaction[];
  }>();

  interactions.forEach((interaction) => {
    const date = new Date(interaction.created_at);
    const hour = date.getHours();
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Determine time of day
    let timeOfDay: string;
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    // Create pattern key
    const patternKey = `${interaction.activity_type}|${timeOfDay}|${dayOfWeek}`;

    if (!patternMap.has(patternKey)) {
      patternMap.set(patternKey, {
        total: 0,
        successful: 0,
        beautiful: 0,
        interactions: [],
      });
    }

    const pattern = patternMap.get(patternKey)!;
    pattern.total += 1;
    pattern.interactions.push(interaction);

    // Count successful interactions (success_level >= 4 OR mood_rating >= 4)
    if ((interaction.success_level || 0) >= 4 || (interaction.mood_rating || 0) >= 4) {
      pattern.successful += 1;
    }

    // Count beautiful moments (both success_level >= 4 AND mood_rating >= 4)
    if ((interaction.success_level || 0) >= 4 && (interaction.mood_rating || 0) >= 4) {
      pattern.beautiful += 1;
    }
  });

  // Generate predictions
  const predictions: ActivityPrediction[] = [];

  patternMap.forEach((data, key) => {
    const [activity_type, time_of_day, day_of_week] = key.split('|');

    const success_probability = data.total > 0 ? data.successful / data.total : 0;
    const beautiful_moment_rate = data.total > 0 ? data.beautiful / data.total : 0;

    // Determine confidence level based on sample size
    let confidence_level: 'high' | 'medium' | 'low';
    if (data.total >= 5) {
      confidence_level = 'high';
    } else if (data.total >= 3) {
      confidence_level = 'medium';
    } else {
      confidence_level = 'low';
    }

    // Generate recommendation
    let recommendation = '';
    if (beautiful_moment_rate >= 0.7) {
      recommendation = `Excellent choice! ${Math.round(beautiful_moment_rate * 100)}% beautiful moment rate`;
    } else if (beautiful_moment_rate >= 0.5) {
      recommendation = `Good option with ${Math.round(beautiful_moment_rate * 100)}% success rate`;
    } else if (beautiful_moment_rate >= 0.3) {
      recommendation = `Moderate success - consider timing or approach adjustments`;
    } else {
      recommendation = `Try a different time or activity combination`;
    }

    predictions.push({
      activity_type,
      time_of_day,
      day_of_week,
      success_probability,
      beautiful_moment_rate,
      sample_size: data.total,
      confidence_level,
      recommendation,
    });
  });

  // Sort by beautiful moment rate
  predictions.sort((a, b) => b.beautiful_moment_rate - a.beautiful_moment_rate);

  // Get best times
  const best_times = {
    morning: predictions
      .filter((p) => p.time_of_day === 'morning' && p.sample_size >= 2)
      .slice(0, 5),
    afternoon: predictions
      .filter((p) => p.time_of_day === 'afternoon' && p.sample_size >= 2)
      .slice(0, 5),
    evening: predictions
      .filter((p) => p.time_of_day === 'evening' && p.sample_size >= 2)
      .slice(0, 5),
  };

  // Get overall best activities (high confidence only)
  const best_activities = predictions
    .filter((p) => p.confidence_level === 'high' && p.beautiful_moment_rate >= 0.5)
    .slice(0, 10);

  return {
    predictions,
    best_times,
    best_activities,
  };
}
