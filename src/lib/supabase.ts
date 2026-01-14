import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Auth helpers
export const signUp = async (email: string, password: string, name: string) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned from signup');

  // Create caregiver profile
  const { error: profileError } = await supabase.from('caregivers').insert({
    user_id: authData.user.id,
    name,
    email,
  });

  if (profileError) throw profileError;

  return authData;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCaregiver = async (userId: string) => {
  const { data, error } = await supabase
    .from('caregivers')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
};

// Care recipient helpers
export const getCareRecipients = async (caregiverId: string) => {
  const { data, error } = await supabase
    .from('care_relationships')
    .select(`
      recipient_id,
      relationship_type,
      care_recipients (*)
    `)
    .eq('caregiver_id', caregiverId);
  if (error) throw error;
  return data;
};

export const getCareRecipient = async (recipientId: string) => {
  const { data, error } = await supabase
    .from('care_recipients')
    .select('*')
    .eq('id', recipientId)
    .single();
  if (error) throw error;
  return data;
};

export const createCareRecipient = async (
  recipientData: {
    name: string;
    age?: number;
    profile_photo?: string;
    communication_style?: string;
    important_notes?: string;
  },
  caregiverId: string,
  userId: string
) => {
  // Create recipient
  const { data: recipient, error: recipientError } = await supabase
    .from('care_recipients')
    .insert({
      ...recipientData,
      created_by: userId,
    })
    .select()
    .single();

  if (recipientError) throw recipientError;

  // Create relationship
  const { error: relationError } = await supabase
    .from('care_relationships')
    .insert({
      caregiver_id: caregiverId,
      recipient_id: recipient.id,
      relationship_type: 'primary',
    });

  if (relationError) throw relationError;

  return recipient;
};

// Interaction helpers
export const getInteractions = async (recipientId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

export const createInteraction = async (interaction: {
  recipient_id: string;
  caregiver_id: string;
  activity_type: string;
  title?: string;
  description?: string;
  mood_rating?: number;
  success_level?: number;
  energy_level?: number;
  tags?: string[];
  photos?: string[];
  ai_insights?: string;
}) => {
  const { data, error } = await supabase
    .from('interactions')
    .insert(interaction)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Preference helpers
export const getPreferences = async (recipientId: string) => {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('confidence_score', { ascending: false });
  if (error) throw error;
  return data;
};

export const createPreference = async (preference: {
  recipient_id: string;
  category: string;
  preference_key: string;
  preference_value: string;
  confidence_score?: number;
  source?: string;
}) => {
  const { data, error } = await supabase
    .from('preferences')
    .insert(preference)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePreference = async (
  preferenceId: string,
  updates: Partial<{
    preference_value: string;
    confidence_score: number;
    last_confirmed: string;
  }>
) => {
  const { data, error } = await supabase
    .from('preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', preferenceId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Suggestion helpers
export const getSuggestions = async (recipientId: string, status?: string) => {
  let query = supabase
    .from('activity_suggestions')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createSuggestion = async (suggestion: {
  recipient_id: string;
  suggestion_text: string;
  reasoning?: string;
  context?: Record<string, unknown>;
}) => {
  const { data, error } = await supabase
    .from('activity_suggestions')
    .insert(suggestion)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSuggestionStatus = async (
  suggestionId: string,
  status: 'accepted' | 'rejected' | 'completed',
  feedback?: string
) => {
  const { data, error } = await supabase
    .from('activity_suggestions')
    .update({ status, feedback })
    .eq('id', suggestionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Storage helpers
export const uploadPhoto = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(path, file);
  if (error) throw error;
  return data;
};

export const getPhotoUrl = (path: string) => {
  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
};
