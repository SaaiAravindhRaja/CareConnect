import { useState, useEffect } from 'react';
import { getInteractions, createInteraction, deleteInteraction as deleteInteractionApi } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Interaction, InteractionFormData } from '../types';

export function useInteractions(recipientId: string | undefined) {
  const { caregiver } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipientId) {
      loadInteractions();
    } else {
      setLoading(false);
    }
  }, [recipientId]);

  const loadInteractions = async () => {
    if (!recipientId) return;
    try {
      setLoading(true);
      const data = await getInteractions(recipientId);
      setInteractions(data as Interaction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interactions');
    } finally {
      setLoading(false);
    }
  };

  const addInteraction = async (
    formData: InteractionFormData,
    photoUrls: string[] = [],
    aiInsights?: string
  ) => {
    if (!recipientId || !caregiver) throw new Error('Missing recipient or caregiver');
    try {
      const interaction = await createInteraction({
        recipient_id: recipientId,
        caregiver_id: caregiver.id,
        activity_type: formData.activity_type,
        title: formData.title,
        description: formData.description,
        mood_rating: formData.mood_rating,
        success_level: formData.success_level,
        energy_level: formData.energy_level,
        tags: formData.tags,
        photos: photoUrls,
        ai_insights: aiInsights,
      });
      setInteractions((prev) => [interaction as Interaction, ...prev]);
      return interaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create interaction');
      throw err;
    }
  };

  const deleteInteraction = async (interactionId: string) => {
    try {
      await deleteInteractionApi(interactionId);
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete interaction');
      throw err;
    }
  };

  // Get stats for dashboard
  const stats = {
    total: interactions.length,
    thisWeek: interactions.filter((i) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(i.created_at) > weekAgo;
    }).length,
    averageMood:
      interactions.length > 0
        ? interactions.reduce((sum, i) => sum + (i.mood_rating || 0), 0) / interactions.length
        : 0,
    averageSuccess:
      interactions.length > 0
        ? interactions.reduce((sum, i) => sum + (i.success_level || 0), 0) / interactions.length
        : 0,
    byActivityType: interactions.reduce(
      (acc, i) => {
        acc[i.activity_type] = (acc[i.activity_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    recentSuccessful: interactions.filter((i) => (i.success_level || 0) >= 4).slice(0, 5),
    beautifulMoments: interactions.filter(
      (i) => (i.mood_rating || 0) >= 4 && (i.success_level || 0) >= 4
    ),
  };

  return { interactions, loading, error, refresh: loadInteractions, addInteraction, deleteInteraction, stats };
}
