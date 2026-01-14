import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if OpenAI is configured
  if (!openai) {
    return res.status(503).json({ error: 'OpenAI API not configured' });
  }

  try {
    const { recipientName, recentInteractions, preferences, currentMood, timeOfDay } = req.body;

    if (!recipientName || !Array.isArray(recentInteractions) || !Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Filter successful interactions
    const successfulInteractions = recentInteractions
      .filter((i: any) => (i.success_level || 0) >= 4)
      .slice(0, 5);

    // Build preferences summary
    const preferencesSummary = preferences
      .filter((p: any) => p.confidence_score >= 0.6)
      .map((p: any) => `${p.preference_key}: ${p.preference_value}`)
      .join('\n');

    // Build prompt
    const prompt = `You are a compassionate care assistant helping to suggest meaningful activities for a care recipient.

Care Recipient: ${recipientName}
Current Time: ${timeOfDay || 'morning'}
${currentMood ? `Current Mood Level: ${currentMood}/5` : ''}

Known Preferences (high confidence):
${preferencesSummary || 'No established preferences yet'}

Recent Successful Activities:
${
  successfulInteractions.length > 0
    ? successfulInteractions
        .map(
          (i: any) =>
            `- ${i.activity_type}: ${i.title || i.description} (Mood: ${i.mood_rating}/5, Success: ${i.success_level}/5)`
        )
        .join('\n')
    : 'No recent activities logged yet'
}

Based on this information, suggest EXACTLY 3 unique and diverse personalized activities that would be:
1. Meaningful and joyful for ${recipientName}
2. Appropriate for the ${timeOfDay || 'morning'}
3. Respectful of their dignity and preferences
4. Likely to create a positive moment
5. Different from each other (vary activity types)

IMPORTANT: Provide exactly 3 different suggestions, no duplicates.

Respond in JSON format:
{
  "suggestions": [
    {
      "activity": "Brief activity name (max 6 words)",
      "reasoning": "Why this activity would work well right now (1 sentence)",
      "estimated_duration": "e.g., 15-30 minutes",
      "confidence": 0.0-1.0
    }
  ]
}`;

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const suggestions = JSON.parse(content);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error in suggestions endpoint:', error);
    return res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
