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
    return res.status(200).json({ preferences: [] });
  }

  try {
    const { interaction, existingPreferences } = req.body;

    if (!interaction) {
      return res.status(400).json({ error: 'Missing interaction data' });
    }

    const existingKeys = (existingPreferences || []).map((p: any) => p.preference_key);

    const prompt = `Analyze this care interaction and extract any preferences or patterns that could help future care.

Interaction:
- Type: ${interaction.activity_type}
- Title: ${interaction.title || 'N/A'}
- Description: ${interaction.description || 'N/A'}
- Mood Rating: ${interaction.mood_rating}/5
- Success Level: ${interaction.success_level}/5
- Tags: ${interaction.tags?.join(', ') || 'None'}

Already Known Preferences (don't duplicate these):
${existingKeys.join(', ') || 'None'}

Extract NEW preferences only. Consider:
- Activity preferences (what they enjoy)
- Communication preferences (how they like to interact)
- Routine preferences (timing, duration)
- Dignity notes (what makes them feel respected)
- Food preferences
- Music preferences
- Social preferences

Respond in JSON format:
{
  "preferences": [
    {
      "category": "activity|communication|routine|dignity|food|music|social|other",
      "preference_key": "short key name",
      "preference_value": "detailed description",
      "confidence_score": 0.0-1.0 (based on how strong the evidence is)
    }
  ]
}

Only include preferences with confidence >= 0.5. Return empty array if no clear preferences can be extracted.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.status(200).json({ preferences: [] });
    }

    const parsed = JSON.parse(content);
    return res.status(200).json({ preferences: parsed.preferences || [] });
  } catch (error) {
    console.error('Error in extract-preferences endpoint:', error);
    return res.status(500).json({
      error: 'Failed to extract preferences',
      message: error instanceof Error ? error.message : 'Unknown error',
      preferences: []
    });
  }
}
