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
    return res.status(200).json({ insight: null });
  }

  try {
    const { interaction } = req.body;

    if (!interaction) {
      return res.status(400).json({ error: 'Missing interaction data' });
    }

    const prompt = `Generate a brief, warm insight from this caregiving moment:

Activity: ${interaction.activity_type}
Title: ${interaction.title || 'N/A'}
Description: ${interaction.description || 'N/A'}
Mood: ${interaction.mood_rating}/5
Success: ${interaction.success_level}/5

Write 1-2 sentences highlighting what made this moment special or what can be learned for future care. Be warm and encouraging. Keep it under 100 characters.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const insight = response.choices[0]?.message?.content || null;
    return res.status(200).json({ insight });
  } catch (error) {
    console.error('Error in generate-insight endpoint:', error);
    return res.status(500).json({
      error: 'Failed to generate insight',
      message: error instanceof Error ? error.message : 'Unknown error',
      insight: null
    });
  }
}
