import { useState, useEffect } from 'react';
import { getCareRecipients, getCareRecipient, createCareRecipient, updateCareRecipient, deleteCareRecipient } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { CareRecipient } from '../types';

export function useRecipients() {
  const { caregiver } = useAuth();
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caregiver) {
      loadRecipients();
    } else {
      setLoading(false);
    }
  }, [caregiver]);

  const loadRecipients = async () => {
    if (!caregiver) return;
    try {
      setLoading(true);
      const data = await getCareRecipients(caregiver.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipientsList = data
        ?.map((r: any) => r.care_recipients)
        .filter(Boolean) as CareRecipient[];
      setRecipients(recipientsList || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = async (data: {
    name: string;
    age?: number;
    profile_photo?: string;
    communication_style?: string;
    important_notes?: string;
  }) => {
    if (!caregiver) throw new Error('No caregiver logged in');
    try {
      const recipient = await createCareRecipient(data, caregiver.id, caregiver.user_id);
      setRecipients((prev) => [...prev, recipient as CareRecipient]);
      return recipient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipient');
      throw err;
    }
  };

  const updateRecipient = async (
    recipientId: string,
    data: {
      name?: string;
      age?: number;
      communication_style?: string;
      important_notes?: string;
    }
  ) => {
    try {
      const updated = await updateCareRecipient(recipientId, data);
      setRecipients((prev) =>
        prev.map((r) => (r.id === recipientId ? (updated as CareRecipient) : r))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipient');
      throw err;
    }
  };

  const deleteRecipient = async (recipientId: string) => {
    try {
      await deleteCareRecipient(recipientId);
      setRecipients((prev) => prev.filter((r) => r.id !== recipientId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipient');
      throw err;
    }
  };

  return { recipients, loading, error, refresh: loadRecipients, addRecipient, updateRecipient, deleteRecipient };
}

export function useRecipient(recipientId: string | undefined) {
  const [recipient, setRecipient] = useState<CareRecipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipientId) {
      loadRecipient();
    } else {
      setLoading(false);
    }
  }, [recipientId]);

  const loadRecipient = async () => {
    if (!recipientId) return;
    try {
      setLoading(true);
      const data = await getCareRecipient(recipientId);
      setRecipient(data as CareRecipient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipient');
    } finally {
      setLoading(false);
    }
  };

  return { recipient, loading, error, refresh: loadRecipient };
}
