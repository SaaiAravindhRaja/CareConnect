import { useState, useEffect } from 'react';
import { getPreferences, createPreference, updatePreference } from '../lib/supabase';
import type { Preference, PreferenceCategory } from '../types';

export function usePreferences(recipientId: string | undefined) {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipientId) {
      loadPreferences();
    } else {
      setLoading(false);
    }
  }, [recipientId]);

  const loadPreferences = async () => {
    if (!recipientId) return;
    try {
      setLoading(true);
      const data = await getPreferences(recipientId);
      setPreferences(data as Preference[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const addPreference = async (data: {
    category: PreferenceCategory;
    preference_key: string;
    preference_value: string;
    confidence_score?: number;
    source?: 'manual' | 'ai_learned';
  }) => {
    if (!recipientId) throw new Error('No recipient selected');
    try {
      const preference = await createPreference({
        recipient_id: recipientId,
        ...data,
      });
      setPreferences((prev) => [...prev, preference as Preference]);
      return preference;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create preference');
      throw err;
    }
  };

  const confirmPreference = async (preferenceId: string) => {
    try {
      const updated = await updatePreference(preferenceId, {
        last_confirmed: new Date().toISOString(),
        confidence_score: 1.0,
      });
      setPreferences((prev) =>
        prev.map((p) => (p.id === preferenceId ? (updated as Preference) : p))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preference');
      throw err;
    }
  };

  // Group preferences by category
  const byCategory = preferences.reduce(
    (acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    },
    {} as Record<string, Preference[]>
  );

  // Get high confidence preferences
  const highConfidence = preferences.filter((p) => p.confidence_score >= 0.7);

  // Get preferences that need confirmation
  const needsConfirmation = preferences.filter((p) => {
    if (!p.last_confirmed) return p.confidence_score < 0.7;
    const lastConfirmed = new Date(p.last_confirmed);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return lastConfirmed < monthAgo;
  });

  return {
    preferences,
    loading,
    error,
    refresh: loadPreferences,
    addPreference,
    confirmPreference,
    byCategory,
    highConfidence,
    needsConfirmation,
  };
}
