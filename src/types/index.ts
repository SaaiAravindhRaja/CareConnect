export interface CareRecipient {
  id: string;
  name: string;
  age: number | null;
  profile_photo: string | null;
  communication_style: string | null;
  important_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Caregiver {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  role: string;
  created_at: string;
}

export interface CareRelationship {
  id: string;
  caregiver_id: string;
  recipient_id: string;
  relationship_type: string;
  permissions: string[];
  created_at: string;
}

export interface Interaction {
  id: string;
  recipient_id: string;
  caregiver_id: string;
  activity_type: ActivityType;
  title: string | null;
  description: string | null;
  mood_rating: number | null;
  success_level: number | null;
  energy_level: number | null;
  tags: string[];
  photos: string[];
  ai_insights: string | null;
  created_at: string;
}

export interface Preference {
  id: string;
  recipient_id: string;
  category: PreferenceCategory;
  preference_key: string;
  preference_value: string;
  confidence_score: number;
  source: 'manual' | 'ai_learned';
  last_confirmed: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivitySuggestion {
  id: string;
  recipient_id: string;
  suggestion_text: string;
  reasoning: string | null;
  context: Record<string, unknown> | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  feedback: string | null;
  created_at: string;
}

export type ActivityType = 'conversation' | 'activity' | 'meal' | 'outing' | 'exercise' | 'relaxation' | 'social' | 'other';

export type PreferenceCategory = 'activity' | 'communication' | 'routine' | 'dignity' | 'food' | 'music' | 'social' | 'other';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  caregiver: Caregiver | null;
  loading: boolean;
  error: string | null;
}

// Form types
export interface InteractionFormData {
  activity_type: ActivityType;
  title: string;
  description: string;
  mood_rating: MoodLevel;
  success_level: MoodLevel;
  energy_level: MoodLevel;
  tags: string[];
  photos: File[];
}

export interface RecipientFormData {
  name: string;
  age: number | null;
  profile_photo: File | null;
  communication_style: string;
  important_notes: string;
}

// AI types
export interface AISuggestionRequest {
  recipientId: string;
  recentInteractions: Interaction[];
  preferences: Preference[];
  currentMood?: MoodLevel;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface AISuggestionResponse {
  suggestions: {
    activity: string;
    reasoning: string;
    estimated_duration: string;
    confidence: number;
  }[];
}
