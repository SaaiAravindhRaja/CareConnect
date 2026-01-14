import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface Interaction {
  id: string;
  created_at: string;
  activity_type: string;
  description?: string;
  mood_rating?: number;
  success_level?: number;
  energy_level?: number;
}

interface BurnoutAnalysis {
  riskScore: number;
  signals: string[];
  recommendations: string[];
  aiInsight?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { interactions } = req.body as { interactions: Interaction[] };

    if (!interactions || !Array.isArray(interactions)) {
      return res.status(400).json({ error: 'Missing or invalid interactions data' });
    }

    // Calculate burnout signals
    const analysis = calculateBurnoutRisk(interactions);

    // If OpenAI is configured and risk is high, get personalized recommendations
    if (openai && analysis.riskScore >= 40) {
      try {
        const aiInsight = await generateBurnoutInsights(interactions, analysis);
        analysis.aiInsight = aiInsight;
      } catch (error) {
        console.error('Error generating AI insights:', error);
        // Continue without AI insights
      }
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in analyze-burnout endpoint:', error);
    return res.status(500).json({
      error: 'Failed to analyze burnout risk',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function calculateBurnoutRisk(interactions: Interaction[]): BurnoutAnalysis {
  const signals: string[] = [];
  let riskScore = 0;
  const recommendations: string[] = [];

  // Need at least 7 interactions to detect patterns
  if (interactions.length < 7) {
    return {
      riskScore: 0,
      signals: ['Not enough data to analyze burnout patterns'],
      recommendations: ['Keep logging moments to build your caregiving insights'],
    };
  }

  // Sort by date (newest first)
  const sorted = [...interactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate time periods
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const last7Days = sorted.filter((i) => new Date(i.created_at) > sevenDaysAgo);
  const previous7Days = sorted.filter(
    (i) => new Date(i.created_at) > fourteenDaysAgo && new Date(i.created_at) <= sevenDaysAgo
  );

  // Signal 1: Declining interaction frequency
  if (previous7Days.length > 0) {
    const frequencyDecline = (previous7Days.length - last7Days.length) / previous7Days.length;
    if (frequencyDecline > 0.3) {
      const declinePercent = Math.round(frequencyDecline * 100);
      signals.push(`Interaction frequency decreased by ${declinePercent}%`);
      riskScore += frequencyDecline * 30; // Max 30 points
      recommendations.push('Consider setting reminders to maintain regular interactions');
    }
  }

  // Signal 2: Lower success ratings trend
  const recentSuccess = last7Days
    .filter((i) => i.success_level !== undefined)
    .map((i) => i.success_level!);
  const previousSuccess = previous7Days
    .filter((i) => i.success_level !== undefined)
    .map((i) => i.success_level!);

  if (recentSuccess.length > 0 && previousSuccess.length > 0) {
    const avgRecentSuccess = recentSuccess.reduce((a, b) => a + b, 0) / recentSuccess.length;
    const avgPreviousSuccess = previousSuccess.reduce((a, b) => a + b, 0) / previousSuccess.length;
    const successDecline = avgPreviousSuccess - avgRecentSuccess;

    if (successDecline > 0.5) {
      signals.push(`Success ratings dropped by ${successDecline.toFixed(1)} points`);
      riskScore += successDecline * 15; // Max 15 points for 1 point drop
      recommendations.push('Try revisiting activities that worked well in the past');
    }
  }

  // Signal 3: Declining mood ratings
  const recentMood = last7Days
    .filter((i) => i.mood_rating !== undefined)
    .map((i) => i.mood_rating!);
  const previousMood = previous7Days
    .filter((i) => i.mood_rating !== undefined)
    .map((i) => i.mood_rating!);

  if (recentMood.length > 0 && previousMood.length > 0) {
    const avgRecentMood = recentMood.reduce((a, b) => a + b, 0) / recentMood.length;
    const avgPreviousMood = previousMood.reduce((a, b) => a + b, 0) / previousMood.length;
    const moodDecline = avgPreviousMood - avgRecentMood;

    if (moodDecline > 0.5) {
      signals.push(`Overall mood decreased by ${moodDecline.toFixed(1)} points`);
      riskScore += moodDecline * 12; // Max 12 points
      recommendations.push('Focus on mood-boosting activities and self-care');
    }
  }

  // Signal 4: Shorter descriptions (less engagement)
  const recentDescriptions = last7Days
    .filter((i) => i.description)
    .map((i) => i.description!.length);
  const previousDescriptions = previous7Days
    .filter((i) => i.description)
    .map((i) => i.description!.length);

  if (recentDescriptions.length > 0 && previousDescriptions.length > 0) {
    const avgRecentLength = recentDescriptions.reduce((a, b) => a + b, 0) / recentDescriptions.length;
    const avgPreviousLength =
      previousDescriptions.reduce((a, b) => a + b, 0) / previousDescriptions.length;
    const lengthDecline = (avgPreviousLength - avgRecentLength) / avgPreviousLength;

    if (lengthDecline > 0.3) {
      const declinePercent = Math.round(lengthDecline * 100);
      signals.push(`Journal entries ${declinePercent}% shorter, indicating less engagement`);
      riskScore += lengthDecline * 20; // Max 20 points
      recommendations.push('Take time to reflect and write detailed notes about your experiences');
    }
  }

  // Signal 5: Increasing time gaps between interactions
  if (last7Days.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < last7Days.length - 1; i++) {
      const gap =
        new Date(last7Days[i].created_at).getTime() -
        new Date(last7Days[i + 1].created_at).getTime();
      gaps.push(gap / (1000 * 60 * 60)); // Convert to hours
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const maxGap = Math.max(...gaps);

    if (maxGap > 72) {
      // 3 days
      const daysGap = Math.round(maxGap / 24);
      signals.push(`${daysGap}-day gap between interactions detected`);
      riskScore += 15;
      recommendations.push('Try to maintain more consistent interaction patterns');
    }
  }

  // Signal 6: Low energy levels
  const recentEnergy = last7Days
    .filter((i) => i.energy_level !== undefined)
    .map((i) => i.energy_level!);

  if (recentEnergy.length > 0) {
    const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length;
    if (avgEnergy < 2.5) {
      signals.push(`Low energy levels averaging ${avgEnergy.toFixed(1)}/5`);
      riskScore += 15;
      recommendations.push('Prioritize rest and consider asking for support from others');
    }
  }

  // Cap risk score at 100
  riskScore = Math.min(Math.round(riskScore), 100);

  // Add general recommendations based on risk level
  if (riskScore >= 60) {
    recommendations.unshift('⚠️ High burnout risk detected - consider taking a break');
    recommendations.push('Reach out to family or friends for support');
    recommendations.push('Schedule time for self-care activities');
  } else if (riskScore >= 40) {
    recommendations.unshift('Moderate burnout risk - monitor your wellbeing closely');
    recommendations.push('Celebrate small wins and positive moments');
  } else if (riskScore >= 20) {
    recommendations.push('Keep up the great work!');
    recommendations.push('Remember to take breaks when needed');
  } else {
    recommendations.push('You\'re doing amazing! Keep nurturing yourself and your loved one');
  }

  // If no signals detected, provide positive feedback
  if (signals.length === 0) {
    signals.push('No burnout signals detected - you\'re maintaining healthy caregiving patterns');
  }

  return {
    riskScore,
    signals,
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
}

async function generateBurnoutInsights(
  interactions: Interaction[],
  analysis: BurnoutAnalysis
): Promise<string> {
  if (!openai) return '';

  const recentInteractions = interactions.slice(0, 10);
  const summary = `Recent caregiving pattern:
- ${recentInteractions.length} interactions logged
- Average mood: ${
    recentInteractions.filter((i) => i.mood_rating).length > 0
      ? (
          recentInteractions
            .filter((i) => i.mood_rating)
            .reduce((sum, i) => sum + (i.mood_rating || 0), 0) /
          recentInteractions.filter((i) => i.mood_rating).length
        ).toFixed(1)
      : 'N/A'
  }/5
- Burnout risk score: ${analysis.riskScore}/100
- Detected signals: ${analysis.signals.join(', ')}`;

  const prompt = `As a compassionate caregiving coach, provide a brief, warm, personalized insight (2-3 sentences, max 150 characters) about this caregiver's burnout risk:

${summary}

Focus on encouragement and actionable self-care advice. Be empathetic but concise.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 80,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating AI insight:', error);
    return '';
  }
}
