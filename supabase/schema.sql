-- CareConnect Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Care Recipients
CREATE TABLE IF NOT EXISTS care_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  profile_photo TEXT,
  communication_style TEXT,
  important_notes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregivers (linked to auth.users)
CREATE TABLE IF NOT EXISTS caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care Relationships
CREATE TABLE IF NOT EXISTS care_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id UUID REFERENCES caregivers ON DELETE CASCADE,
  recipient_id UUID REFERENCES care_recipients ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'primary',
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, recipient_id)
);

-- Interactions (Memory Book)
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES care_recipients ON DELETE CASCADE,
  caregiver_id UUID REFERENCES caregivers ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  success_level INTEGER CHECK (success_level BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preferences
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES care_recipients ON DELETE CASCADE,
  category TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  source TEXT DEFAULT 'manual',
  last_confirmed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Suggestions
CREATE TABLE IF NOT EXISTS activity_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES care_recipients ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  reasoning TEXT,
  context JSONB,
  status TEXT DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_recipient ON interactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preferences_recipient ON preferences(recipient_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_recipient ON activity_suggestions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_care_relationships_caregiver ON care_relationships(caregiver_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_suggestions ENABLE ROW LEVEL SECURITY;

-- Caregivers: users can only access their own caregiver profile
CREATE POLICY "Users can view own caregiver profile" ON caregivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own caregiver profile" ON caregivers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own caregiver profile" ON caregivers
  FOR UPDATE USING (auth.uid() = user_id);

-- Care Recipients: accessible through care relationships
CREATE POLICY "Caregivers can view their care recipients" ON care_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = care_recipients.id
      AND cg.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create care recipients" ON care_recipients
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Caregivers can update their care recipients" ON care_recipients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = care_recipients.id
      AND cg.user_id = auth.uid()
      AND 'write' = ANY(cr.permissions)
    )
  );

-- Care Relationships
CREATE POLICY "Caregivers can view their relationships" ON care_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM caregivers cg
      WHERE cg.id = care_relationships.caregiver_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can create relationships" ON care_relationships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregivers cg
      WHERE cg.id = care_relationships.caregiver_id
      AND cg.user_id = auth.uid()
    )
  );

-- Interactions: accessible through care relationships
CREATE POLICY "Caregivers can view interactions" ON interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = interactions.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can create interactions" ON interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregivers cg
      WHERE cg.id = interactions.caregiver_id
      AND cg.user_id = auth.uid()
    )
  );

-- Preferences: accessible through care relationships
CREATE POLICY "Caregivers can view preferences" ON preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = preferences.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can create preferences" ON preferences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = preferences.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can update preferences" ON preferences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = preferences.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

-- Activity Suggestions: accessible through care relationships
CREATE POLICY "Caregivers can view suggestions" ON activity_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = activity_suggestions.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can create suggestions" ON activity_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = activity_suggestions.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can update suggestions" ON activity_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM care_relationships cr
      JOIN caregivers cg ON cr.caregiver_id = cg.id
      WHERE cr.recipient_id = activity_suggestions.recipient_id
      AND cg.user_id = auth.uid()
    )
  );

-- Create a storage bucket for photos (run this separately in Storage settings)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
